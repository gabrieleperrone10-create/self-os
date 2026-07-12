export const maxDuration = 300; // lettera su Fable 5: serve margine oltre i 60s

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, quotaExceededBody } from '@/lib/ai/usage';
import { generateMonthlyLetter } from '@/lib/ai/reports';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const body = await request.json() as { month?: number; year?: number };
    const now = new Date();
    const month = body.month ?? now.getMonth() + 1;
    const year = body.year ?? now.getFullYear();

    const letter = await generateMonthlyLetter(supabase, user.id, month, year);
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('[monthly-letter]', err);
    return NextResponse.json({ error: 'Lettera non disponibile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data } = await supabase
      .from('monthly_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(24);

    return NextResponse.json({ letters: data ?? [] });
  } catch (err) {
    console.error('[monthly-letter GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
