export const maxDuration = 300;

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron, romeToday, fetchActiveUsers, daysAgo } from '@/lib/cron/utils';
import { fetchAndParseIcs } from '@/lib/calendar/ics';
import { generateWeeklyReport, currentWeekBounds } from '@/lib/ai/reports';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import { eveningReminderHtml, weeklyReportEmailHtml } from '@/lib/resend/templates';

/**
 * Cron della sera (19:00 UTC ≈ 20-21 Italia):
 * 1. promemoria check-in serale + nudge sulle decisioni senza esito da 30+ giorni
 * 2. la domenica: genera e spedisce il report della settimana che si chiude
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { date: today, dayOfWeek } = romeToday();
  const stats = { reminders: 0, reports: 0, errors: 0 };

  try {
    const users = await fetchActiveUsers(supabase, daysAgo(21, today));

    const [{ data: doneToday }, { data: openDecisions }] = await Promise.all([
      supabase.from('checkins').select('user_id').eq('date', today).eq('type', 'evening'),
      supabase.from('decisions').select('user_id')
        .is('outcome', null)
        .lt('created_at', daysAgo(30, today) + 'T00:00:00'),
    ]);
    const doneIds = new Set((doneToday ?? []).map(c => c.user_id));
    const openCount = new Map<string, number>();
    for (const d of openDecisions ?? []) {
      openCount.set(d.user_id, (openCount.get(d.user_id) ?? 0) + 1);
    }

    for (const user of users) {
      try {
        if (!doneIds.has(user.id)) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Quale pattern hai riconosciuto oggi?',
            html: eveningReminderHtml(user.firstName, openCount.get(user.id) ?? 0),
          });
          stats.reminders++;
        }

        // Report settimanale: la domenica sera, se la settimana ha abbastanza dati
        if (dayOfWeek === 0) {
          const { weekStart, weekEnd } = currentWeekBounds();
          const { count } = await supabase
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('date', weekStart)
            .lte('date', weekEnd);

          if ((count ?? 0) >= 3) {
            const report = await generateWeeklyReport(supabase, user.id, weekStart, weekEnd);
            if (report?.ai_report) {
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: 'Cosa ha visto il sistema questa settimana',
                html: weeklyReportEmailHtml(user.firstName, report.ai_report, weekStart, weekEnd),
              });
              stats.reports++;
            }
          }
        }
      } catch (err) {
        stats.errors++;
        console.error(`[cron-evening] utente ${user.id}:`, err);
      }
    }

    // Auto-sync calendari di tutti gli utenti attivi
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
          console.error(`[cron-evening] calendar sync user ${conn.user_id}:`, calErr);
        }
      }
    } catch (calErr) {
      console.error('[cron-evening] calendar sync loop:', calErr);
    }

    console.log('[cron-evening]', JSON.stringify(stats));
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error('[cron-evening]', err);
    return NextResponse.json({ error: 'Cron fallito', ...stats }, { status: 500 });
  }
}
