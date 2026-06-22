export const maxDuration = 60;

import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, recordAiUsage, quotaExceededBody } from '@/lib/ai/usage';
import { identityProfileContext, maybeRefreshIdentityProfile } from '@/lib/ai/identity-profile';
import { maybeRefreshBiometricsInsight } from '@/lib/ai/biometrics-insight';
import { anthropic, AI_MODEL, cachedKbSystem } from '@/lib/anthropic/client';
import { DAILY_INSIGHT_PROMPT } from '@/lib/anthropic/prompts/daily-insight';
import { fetchDailyContext } from '@/lib/knowledge-base/fetch';
import type { Checkin } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const body = await request.json() as { checkinId: string };
    const { checkinId } = body;

    if (!checkinId) {
      return NextResponse.json({ error: 'checkinId mancante' }, { status: 400 });
    }

    // Fetch the checkin
    const { data: checkin, error: fetchError } = await supabase
      .from('checkins')
      .select('*')
      .eq('id', checkinId)
      .eq('user_id', user.id)
      .single<Checkin>();

    if (fetchError || !checkin) {
      return NextResponse.json({ error: 'Check-in non trovato' }, { status: 404 });
    }

    // Fetch last 5 checkins of same type for repetition detection
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', checkin.type)
      .neq('id', checkinId)
      .order('date', { ascending: false })
      .limit(5);

    const [kbContext, profileContext] = await Promise.all([
      fetchDailyContext(),
      identityProfileContext(supabase, user.id),
    ]);

    // Call Claude
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system: cachedKbSystem(kbContext, 'Usa questa base psicologica come lente invisibile — non citare mai i framework.', profileContext),
      messages: [
        {
          role: 'user',
          content: DAILY_INSIGHT_PROMPT(checkin, (recentCheckins ?? []) as Checkin[]),
        },
      ],
    });

    void recordAiUsage(supabase, user.id, 'daily-insight', AI_MODEL, message.usage);

    // Dopo la risposta: rigenera le sintesi longitudinali se hanno 7+ giorni.
    // after() garantisce l'esecuzione anche post-response su Vercel.
    // L'insight biometrico esce subito (count=0) per chi non ha dati corpo.
    after(() => maybeRefreshIdentityProfile(supabase, user.id));
    after(() => maybeRefreshBiometricsInsight(supabase, user.id));

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') throw new Error('Risposta AI non valida');

    const insight = rawContent.text.trim();

    // Save insight back to checkin
    await supabase
      .from('checkins')
      .update({ ai_insight: insight })
      .eq('id', checkinId);

    return NextResponse.json({ insight });
  } catch (err) {
    console.error('[daily-insight]', err);
    return NextResponse.json({ error: 'Insight non disponibile.' }, { status: 500 });
  }
}
