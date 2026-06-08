import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Experiment, ExperimentGeneration } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ experiments: (data ?? []) as Experiment[] });
  } catch (err) {
    console.error('[experiments GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    // Check max 2 active experiments
    const { count } = await supabase
      .from('experiments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: 'Hai già 2 esperimenti attivi. Completa o metti in pausa uno prima di aprirne un altro.' },
        { status: 422 }
      );
    }

    const body = await request.json() as {
      generation: ExperimentGeneration;
      patternId?: string | null;
    };

    const { generation, patternId } = body;
    const { loop_map, intervention, meta } = generation;

    const today = new Date();
    const endsAt = new Date(today);
    endsAt.setDate(today.getDate() + meta.duration_days);

    const { data: experiment, error } = await supabase
      .from('experiments')
      .insert({
        user_id: user.id,
        pattern_id: patternId ?? null,
        pattern_title: meta.pattern_title,
        triggers: loop_map.triggers,
        emotion_sensation: loop_map.emotion_sensation,
        automatic_action: loop_map.automatic_action,
        identity_confirmation: loop_map.identity_confirmation,
        body_discharge_name: intervention.body_discharge.name,
        body_discharge_instruction: intervention.body_discharge.instruction,
        body_discharge_duration: intervention.body_discharge.duration,
        different_action: intervention.different_action.instruction,
        different_action_when: intervention.different_action.when,
        ai_rationale: meta.ai_rationale,
        duration_days: meta.duration_days,
        ends_at: endsAt.toISOString().split('T')[0],
      })
      .select()
      .single<Experiment>();

    if (error) throw error;
    return NextResponse.json({ experiment });
  } catch (err) {
    console.error('[experiments POST]', err);
    return NextResponse.json({ error: 'Creazione fallita' }, { status: 500 });
  }
}
