export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL, cachedKbSystem } from '@/lib/anthropic/client';
import { OUTCOME_REFLECTION_PROMPT } from '@/lib/anthropic/prompts/outcome-reflection';
import { fetchFrameworkContext } from '@/lib/knowledge-base/fetch';
import type { Decision } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as { decisionId: string; outcome: string };
    const { decisionId, outcome } = body;

    if (!decisionId || !outcome?.trim()) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Fetch the decision
    const { data: decision, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single<Decision>();

    if (error || !decision) {
      return NextResponse.json({ error: 'Decisione non trovata' }, { status: 404 });
    }

    // Save outcome first
    await supabase
      .from('decisions')
      .update({
        outcome: outcome.trim(),
        outcome_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', decisionId);

    // Get reflection from Claude
    const decisionWithOutcome: Decision = { ...decision, outcome: outcome.trim() };
    const kbContext = await fetchFrameworkContext();

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 256,
      system: cachedKbSystem(kbContext, "Usa il framework IFS e la struttura dei loop per analizzare se l'esito conferma o contraddice il pattern psicologico attivo al momento della decisione."),
      messages: [{ role: 'user', content: OUTCOME_REFLECTION_PROMPT(decisionWithOutcome) }],
    });

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('Risposta non valida');

    return NextResponse.json({ reflection: text.text.trim() });
  } catch (err) {
    console.error('[outcome-reflection]', err);
    return NextResponse.json({ error: 'Riflessione non disponibile' }, { status: 500 });
  }
}
