import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic/client';
import { SIGNAL_ANALYSIS_PROMPT } from '@/lib/anthropic/prompts/signal-analysis';
import type { Pattern, Signal } from '@/types';

// Haiku — risposta breve, non serve ragionamento profondo
const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { signalId } = await request.json() as { signalId: string };

    // Fetch signal + context in parallel
    const [signalRes, patternsRes, recentRes] = await Promise.all([
      supabase.from('signals').select('*').eq('id', signalId).eq('user_id', user.id).single<Signal>(),
      supabase.from('patterns').select('title, type, frequency').eq('user_id', user.id).eq('is_active', true).limit(10),
      supabase.from('signals').select('content, created_at').eq('user_id', user.id)
        .neq('id', signalId).order('created_at', { ascending: false }).limit(5),
    ]);

    if (!signalRes.data) return NextResponse.json({ error: 'Segnale non trovato' }, { status: 404 });

    const signal = signalRes.data;
    const patterns = (patternsRes.data ?? []) as Pick<Pattern, 'title' | 'type' | 'frequency'>[];
    const recentSignals = (recentRes.data ?? []) as Pick<Signal, 'content' | 'created_at'>[];

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: SIGNAL_ANALYSIS_PROMPT(signal, patterns, recentSignals) }],
    });

    const raw = message.content[0];
    if (raw.type !== 'text') throw new Error('Risposta non valida');

    const analysis = raw.text.trim();

    // Save analysis back
    await supabase.from('signals').update({ ai_analysis: analysis }).eq('id', signalId);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('[analyze-signal]', err);
    return NextResponse.json({ error: 'Analisi non disponibile' }, { status: 500 });
  }
}
