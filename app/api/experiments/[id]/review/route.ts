import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic/client';
import { EXPERIMENT_REVIEW_PROMPT } from '@/lib/anthropic/prompts/experiment-review';
import type { Experiment, ExperimentEntry } from '@/types';

const MODEL = 'claude-sonnet-4-6';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const [experimentRes, entriesRes] = await Promise.all([
      supabase.from('experiments').select('*').eq('id', id).eq('user_id', user.id).single<Experiment>(),
      supabase.from('experiment_entries').select('*').eq('experiment_id', id).eq('user_id', user.id).order('date'),
    ]);

    if (!experimentRes.data) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const experiment = experimentRes.data;
    const entries = (entriesRes.data ?? []) as ExperimentEntry[];

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: EXPERIMENT_REVIEW_PROMPT(experiment, entries) }],
    });

    const raw = message.content[0];
    if (raw.type !== 'text') throw new Error('Risposta non valida');

    const review = raw.text.trim();

    // Save review to experiment
    await supabase
      .from('experiments')
      .update({ last_review: review, last_review_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ review });
  } catch (err) {
    console.error('[experiment review]', err);
    return NextResponse.json({ error: 'Review non disponibile' }, { status: 500 });
  }
}
