export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL, cachedKbSystem } from '@/lib/anthropic/client';
import { SCAN_ANALYSIS_PROMPT } from '@/lib/anthropic/prompts/scan-analysis';
import { fetchFullContext } from '@/lib/knowledge-base/fetch';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { scanReportSchema } from '@/lib/anthropic/schemas';
import type { ScanAnswers } from '@/types/scan';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json() as { answers: ScanAnswers };
    const { answers } = body;

    if (!answers || Object.keys(answers).length < 30) {
      return NextResponse.json({ error: 'Risposte incomplete' }, { status: 400 });
    }

    const kbContext = await fetchFullContext();

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: cachedKbSystem(kbContext, 'Usa questa base psicologica per identificare gli archetipi, i loop e i framework con precisione. Fai riferimento agli archetipi specifici (S1-S12) quando sono chiaramente rilevanti.'),
      messages: [
        {
          role: 'user',
          content: SCAN_ANALYSIS_PROMPT(answers),
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Risposta AI non valida');
    }

    const analysis = parseAIJson(rawContent.text, scanReportSchema, 'analyze-scan');

    // Save scan to Supabase
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        answers,
        analysis,
      })
      .select()
      .single();

    if (scanError) throw scanError;

    // Mark onboarding as completed
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    // Non-blocking: send scan-complete email
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/scan-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
    }).catch(err => console.error('[analyze-scan] scan email failed', err));

    return NextResponse.json({ scan });
  } catch (err) {
    console.error('[analyze-scan]', err);
    return NextResponse.json(
      { error: 'Analisi fallita. Riprova.' },
      { status: 500 }
    );
  }
}
