import type { createClient } from '@/lib/supabase/server';
import type Anthropic from '@anthropic-ai/sdk';
import type { UserPlan } from '@/types';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Chiamate AI totali al giorno per piano. Le route più costose (Opus)
// pesano comunque 1: il limite protegge dai loop/abusi, non è billing.
const DAILY_LIMITS: Record<UserPlan, number> = {
  free: 20,
  pro: 200,
  coach: 500,
};

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Verifica la quota giornaliera di chiamate AI dell'utente.
 * Fail-open: se la tabella ai_usage non esiste ancora sul DB live o la
 * query fallisce, consente la chiamata e logga — un problema di tracking
 * non deve mai bloccare l'esperienza.
 */
export async function checkAiQuota(
  supabase: ServerClient,
  userId: string,
): Promise<QuotaCheck> {
  try {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', userId).single(),
      supabase
        .from('ai_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('date', new Date().toISOString().split('T')[0]),
    ]);

    const plan = (profile?.plan ?? 'free') as UserPlan;
    const limit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.free;
    const used = count ?? 0;

    return { allowed: used < limit, used, limit };
  } catch (err) {
    console.error('[ai-usage] quota check fallito, fail-open:', err);
    return { allowed: true, used: 0, limit: 0 };
  }
}

/**
 * Registra una chiamata AI con i token reali riportati dall'API.
 * Fire-and-forget: non va mai awaited sul percorso di risposta.
 */
export async function recordAiUsage(
  supabase: ServerClient,
  userId: string,
  route: string,
  model: string,
  usage: Anthropic.Messages.Usage | undefined,
): Promise<void> {
  try {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      route,
      model,
      input_tokens: usage?.input_tokens ?? 0,
      output_tokens: usage?.output_tokens ?? 0,
      cache_read_tokens: usage?.cache_read_input_tokens ?? 0,
      cache_write_tokens: usage?.cache_creation_input_tokens ?? 0,
    });
  } catch (err) {
    console.error('[ai-usage] tracking fallito (non bloccante):', err);
  }
}

/** Risposta standard 429 quando la quota è esaurita. */
export function quotaExceededBody(quota: QuotaCheck) {
  return {
    error: 'Limite giornaliero di analisi raggiunto. Riprova domani.',
    used: quota.used,
    limit: quota.limit,
  };
}
