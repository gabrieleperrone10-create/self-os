export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { MONTHLY_LETTER_PROMPT } from '@/lib/anthropic/prompts/monthly-letter';
import { fetchFullContext } from '@/lib/knowledge-base/fetch';
import type { Checkin, Decision, Pattern, Scan } from '@/types';

function buildExpectationGapContext(scan: Scan | null): string {
  if (!scan?.analysis) return '';
  const a = scan.analysis as unknown as Record<string, unknown>;
  const gap = a.expectation_gap as { declared_expectation?: string; observed_behavior?: string; gap_dynamic?: string } | undefined;
  if (!gap?.gap_dynamic) return '';
  return `\nCONTESTO STRUTTURALE — GAP ASPETTATIVE/ESECUZIONE:\n${gap.gap_dynamic}\nDichiarato: ${gap.declared_expectation ?? '—'}\nComportamento reale: ${gap.observed_behavior ?? '—'}\nQuesta tensione è il dato più importante del profilo — nominala nella lettera, non aggirarla.\n`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as { month?: number; year?: number };
    const now = new Date();
    const month = body.month ?? now.getMonth() + 1;
    const year = body.year ?? now.getFullYear();

    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const [checkinsRes, decisionsRes, patternsRes, scanRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd + 'T23:59:59'),
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
    const scan = scanRes.data;

    const kbContext = await fetchFullContext();
    const gapContext = buildExpectationGapContext(scan);
    const prompt = MONTHLY_LETTER_PROMPT(checkins, decisions, patterns, scan, month, year, kbContext + gapContext);

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('Risposta non valida');

    const aiLetter = text.text.trim();

    const { data: letter } = await supabase
      .from('monthly_letters')
      .upsert({
        user_id: user.id,
        month,
        year,
        ai_letter: aiLetter,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,year,month' })
      .select()
      .single();

    return NextResponse.json({ letter });
  } catch (err) {
    console.error('[monthly-letter]', err);
    return NextResponse.json({ error: 'Lettera non disponibile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data } = await supabase
      .from('monthly_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(24);

    return NextResponse.json({ letters: data ?? [] });
  } catch (err) {
    console.error('[monthly-letter GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
