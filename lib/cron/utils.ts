import type { NextRequest } from 'next/server';
import type { AdminClient } from '@/lib/supabase/admin';

/** Autorizzazione dei cron: Vercel invia Authorization: Bearer CRON_SECRET. */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/** Data odierna (YYYY-MM-DD) e componenti nel fuso utenti (Europe/Rome). */
export function romeToday(): { date: string; dayOfWeek: number; dayOfMonth: number } {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric' })
    .formatToParts(now);
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const day = Number(parts.find(p => p.type === 'day')?.value ?? '1');
  return { date, dayOfWeek: weekdayMap[weekday] ?? 1, dayOfMonth: day };
}

export interface ActiveUser {
  id: string;
  email: string;
  firstName: string;
}

/**
 * Utenti destinatari dei promemoria: onboarding completato, attivi negli
 * ultimi 21 giorni, promemoria non disattivati. Legge i profili con
 * select('*') così la colonna email_reminders è opzionale (fail-open
 * finché la migrazione 009 non è applicata).
 */
export async function fetchActiveUsers(supabase: AdminClient, sinceDate: string): Promise<ActiveUser[]> {
  const [{ data: profiles }, { data: recent }] = await Promise.all([
    supabase.from('profiles').select('*').eq('onboarding_completed', true).limit(200),
    supabase.from('checkins').select('user_id').gte('date', sinceDate),
  ]);

  const activeIds = new Set((recent ?? []).map((r: { user_id: string }) => r.user_id));

  return (profiles ?? [])
    .filter((p: Record<string, unknown>) =>
      p.email &&
      activeIds.has(p.id as string) &&
      p.email_reminders !== false)
    .map((p: Record<string, unknown>) => ({
      id: p.id as string,
      email: p.email as string,
      firstName: ((p.full_name as string | null)?.split(' ')[0]) || 'tu',
    }));
}

export function daysAgo(n: number, from: string): string {
  const d = new Date(from + 'T12:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
