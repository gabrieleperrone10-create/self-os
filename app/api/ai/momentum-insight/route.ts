export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, recordAiUsage, quotaExceededBody } from '@/lib/ai/usage';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { MOMENTUM_INSIGHT_PROMPT } from '@/lib/anthropic/prompts/momentum-insight';
import type { MomentumData } from '@/lib/utils/momentum';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const momentumData = await request.json() as MomentumData;

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 100,
      messages: [{ role: 'user', content: MOMENTUM_INSIGHT_PROMPT(momentumData) }],
    });

    void recordAiUsage(supabase, user.id, 'momentum-insight', AI_MODEL, message.usage);

    const text = message.content[0];
    if (text.type !== 'text') throw new Error('Risposta non valida');

    return NextResponse.json({ insight: text.text.trim() });
  } catch (err) {
    console.error('[momentum-insight]', err);
    return NextResponse.json({ error: 'Insight non disponibile' }, { status: 500 });
  }
}
