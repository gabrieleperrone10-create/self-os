export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, recordAiUsage, quotaExceededBody } from '@/lib/ai/usage';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { VOICE_ANALYSIS_PROMPT } from '@/lib/anthropic/prompts/voice-analysis';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { voiceAnalysisSchema } from '@/lib/anthropic/schemas';

export type { VoiceAnalysis } from '@/lib/anthropic/prompts/voice-analysis';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const body = await request.json() as { transcript: string; saveCheckin?: boolean };
    const { transcript, saveCheckin = false } = body;

    if (!transcript?.trim() || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Trascrizione troppo breve' }, { status: 400 });
    }

    // Call Claude
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: VOICE_ANALYSIS_PROMPT(transcript) }],
    });

    void recordAiUsage(supabase, user.id, 'voice-analyze', AI_MODEL, message.usage);

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') throw new Error('Risposta AI non valida');

    const analysis = parseAIJson(rawContent.text, voiceAnalysisSchema, 'voice-analyze');

    // Optionally save as a check-in
    if (saveCheckin) {
      const hour = new Date().getHours();
      const type = hour < 15 ? 'morning' : 'evening';

      await supabase.from('checkins').insert({
        user_id: user.id,
        type,
        state_score: Math.max(1, Math.min(10, Math.round(analysis.state_score))),
        answers: {
          q2: transcript, // raw transcript as main answer
          q3: analysis.pattern ?? '',
        },
        ai_insight: analysis.insight,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('[voice-analyze]', err);
    return NextResponse.json({ error: 'Analisi vocale fallita.' }, { status: 500 });
  }
}
