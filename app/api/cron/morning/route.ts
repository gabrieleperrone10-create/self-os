export const maxDuration = 300;

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron, romeToday, fetchActiveUsers, daysAgo } from '@/lib/cron/utils';
import { generateMonthlyLetter } from '@/lib/ai/reports';
import { fetchAndParseIcs } from '@/lib/calendar/ics';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import { morningReminderHtml, monthlyLetterEmailHtml } from '@/lib/resend/templates';

const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

/**
 * Cron del mattino (06:00 UTC ≈ 7-8 Italia):
 * 1. promemoria check-in mattutino a chi non l'ha ancora fatto
 * 2. il giorno 1 del mese: genera e spedisce la lettera del mese precedente
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { date: today, dayOfMonth } = romeToday();
  const stats = { reminders: 0, letters: 0, errors: 0 };

  try {
    const users = await fetchActiveUsers(supabase, daysAgo(21, today));

    // Chi ha già fatto il check-in mattutino oggi non riceve il promemoria
    const { data: doneToday } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('date', today)
      .eq('type', 'morning');
    const doneIds = new Set((doneToday ?? []).map(c => c.user_id));

    for (const user of users) {
      try {
        if (!doneIds.has(user.id)) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Da quale versione di te vuoi operare oggi?',
            html: morningReminderHtml(user.firstName),
          });
          stats.reminders++;
        }

        // Lettera mensile: il giorno 1, per il mese appena chiuso
        if (dayOfMonth === 1) {
          const now = new Date(today + 'T12:00:00');
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const month = prev.getMonth() + 1;
          const year = prev.getFullYear();
          const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;

          const { count } = await supabase
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('date', monthStart)
            .lt('date', today);

          // Sotto 5 check-in la lettera sarebbe speculazione
          if ((count ?? 0) >= 5) {
            const letter = await generateMonthlyLetter(supabase, user.id, month, year);
            if (letter?.ai_letter) {
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: `La tua lettera di ${MONTH_NAMES[month - 1]}`,
                html: monthlyLetterEmailHtml(user.firstName, letter.ai_letter, `${MONTH_NAMES[month - 1]} ${year}`),
              });
              stats.letters++;
            }
          }
        }
      } catch (err) {
        stats.errors++;
        console.error(`[cron-morning] utente ${user.id}:`, err);
      }
    }

    // Auto-sync calendari
    try {
      const { data: connections } = await supabase
        .from('calendar_connections')
        .select('user_id, ics_url');
      for (const conn of connections ?? []) {
        try {
          const now = Date.now();
          const past   = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
          const future = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();
          const events = await fetchAndParseIcs(conn.ics_url);
          type SyncRow = { user_id: string; external_id: string; title: string; start_at: string; end_at: string | null; location: string | null; attendees: string[] | null; all_day: boolean };
          const seen = new Map<string, SyncRow>();
          for (const e of events) {
            if (e.start_at < past || e.start_at > future) continue;
            const row: SyncRow = { ...e, user_id: conn.user_id };
            const existing = seen.get(e.external_id);
            if (!existing || e.start_at > existing.start_at) seen.set(e.external_id, row);
          }
          const rows = Array.from(seen.values());
          if (rows.length > 0) {
            await supabase.from('calendar_events').upsert(rows, { onConflict: 'user_id,external_id' });
          }
          await supabase.from('calendar_connections')
            .update({ last_sync: new Date().toISOString(), event_count: rows.length })
            .eq('user_id', conn.user_id);
        } catch (calErr) {
          console.error(`[cron-morning] calendar sync user ${conn.user_id}:`, calErr);
        }
      }
    } catch (calErr) {
      console.error('[cron-morning] calendar sync loop:', calErr);
    }

    console.log('[cron-morning]', JSON.stringify(stats));
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error('[cron-morning]', err);
    return NextResponse.json({ error: 'Cron fallito', ...stats }, { status: 500 });
  }
}
