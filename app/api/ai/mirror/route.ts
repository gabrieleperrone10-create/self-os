export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { MIRROR_PROMPT, type MirrorAnswers, type MirrorAnalysis } from '@/lib/anthropic/prompts/mirror';
import { fetchFrameworkContext } from '@/lib/knowledge-base/fetch';
import type { Decision, DecisionOrigin } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as MirrorAnswers;
    const { decisione, body_score, fear_under, hidden_cost, evolved_self, clarity_score } = body;

    if (!decisione?.trim() || !body_score || !fear_under?.trim() || !hidden_cost?.trim() || !evolved_self?.trim() || !clarity_score) {
      return NextResponse.json({ error: 'Risposte incomplete' }, { status: 400 });
    }

    const [{ data: pastDecisions }, kbContext] = await Promise.all([
      supabase.from('decisions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(10),
      fetchFrameworkContext(),
    ]);

    const decisions = (pastDecisions ?? []) as Decision[];

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: MIRROR_PROMPT(body, decisions, kbContext) }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') throw new Error('Risposta AI non valida');

    const jsonText = rawContent.text
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const analysis = JSON.parse(jsonText) as MirrorAnalysis;

    // origin derived from clarity score
    const origin: DecisionOrigin = clarity_score >= 6 ? 'vision' : 'fear';

    const { data: saved, error: insertError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        description: decisione.trim(),
        state_score: clarity_score,
        origin,
        ai_mirror: JSON.stringify(analysis),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ analysis, decisionId: saved.id });
  } catch (err) {
    console.error('[mirror]', err);
    return NextResponse.json({ error: 'Mirror non disponibile.' }, { status: 500 });
  }
}
