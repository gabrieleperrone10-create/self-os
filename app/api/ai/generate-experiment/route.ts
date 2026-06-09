export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic/client';
import { EXPERIMENT_GENERATOR_PROMPT } from '@/lib/anthropic/prompts/experiment-generator';
import type { Pattern, Scan, ExperimentGeneration } from '@/types';

// Opus for experiment generation — needs deep reasoning on the loop structure
const MODEL = 'claude-opus-4-8';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as {
      type: 'pattern' | 'freeform';
      patternId?: string;
      userDescription?: string;
    };

    const { type, patternId, userDescription } = body;
    if (type === 'pattern' && !patternId) {
      return NextResponse.json({ error: 'patternId mancante' }, { status: 400 });
    }
    if (type === 'freeform' && !userDescription?.trim()) {
      return NextResponse.json({ error: 'userDescription mancante' }, { status: 400 });
    }

    // Fetch context in parallel
    const [patternRes, scanRes, checkinsRes] = await Promise.all([
      patternId
        ? supabase.from('patterns').select('*').eq('id', patternId).eq('user_id', user.id).single<Pattern>()
        : Promise.resolve({ data: null }),
      supabase.from('scans').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(1).single<Scan>(),
      supabase.from('checkins').select('state_score,answers,type,date').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
    ]);

    const pattern = patternRes.data ?? undefined;
    const scan = scanRes.data ?? null;

    const recentCheckinsSummary = checkinsRes.data
      ?.map(c => `[${c.date}] ${c.type} | Stato: ${c.state_score}/10 | ${JSON.stringify(c.answers)}`)
      .join('\n') ?? '';

    const prompt = EXPERIMENT_GENERATOR_PROMPT({
      type,
      pattern,
      userDescription,
      scan,
      recentCheckinsSummary,
    });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0];
    if (raw.type !== 'text') throw new Error('Risposta AI non valida');

    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON non trovato nella risposta');

    const generation = JSON.parse(jsonMatch[0]) as ExperimentGeneration;

    return NextResponse.json({ generation, patternId: patternId ?? null });
  } catch (err) {
    console.error('[generate-experiment]', err);
    return NextResponse.json({ error: 'Generazione non disponibile' }, { status: 500 });
  }
}
