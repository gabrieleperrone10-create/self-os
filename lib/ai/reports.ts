// Generazione weekly report e lettera mensile — logica condivisa tra le
// route on-demand (client di sessione, RLS) e i cron (client admin).
// Estratta dalle route: route e funzioni vanno SEMPRE committate insieme.

import { anthropic, AI_MODEL, NO_THINKING, cachedKbSystem, createDeepMessage, firstText } from '@/lib/anthropic/client';
import { WEEKLY_REPORT_PROMPT } from '@/lib/anthropic/prompts/weekly-report';
import { MONTHLY_LETTER_PROMPT } from '@/lib/anthropic/prompts/monthly-letter';
import { fetchFullContext } from '@/lib/knowledge-base/fetch';
import { identityProfileContext } from '@/lib/ai/identity-profile';
import { recordAiUsage } from '@/lib/ai/usage';
import type { Checkin, Decision, Pattern, Scan, WeeklyReport, MonthlyLetter } from '@/types';

// Entrambi i client (sessione e admin) espongono la stessa interfaccia .from()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function buildExpectationGapContext(scan: Scan | null, dove: string): string {
  if (!scan?.analysis) return '';
  const a = scan.analysis as unknown as Record<string, unknown>;
  const gap = a.expectation_gap as { declared_expectation?: string; observed_behavior?: string; gap_dynamic?: string } | undefined;
  if (!gap?.gap_dynamic) return '';
  return `\nCONTESTO STRUTTURALE — GAP ASPETTATIVE/ESECUZIONE:\n${gap.gap_dynamic}\nDichiarato: ${gap.declared_expectation ?? '—'}\nComportamento reale: ${gap.observed_behavior ?? '—'}\nQuesta tensione è il dato più importante del profilo — nominala ${dove}, non aggirarla.\n`;
}

/** Lunedì e domenica della settimana corrente (o passata, con offset). */
export function currentWeekBounds(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const diffToMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

export async function generateWeeklyReport(
  supabase: AnyClient,
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeeklyReport | null> {
  const [checkinsRes, decisionsRes, patternsRes, scanRes] = await Promise.all([
    supabase.from('checkins').select('*').eq('user_id', userId)
      .gte('date', weekStart).lte('date', weekEnd),
    supabase.from('decisions').select('*').eq('user_id', userId)
      .gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59'),
    supabase.from('patterns').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('scans').select('*').eq('user_id', userId)
      .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = (scanRes.data ?? null) as Scan | null;

  const [kbContext, profileContext] = await Promise.all([
    fetchFullContext(),
    identityProfileContext(supabase, userId),
  ]);
  const gapContext = buildExpectationGapContext(scan, 'nel report');
  const userContext = [gapContext, profileContext].filter(Boolean).join('\n\n');
  const prompt = WEEKLY_REPORT_PROMPT(checkins, decisions, patterns, weekStart, weekEnd);

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    thinking: NO_THINKING,
    max_tokens: 512,
    system: cachedKbSystem(kbContext, 'Usa il processo di trasformazione in 5 fasi e gli archetipi come sistema di lettura dei dati. Fai emergere la struttura psicologica profonda, non solo le statistiche.', userContext),
    messages: [{ role: 'user', content: prompt }],
  });

  void recordAiUsage(supabase, userId, 'weekly-report', AI_MODEL, message.usage);

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Risposta non valida');
  const aiReport = text.text.trim();

  const avgScore = checkins.length > 0
    ? checkins.reduce((s, c) => s + (c.state_score ?? 0), 0) / checkins.length
    : null;
  const topPatterns = patterns.slice(0, 3).map(p => p.title);

  const { data: report } = await supabase
    .from('weekly_reports')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      checkin_count: checkins.length,
      avg_state_score: avgScore,
      top_patterns: topPatterns.length > 0 ? topPatterns : null,
      decisions_count: decisions.length,
      vision_decisions: decisions.filter((d: Decision) => d.origin === 'vision').length,
      ai_report: aiReport,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_start' })
    .select()
    .single();

  return report as WeeklyReport | null;
}

export async function generateMonthlyLetter(
  supabase: AnyClient,
  userId: string,
  month: number,
  year: number,
): Promise<MonthlyLetter | null> {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const [checkinsRes, decisionsRes, patternsRes, scanRes] = await Promise.all([
    supabase.from('checkins').select('*').eq('user_id', userId)
      .gte('date', monthStart).lte('date', monthEnd),
    supabase.from('decisions').select('*').eq('user_id', userId)
      .gte('created_at', monthStart).lte('created_at', monthEnd + 'T23:59:59'),
    supabase.from('patterns').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('scans').select('*').eq('user_id', userId)
      .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = (scanRes.data ?? null) as Scan | null;

  const [kbContext, profileContext] = await Promise.all([
    fetchFullContext(),
    identityProfileContext(supabase, userId),
  ]);
  const gapContext = buildExpectationGapContext(scan, 'nella lettera');
  const userContext = [gapContext, profileContext].filter(Boolean).join('\n\n');
  const prompt = MONTHLY_LETTER_PROMPT(checkins, decisions, patterns, scan, month, year);

  // Sintesi mensile → modello deep (Fable 5, fallback Opus 4.8). Il thinking
  // sempre attivo consuma output tokens: max_tokens alzato di conseguenza,
  // la lunghezza della lettera resta governata dal prompt.
  const { message, model } = await createDeepMessage({
    max_tokens: 4096,
    system: cachedKbSystem(kbContext, "Usa l'intera base psicologica — archetipi, loop, IFS, processo di trasformazione — per scrivere una lettera che vada in profondità. Non limitarti a riassumere i dati: rifletti l'identità.", userContext),
    messages: [{ role: 'user', content: prompt }],
  });

  void recordAiUsage(supabase, userId, 'monthly-letter', model, message.usage);

  const aiLetter = firstText(message).trim();

  const { data: letter } = await supabase
    .from('monthly_letters')
    .upsert({
      user_id: userId,
      month,
      year,
      ai_letter: aiLetter,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,year,month' })
    .select()
    .single();

  return letter as MonthlyLetter | null;
}
