export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAndParseIcs, type ParsedEvent } from '@/lib/calendar/ics';

type SyncRow = ParsedEvent & { user_id: string };

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: conn, error: connErr } = await supabase
      .from('calendar_connections')
      .select('ics_url')
      .eq('user_id', user.id)
      .single();

    if (connErr || !conn) {
      return NextResponse.json({ error: 'Nessun calendario connesso' }, { status: 404 });
    }

    const events = await fetchAndParseIcs((conn as { ics_url: string }).ics_url);

    // Finestra: 60 giorni fa → 90 giorni futuri
    const now = Date.now();
    const past   = new Date(now - 60  * 24 * 60 * 60 * 1000).toISOString();
    const future = new Date(now + 90  * 24 * 60 * 60 * 1000).toISOString();

    // Deduplicazione per external_id: eventi ricorrenti possono avere lo stesso UID
    // nel batch → PostgreSQL rifiuta l'upsert. Teniamo l'occorrenza con start_at più recente.
    const seen = new Map<string, SyncRow>();
    for (const e of events) {
      if (e.start_at < past || e.start_at > future) continue;
      const row = { ...e, user_id: user.id };
      const existing = seen.get(e.external_id);
      if (!existing || e.start_at > existing.start_at) seen.set(e.external_id, row);
    }
    const rows = Array.from(seen.values());

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('calendar_events')
        .upsert(rows, { onConflict: 'user_id,external_id' });
      if (upsertErr) throw upsertErr;
    }

    await supabase
      .from('calendar_connections')
      .update({ last_sync: new Date().toISOString(), event_count: rows.length })
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true, synced: rows.length });
  } catch (err) {
    console.error('[calendar/sync]', err);
    return NextResponse.json({ error: 'Sync fallito' }, { status: 500 });
  }
}
