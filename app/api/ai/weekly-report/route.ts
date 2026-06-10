export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiQuota, quotaExceededBody } from '@/lib/ai/usage';
import { generateWeeklyReport, currentWeekBounds } from '@/lib/ai/reports';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const quota = await checkAiQuota(supabase, user.id);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const body = await request.json() as { weekStart?: string; weekEnd?: string };
    const bounds = currentWeekBounds();
    const weekStart = body.weekStart ?? bounds.weekStart;
    const weekEnd = body.weekEnd ?? bounds.weekEnd;

    const report = await generateWeeklyReport(supabase, user.id, weekStart, weekEnd);
    return NextResponse.json({ report });
  } catch (err) {
    console.error('[weekly-report]', err);
    return NextResponse.json({ error: 'Report non disponibile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(12);

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    console.error('[weekly-report GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
