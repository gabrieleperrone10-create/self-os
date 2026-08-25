import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentPeriodStart } from '@/lib/stats/period';
import type { StatDefinition, StatEntry } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: definition } = await supabase
      .from('stat_definitions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle<StatDefinition>();
    if (!definition) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const body = await request.json() as {
      value: number;
      periodStart?: string; // assente = periodo corrente; presente = inserimento retroattivo
      note?: string | null;
    };

    if (typeof body.value !== 'number' || !Number.isFinite(body.value)) {
      return NextResponse.json({ error: 'Valore non valido' }, { status: 400 });
    }

    const today = currentPeriodStart(definition.period);
    const periodStart = body.periodStart ?? today;
    const estimated = periodStart !== today;

    const { data: entry, error } = await supabase
      .from('stat_entries')
      .upsert({
        stat_id: id,
        user_id: user.id,
        period_start: periodStart,
        value: body.value,
        estimated,
        note: body.note?.trim() || null,
      }, { onConflict: 'stat_id,period_start' })
      .select()
      .single<StatEntry>();

    if (error) throw error;
    return NextResponse.json({ entry });
  } catch (err) {
    console.error('[stat entries POST]', err);
    return NextResponse.json({ error: 'Salvataggio fallito' }, { status: 500 });
  }
}
