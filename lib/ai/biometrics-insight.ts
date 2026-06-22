import { anthropic, AI_MODEL, cachedKbSystem } from '@/lib/anthropic/client';
import {
  BIOMETRICS_INSIGHT_PROMPT,
  BIOMETRICS_INSIGHT_INSTRUCTION,
  type ConvergencePoint,
} from '@/lib/anthropic/prompts/biometrics-insight';
import { biometricsInsightSchema, type BiometricsInsight } from '@/lib/anthropic/schemas';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { fetchBiometricsContext } from '@/lib/knowledge-base/fetch';
import { recordAiUsage } from '@/lib/ai/usage';
import type { createClient } from '@/lib/supabase/server';
import type { Checkin } from '@/types';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface BiometricInsightRow {
  id: string;
  user_id: string;
  version: number;
  insight: BiometricsInsight;
  hrv_baseline: number | null;
  data_days: number | null;
  created_at: string;
}

// Il bracciale misura HRV/FC; servono giorni di copertura perché il trend valga
const REFRESH_INTERVAL_DAYS = 7;

const HRV_KEYS   = new Set(['heart_rate_variability_sdnn', 'heart_rate_variability', 'hrv']);
const HR_KEYS    = new Set(['resting_heart_rate']);
const STEP_KEYS  = new Set(['step_count']);
// HAE manda il sonno come sleep_totalSleep (ore dormite/notte) — è la metrica canonica.
const SLEEP_KEYS = new Set(['sleep_totalSleep', 'sleep_analysis', 'asleep', 'in_bed', 'sleep_in_bed', 'time_in_bed']);

type Sample = { metric: string; value: number; recorded_at: string };

function round1(n: number) { return Math.round(n * 10) / 10; }
function mean(vals: number[]) { return vals.reduce((s, v) => s + v, 0) / vals.length; }

// recorded_at UTC → data italiana YYYY-MM-DD (allinea il giorno al fuso reale)
function toRomeDate(ts: string): string {
  return new Date(ts).toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function addDay(date: string): string {
  return new Date(new Date(date + 'T12:00:00Z').getTime() + 86400000)
    .toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function dailyMap(samples: Sample[], keys: Set<string>, mode: 'avg' | 'sum' = 'avg'): Map<string, number> {
  const byDay = new Map<string, number[]>();
  for (const s of samples) {
    if (!keys.has(s.metric)) continue;
    const day = toRomeDate(s.recorded_at);
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(s.value);
  }
  const out = new Map<string, number>();
  for (const [day, vals] of byDay) {
    out.set(day, mode === 'avg' ? round1(mean(vals)) : Math.round(vals.reduce((a, v) => a + v, 0)));
  }
  return out;
}

/** Ultima versione dell'insight, o null (anche se la tabella non esiste ancora). */
export async function fetchLatestBiometricsInsight(
  supabase: ServerClient,
  userId: string,
): Promise<BiometricInsightRow | null> {
  try {
    const { data } = await supabase
      .from('biometric_insights')
      .select('*')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as BiometricInsightRow | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Genera una nuova versione dell'insight biometrico e la persiste.
 * Ritorna la riga salvata, o null se non ci sono dati sufficienti.
 * Aggira il cap max_rows=1000 di Supabase con pagination parallela.
 */
export async function generateBiometricsInsight(
  supabase: ServerClient,
  userId: string,
): Promise<BiometricInsightRow | null> {
  const PAGE = 1000;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [totalRes, eventsRes, checkinsRes, previous] = await Promise.all([
    supabase.from('biometric_samples')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('calendar_events')
      .select('title, start_at').eq('user_id', userId)
      .gte('start_at', ninetyDaysAgo).order('start_at', { ascending: true }),
    supabase.from('checkins')
      .select('*').eq('user_id', userId).eq('type', 'evening')
      .gte('date', ninetyDaysAgo.split('T')[0]).order('date', { ascending: true }),
    fetchLatestBiometricsInsight(supabase, userId),
  ]);

  const totalSamples = totalRes.count ?? 0;
  if (totalSamples === 0) return null;

  const pageCount = Math.min(20, Math.max(1, Math.ceil(totalSamples / PAGE)));
  const samplesPages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      supabase.from('biometric_samples')
        .select('metric, value, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .range(i * PAGE, (i + 1) * PAGE - 1)
    )
  );
  const samples = samplesPages.flatMap(r => (r.data ?? []) as Sample[]);

  const dHrv   = dailyMap(samples, HRV_KEYS);
  const dHr    = dailyMap(samples, HR_KEYS);
  const dSteps = dailyMap(samples, STEP_KEYS, 'sum');
  const dSleep = dailyMap(samples, SLEEP_KEYS);
  const hasSleep = samples.some(s => SLEEP_KEYS.has(s.metric));

  const hrvDays = [...dHrv.values()];
  const hrvBaseline = hrvDays.length > 0 ? round1(mean(hrvDays)) : null;

  // Serie giornaliera ordinata (ultimi giorni con dati)
  const allDays = [...new Set([...dHrv.keys(), ...dHr.keys(), ...dSteps.keys()])].sort();
  const dataDays = allDays.length;

  const eventsByDay = new Map<string, string[]>();
  for (const e of (eventsRes.data ?? []) as Array<{ title: string; start_at: string }>) {
    const day = toRomeDate(e.start_at);
    if (e.title) (eventsByDay.get(day) ?? eventsByDay.set(day, []).get(day)!).push(e.title);
  }

  // Mostra al modello al massimo gli ultimi 30 giorni con dati (densità utile)
  const recentDays = allDays.slice(-30);
  const correlations = recentDays.map(date => {
    const hrv = dHrv.get(date) ?? null;
    const hr  = dHr.get(date)  ?? null;
    return {
      date,
      hrv,
      hrvDelta: hrv !== null && hrvBaseline !== null ? round1(hrv - hrvBaseline) : null,
      hr,
      steps: dSteps.get(date) ?? null,
      sleep: dSleep.get(date) ?? null,
      events: eventsByDay.get(date) ?? [],
    };
  });

  // Convergenza: stato dichiarato la sera N → corpo della notte/giorno successivo (N+1).
  // Il ritardo (12-48h) è già applicato qui, come prescrive il framework.
  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const convergence: ConvergencePoint[] = checkins.map(c => {
    const next = addDay(c.date);
    const nightHrv = dHrv.get(next) ?? null;
    const note = c.answers?.q1 ?? c.answers?.q2 ?? null;
    return {
      date: c.date,
      declaredState: c.state_score,
      note: note ? note.slice(0, 80) : null,
      nightHrv,
      nightHrvDelta: nightHrv !== null && hrvBaseline !== null ? round1(nightHrv - hrvBaseline) : null,
      nextHr: dHr.get(next) ?? null,
      nightSleep: dSleep.get(next) ?? null,
    };
  }).filter(c => c.nightHrv !== null || c.nextHr !== null).slice(-14);

  const allMetrics = [...new Set(samples.map(s => s.metric))].sort();

  const kbContext = await fetchBiometricsContext();
  const prompt = BIOMETRICS_INSIGHT_PROMPT({
    hrvBaseline,
    correlations,
    convergence,
    allMetrics,
    hasCalendar: eventsByDay.size > 0,
    hasSleep,
    dataDays,
  });

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 800,
    system: cachedKbSystem(kbContext, BIOMETRICS_INSIGHT_INSTRUCTION),
    messages: [{ role: 'user', content: prompt }],
  });

  void recordAiUsage(supabase, userId, 'biometrics-insight', AI_MODEL, message.usage);

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const insight = parseAIJson(raw, biometricsInsightSchema, 'biometrics-insight');

  const { data: saved, error } = await supabase
    .from('biometric_insights')
    .insert({
      user_id: userId,
      version: (previous?.version ?? 0) + 1,
      insight,
      hrv_baseline: hrvBaseline,
      data_days: dataDays,
    })
    .select()
    .single();

  if (error) throw error;
  return saved as BiometricInsightRow;
}

/**
 * Rigenera l'insight se è più vecchio di 7 giorni (o assente) e ci sono dati.
 * Fire-and-forget via after() dalla route Corpo — non lancia mai.
 */
export async function maybeRefreshBiometricsInsight(
  supabase: ServerClient,
  userId: string,
): Promise<void> {
  try {
    const latest = await fetchLatestBiometricsInsight(supabase, userId);
    if (latest) {
      const ageDays = (Date.now() - new Date(latest.created_at).getTime()) / 86400000;
      if (ageDays < REFRESH_INTERVAL_DAYS) return;
    }
    await generateBiometricsInsight(supabase, userId);
  } catch (err) {
    console.error('[biometrics-insight] refresh fallito (non bloccante):', err);
  }
}
