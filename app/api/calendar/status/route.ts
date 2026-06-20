export const maxDuration = 10;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const [{ data: cal }, { data: bio }] = await Promise.all([
      supabase
        .from('calendar_connections')
        .select('label, last_sync, event_count, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('biometric_connections')
        .select('ingest_token')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      calendar: cal ?? null,
      biometric_token: (bio as { ingest_token?: string } | null)?.ingest_token ?? null,
    });
  } catch (err) {
    console.error('[calendar/status]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
