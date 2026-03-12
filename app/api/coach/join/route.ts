import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { coachId } = await request.json() as { coachId: string };
    if (!coachId) return NextResponse.json({ error: 'Coach ID mancante' }, { status: 400 });

    // Verify the coach exists and has coach role/plan
    const { data: coach } = await supabase
      .from('profiles')
      .select('id, full_name, role, plan')
      .eq('id', coachId)
      .single();

    if (!coach) return NextResponse.json({ error: 'Coach non trovato' }, { status: 404 });
    if (coach.role !== 'coach' && coach.plan !== 'coach') {
      return NextResponse.json({ error: 'Profilo non autorizzato come coach' }, { status: 403 });
    }

    if (coach.id === user.id) {
      return NextResponse.json({ error: 'Non puoi connetterti a te stesso' }, { status: 400 });
    }

    // Upsert — avoid duplicates
    const { error } = await supabase
      .from('coach_clients')
      .upsert({
        coach_id: coachId,
        client_id: user.id,
        status: 'active',
      }, { onConflict: 'coach_id,client_id' });

    if (error) throw error;

    return NextResponse.json({ connected: true, coachName: coach.full_name });
  } catch (err) {
    console.error('[coach/join]', err);
    return NextResponse.json({ error: 'Errore connessione' }, { status: 500 });
  }
}
