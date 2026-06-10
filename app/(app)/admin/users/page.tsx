import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { calculateStreak } from '@/lib/utils/checkin';
import type { Profile, Checkin } from '@/types';

type UserStatus = 'attivo' | 'a_rischio' | 'non_attivato';

interface UserRow {
  profile: Profile;
  lastCheckin: string | null;
  streak: number;
  checkins7d: number;
  scanDone: boolean;
  aiCallsToday: number;
  status: UserStatus;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

  const [profilesRes, checkinsRes, scansRes, aiUsageRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('checkins').select('*').gte('date', sixtyDaysAgo),
    supabase.from('scans').select('user_id'),
    supabase.from('ai_usage').select('user_id').eq('date', today),
  ]);

  const profiles = (profilesRes.data ?? []) as Profile[];
  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const scanUserIds = new Set((scansRes.data ?? []).map(s => s.user_id as string));

  const checkinsByUser = new Map<string, Checkin[]>();
  for (const c of checkins) {
    const arr = checkinsByUser.get(c.user_id) ?? [];
    arr.push(c);
    checkinsByUser.set(c.user_id, arr);
  }

  const aiCallsToday = new Map<string, number>();
  for (const row of aiUsageRes.data ?? []) {
    aiCallsToday.set(row.user_id, (aiCallsToday.get(row.user_id) ?? 0) + 1);
  }

  const rows: UserRow[] = profiles.map(p => {
    const userCheckins = (checkinsByUser.get(p.id) ?? [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastCheckin = userCheckins[0]?.date ?? null;
    const checkins7d = userCheckins.filter(c => c.date >= sevenDaysAgo).length;

    let status: UserStatus;
    if (!p.onboarding_completed) status = 'non_attivato';
    else if (checkins7d > 0) status = 'attivo';
    else status = 'a_rischio';

    return {
      profile: p,
      lastCheckin,
      streak: calculateStreak(userCheckins),
      checkins7d,
      scanDone: scanUserIds.has(p.id),
      aiCallsToday: aiCallsToday.get(p.id) ?? 0,
      status,
    };
  });

  // A rischio prima, poi non attivati, poi attivi — ordine secondario per data iscrizione (già da query)
  const statusPriority: Record<UserStatus, number> = { a_rischio: 0, non_attivato: 1, attivo: 2 };
  rows.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  const atRiskCount = rows.filter(r => r.status === 'a_rischio').length;
  const notActivatedCount = rows.filter(r => r.status === 'non_attivato').length;

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={pageTitle}>Utenti</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {rows.length} totali · {atRiskCount} a rischio · {notActivatedCount} non attivati
        </p>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nessun utente registrato.</p>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Utente</th>
                <th style={thStyle}>Piano</th>
                <th style={thStyle}>Iscritto</th>
                <th style={thStyle}>Ultimo check-in</th>
                <th style={thStyle}>Streak</th>
                <th style={thStyle}>Check-in 7gg</th>
                <th style={thStyle}>Scan</th>
                <th style={thStyle}>AI oggi</th>
                <th style={thStyle}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.profile.id}>
                  <td style={tdStyle}>
                    <Link href={`/admin/users/${row.profile.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
                      {row.profile.full_name ?? row.profile.email ?? row.profile.id}
                    </Link>
                  </td>
                  <td style={tdStyle}>{row.profile.plan}</td>
                  <td style={tdStyle}>{formatDate(row.profile.created_at)}</td>
                  <td style={tdStyle}>{row.lastCheckin ? formatDate(row.lastCheckin) : '—'}</td>
                  <td style={tdStyle}>{row.streak > 0 ? `${row.streak}gg` : '—'}</td>
                  <td style={tdStyle}>{row.checkins7d}</td>
                  <td style={tdStyle}>{row.scanDone ? '✓' : '—'}</td>
                  <td style={tdStyle}>{row.aiCallsToday}</td>
                  <td style={tdStyle}><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { label: string; color: string }> = {
    attivo: { label: 'Attivo', color: 'var(--pattern)' },
    a_rischio: { label: 'A rischio', color: '#B45454' },
    non_attivato: { label: 'Non attivato', color: 'var(--text-muted)' },
  };
  const { label, color } = map[status];
  return (
    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', border: `1px solid ${color}`, borderRadius: '2px', color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT');
}

// ─── Styles ─────────────────────────────────────────────────────

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginBottom: '0.25rem',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
  whiteSpace: 'nowrap',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.85rem 1rem',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
};
