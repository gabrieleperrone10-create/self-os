import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { IDENTITY_PROFILE_PROMPT } from '@/lib/anthropic/prompts/identity-profile';
import { recordAiUsage } from '@/lib/ai/usage';
import type { createClient } from '@/lib/supabase/server';
import type { Checkin, Decision, Pattern, Scan } from '@/types';
import type { ScanReport } from '@/types/scan';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface IdentityProfile {
  id: string;
  user_id: string;
  version: number;
  profile_text: string;
  source_counts: { checkins: number; decisions: number; patterns: number } | null;
  created_at: string;
}

// Sotto questa soglia il profilo sarebbe speculazione, non evidenza
const MIN_CHECKINS_FOR_PROFILE = 5;
// Il profilo si rigenera al massimo una volta ogni 7 giorni
const REFRESH_INTERVAL_DAYS = 7;

/** Ultima versione del profilo, o null (anche se la tabella non esiste ancora). */
export async function fetchLatestIdentityProfile(
  supabase: ServerClient,
  userId: string,
): Promise<IdentityProfile | null> {
  try {
    const { data } = await supabase
      .from('identity_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as IdentityProfile | null) ?? null;
  } catch {
    return null;
  }
}

/** Blocco di contesto pronto per l'iniezione nei prompt (o '' se assente). */
export async function identityProfileContext(
  supabase: ServerClient,
  userId: string,
): Promise<string> {
  const profile = await fetchLatestIdentityProfile(supabase, userId);
  if (!profile) return '';
  return `PROFILO IDENTITARIO CORRENTE (sintesi longitudinale, v${profile.version}, aggiornata il ${profile.created_at.split('T')[0]}):\n${profile.profile_text}`;
}

/** Estrae dal report dello scan solo l'essenziale per il prompt di sintesi. */
function buildScanSummary(scan: Scan | null): string {
  if (!scan?.analysis) return '';
  const a = scan.analysis as unknown as Partial<ScanReport>;
  const parts: string[] = [];
  if (a.archetype_primary) parts.push(`Archetipo primario: ${a.archetype_primary.title} — ${a.archetype_primary.description}`);
  if (a.loop_primary) parts.push(`Loop primario [${a.loop_primary.area}]: trigger "${a.loop_primary.trigger}" → ${a.loop_primary.behavior} → ${a.loop_primary.result}`);
  if (a.belief_limiting_primary) parts.push(`Credenza limitante: ${a.belief_limiting_primary.text}`);
  if (a.expectation_gap?.gap_dynamic) parts.push(`Gap aspettative/esecuzione: ${a.expectation_gap.gap_dynamic}`);
  if (a.identity_target) parts.push(`Identità target: ${a.identity_target.name} (da "${a.identity_target.shift_from}" a "${a.identity_target.shift_to}")`);
  return parts.join('\n');
}

/**
 * Cintura di sicurezza oltre al prompt: se il modello antepone comunque
 * un titolo/intestazione, taglia tutto fino alla prima sezione attesa.
 */
function stripPreamble(text: string): string {
  const idx = text.search(/\*{0,2}CHI STAI ESSENDO/);
  return idx > 0 ? text.slice(idx) : text;
}

/**
 * Genera (o aggiorna) il profilo identitario. Ritorna il nuovo profilo,
 * o null se i dati non bastano. Errori loggati, mai propagati al chiamante
 * sul percorso di risposta.
 */
export async function generateIdentityProfile(
  supabase: ServerClient,
  userId: string,
): Promise<IdentityProfile | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [scanRes, checkinsRes, decisionsRes, patternsRes, previous] = await Promise.all([
    supabase.from('scans').select('*').eq('user_id', userId)
      .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('checkins').select('*').eq('user_id', userId)
      .gte('date', thirtyDaysAgo).order('date', { ascending: false }),
    supabase.from('decisions').select('*').eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
    supabase.from('patterns').select('*').eq('user_id', userId).eq('is_active', true),
    fetchLatestIdentityProfile(supabase, userId),
  ]);

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = (scanRes.data ?? null) as Scan | null;

  if (checkins.length < MIN_CHECKINS_FOR_PROFILE) return null;

  const prompt = IDENTITY_PROFILE_PROMPT(
    buildScanSummary(scan),
    previous?.profile_text ?? null,
    checkins,
    decisions,
    patterns,
  );

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  void recordAiUsage(supabase, userId, 'identity-profile', AI_MODEL, message.usage);

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Risposta AI non valida');

  const { data: saved, error } = await supabase
    .from('identity_profiles')
    .insert({
      user_id: userId,
      version: (previous?.version ?? 0) + 1,
      profile_text: stripPreamble(text.text.trim()),
      source_counts: {
        checkins: checkins.length,
        decisions: decisions.length,
        patterns: patterns.length,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return saved as IdentityProfile;
}

/**
 * Rigenera il profilo se è più vecchio di 7 giorni (o assente) e ci sono
 * abbastanza dati. Pensata per essere chiamata fire-and-forget (after())
 * dalla route daily-insight — non lancia mai.
 */
export async function maybeRefreshIdentityProfile(
  supabase: ServerClient,
  userId: string,
): Promise<void> {
  try {
    const latest = await fetchLatestIdentityProfile(supabase, userId);
    if (latest) {
      const ageDays = (Date.now() - new Date(latest.created_at).getTime()) / 86400000;
      if (ageDays < REFRESH_INTERVAL_DAYS) return;
    }
    await generateIdentityProfile(supabase, userId);
  } catch (err) {
    console.error('[identity-profile] refresh fallito (non bloccante):', err);
  }
}
