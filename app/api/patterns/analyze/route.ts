import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { PATTERN_RECOGNITION_PROMPT } from '@/lib/anthropic/prompts/pattern-recognition';
import { fetchArchetypesContext } from '@/lib/knowledge-base/fetch';
import type { Checkin, PatternRecognitionResult } from '@/types';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Fetch last 30 days of checkins
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true });

    if (!checkins || checkins.length < 3) {
      return NextResponse.json({
        error: 'Dati insufficienti. Completa almeno 3 check-in per attivare il riconoscimento pattern.',
      }, { status: 422 });
    }

    const kbContext = await fetchArchetypesContext();

    // Call Claude
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: PATTERN_RECOGNITION_PROMPT(checkins as Checkin[], kbContext),
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') throw new Error('Risposta AI non valida');

    const jsonText = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const result = JSON.parse(jsonText) as PatternRecognitionResult;

    // Upsert patterns — deactivate old ones first, then insert new
    await supabase
      .from('patterns')
      .update({ is_active: false })
      .eq('user_id', user.id);

    const inserts = result.patterns.map(p => ({
      user_id: user.id,
      type: p.type,
      title: p.title,
      description: p.description,
      frequency: p.frequency,
      metadata: { trigger: p.trigger, weekly_insight: result.weekly_insight },
    }));

    if (inserts.length > 0) {
      await supabase.from('patterns').insert(inserts);
    }

    return NextResponse.json({ patterns: result.patterns, weekly_insight: result.weekly_insight });
  } catch (err) {
    console.error('[patterns/analyze]', err);
    return NextResponse.json({ error: 'Analisi pattern fallita.' }, { status: 500 });
  }
}
