export const maxDuration = 15;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { ics_url, label } = await request.json() as { ics_url: string; label?: string };

    let parsed: URL;
    try {
      parsed = new URL(ics_url ?? '');
    } catch {
      return NextResponse.json({ error: 'URL non valido' }, { status: 400 });
    }
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL deve essere HTTPS' }, { status: 400 });
    }

    const { error } = await supabase
      .from('calendar_connections')
      .upsert(
        { user_id: user.id, ics_url: ics_url.trim(), label: label ?? 'Google Calendar' },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[calendar/connect POST]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    await Promise.all([
      supabase.from('calendar_connections').delete().eq('user_id', user.id),
      supabase.from('calendar_events').delete().eq('user_id', user.id),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[calendar/connect DELETE]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
