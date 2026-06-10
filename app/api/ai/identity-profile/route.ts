export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, quotaExceededBody } from '@/lib/ai/usage';
import {
  fetchLatestIdentityProfile,
  generateIdentityProfile,
} from '@/lib/ai/identity-profile';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const profile = await generateIdentityProfile(supabase, user.id);
    if (!profile) {
      return NextResponse.json({
        error: 'Servono almeno 5 check-in negli ultimi 30 giorni per generare il profilo.',
      }, { status: 422 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[identity-profile]', err);
    return NextResponse.json({ error: 'Profilo non disponibile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const profile = await fetchLatestIdentityProfile(supabase, user.id);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[identity-profile GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
