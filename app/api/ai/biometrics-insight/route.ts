export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, quotaExceededBody } from '@/lib/ai/usage';
import { generateBiometricsInsight } from '@/lib/ai/biometrics-insight';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const row = await generateBiometricsInsight(supabase, user.id);
    if (!row) {
      return NextResponse.json({ error: 'Nessun dato biometrico disponibile' }, { status: 422 });
    }

    return NextResponse.json(row.insight);
  } catch (err) {
    console.error('[biometrics-insight]', err);
    return NextResponse.json({ error: 'Errore analisi biometrici' }, { status: 500 });
  }
}
