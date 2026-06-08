import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ExperimentEntry, ExperimentResponse } from '@/types';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data, error } = await supabase
      .from('experiment_entries')
      .select('*')
      .eq('experiment_id', id)
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ entries: (data ?? []) as ExperimentEntry[] });
  } catch (err) {
    console.error('[experiment entries GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    // Verify ownership
    const { data: experiment } = await supabase
      .from('experiments')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!experiment) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const body = await request.json() as {
      emerged: boolean;
      response?: ExperimentResponse;
      note?: string;
      checkinId?: string;
    };

    const today = new Date().toISOString().split('T')[0];

    const { data: entry, error } = await supabase
      .from('experiment_entries')
      .upsert({
        experiment_id: id,
        user_id: user.id,
        emerged: body.emerged,
        response: body.emerged ? (body.response ?? null) : null,
        note: body.note?.trim() || null,
        checkin_id: body.checkinId ?? null,
        date: today,
      }, { onConflict: 'experiment_id,date' })
      .select()
      .single<ExperimentEntry>();

    if (error) throw error;
    return NextResponse.json({ entry });
  } catch (err) {
    console.error('[experiment entries POST]', err);
    return NextResponse.json({ error: 'Salvataggio fallito' }, { status: 500 });
  }
}
