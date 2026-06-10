import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Preferenze account (per ora: promemoria email dei cron). */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as { email_reminders?: boolean };
    if (typeof body.email_reminders !== 'boolean') {
      return NextResponse.json({ error: 'Parametro non valido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ email_reminders: body.email_reminders })
      .eq('id', user.id);

    // Se la colonna non esiste ancora (migrazione 009 non applicata)
    if (error) {
      console.error('[preferences]', error);
      return NextResponse.json({ error: 'Preferenza non salvata — riprova più tardi' }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('[preferences]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
