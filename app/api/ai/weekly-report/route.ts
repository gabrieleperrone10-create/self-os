export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { WEEKLY_REPORT_PROMPT } from '@/lib/anthropic/prompts/weekly-report';
import { fetchFullContext } from '@/lib/knowledge-base/fetch';
import type { Checkin, Decision, Pattern, Scan } from '@/types';

function buildExpectationGapContext(scan: Scan | null): string {
  if (!scan?.analysis) return '';
  const a = scan.analysis as unknown as Record<string, unknown>;
  const gap = a.expectation_gap as { declared_expectation?: string; observed_behavior?: string; gap_dynamic?: string } | undefined;
  if (!gap?.gap_dynamic) return '';
  return `\nCONTESTO STRUTTURALE — GAP ASPETTATIVE/ESECUZIONE:\n${gap.gap_dynamic}\nDichiarato: ${gap.declared_expectation ?? '—'}\nComportamento reale: ${gap.observed_behavior ?? '—'}\nQuesta tensione è il dato più importante del profilo — nominala nel report, non aggirarla.\n`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    // Default to current week if not provided
    const body = await request.json() as { weekStart?: string; weekEnd?: string };

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=sun, 1=mon ...
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekStart = body.weekStart ?? monday.toISOString().split('T')[0];
    const weekEnd = body.weekEnd ?? sunday.toISOString().split('T')[0];

    // Fetch week data + scan for gap context
    const [checkinsRes, decisionsRes, patternsRes, scanRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd),
      supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd + 'T23:59:59'),
      supabase
        .from('patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single<Scan>(),
    ]);

    const checkins = (checkinsRes.data ?? []) as Checkin[];
    const decisions = (decisionsRes.data ?? []) as Decision[];
    const patterns = (patternsRes.data ?? []) as Pattern[];
    const scan = scanRes.data ?? null;

    const kbContext = await fetchFullContext();
    const gapContext = buildExpectationGapContext(scan);
    const prompt = WEEKLY_REPORT_PROMPT(checkins, decisions, patterns, weekStart, weekEnd, kbContext + gapContext);

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('Risposta non valida');

    const aiReport = text.text.trim();

    const avgScore = checkins.length > 0
      ? checkins.reduce((s, c) => s + (c.state_score ?? 0), 0) / checkins.length
      : null;

    const topPatterns = patterns.slice(0, 3).map(p => p.title);

    // Upsert weekly report
    const { data: report } = await supabase
      .from('weekly_reports')
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        checkin_count: checkins.length,
        avg_state_score: avgScore,
        top_patterns: topPatterns.length > 0 ? topPatterns : null,
        decisions_count: decisions.length,
        vision_decisions: decisions.filter(d => d.origin === 'vision').length,
        ai_report: aiReport,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' })
      .select()
      .single();

    return NextResponse.json({ report });
  } catch (err) {
    console.error('[weekly-report]', err);
    return NextResponse.json({ error: 'Report non disponibile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(12);

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    console.error('[weekly-report GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
