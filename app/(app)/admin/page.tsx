import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { UserPlan } from '@/types';

interface ProfileRow {
  id: string;
  plan: UserPlan;
  onboarding_completed: boolean;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

interface AiUsageRow {
  user_id: string;
  route: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const now = Date.now();
  const sevenDaysAgoDate = new Date(now - 7 * 86400000).toISOString().split('T')[0];

  const [profilesRes, checkinsRes, scansRes, aiUsageRes] = await Promise.all([
    supabase.from('profiles').select('id, plan, onboarding_completed, created_at, full_name, email'),
    supabase.from('checkins').select('user_id, date').gte('date', sevenDaysAgoDate),
    supabase.from('scans').select('user_id'),
    supabase
      .from('ai_usage')
      .select('user_id, route, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens')
      .gte('date', sevenDaysAgoDate),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const aiUsage = (aiUsageRes.data ?? []) as AiUsageRow[];
  const totalUsers = profiles.length;
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  // Signups
  const newUsers7d = profiles.filter(p => new Date(p.created_at).getTime() >= now - 7 * 86400000).length;
  const newUsers30d = profiles.filter(p => new Date(p.created_at).getTime() >= now - 30 * 86400000).length;

  // Plan breakdown
  const planCounts: Record<UserPlan, number> = { free: 0, pro: 0, coach: 0 };
  for (const p of profiles) {
    planCounts[p.plan] = (planCounts[p.plan] ?? 0) + 1;
  }

  // Activation: scan completato
  const activatedUserIds = new Set((scansRes.data ?? []).map(s => s.user_id as string));
  const activationPct = totalUsers > 0 ? Math.round((activatedUserIds.size / totalUsers) * 100) : 0;

  // Engagement: check-in negli ultimi 7gg
  const activeUserIds7d = new Set((checkinsRes.data ?? []).map(c => c.user_id as string));
  const activePct = totalUsers > 0 ? Math.round((activeUserIds7d.size / totalUsers) * 100) : 0;

  // A rischio: onboarding completato ma fermi da 7+ giorni
  const atRiskCount = profiles.filter(p => p.onboarding_completed && !activeUserIds7d.has(p.id)).length;

  // Uso AI — per route
  const byRoute = new Map<string, { calls: number; input: number; output: number; cacheRead: number; cacheWrite: number }>();
  const byUser = new Map<string, { tokens: number; calls: number }>();
  let totalTokens7d = 0;

  for (const row of aiUsage) {
    const route = byRoute.get(row.route) ?? { calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    route.calls += 1;
    route.input += row.input_tokens;
    route.output += row.output_tokens;
    route.cacheRead += row.cache_read_tokens;
    route.cacheWrite += row.cache_write_tokens;
    byRoute.set(row.route, route);

    const total = row.input_tokens + row.output_tokens + row.cache_read_tokens + row.cache_write_tokens;
    totalTokens7d += total;

    const user = byUser.get(row.user_id) ?? { tokens: 0, calls: 0 };
    user.tokens += total;
    user.calls += 1;
    byUser.set(row.user_id, user);
  }

  const byRouteSorted = Array.from(byRoute.entries()).sort(
    (a, b) => (b[1].input + b[1].output) - (a[1].input + a[1].output)
  );

  const topUsers = Array.from(byUser.entries())
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5)
    .map(([userId, stats]) => ({ userId, ...stats, profile: profileMap.get(userId) }));

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '2.5rem' }}>
        <h1 style={pageTitle}>Andamento prodotto</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {totalUsers} {totalUsers === 1 ? 'utente totale' : 'utenti totali'}
        </p>
      </div>

      {/* Top stat cards */}
      <div
        className="animate-stagger"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}
      >
        <StatCard label="Nuovi (7gg)" value={String(newUsers7d)} sub={`${newUsers30d} negli ultimi 30gg`} color="var(--gold)" />
        <StatCard label="Scan completato" value={`${activationPct}%`} sub={`${activatedUserIds.size}/${totalUsers} utenti`} color="var(--identita)" />
        <StatCard label="Attivi (7gg)" value={String(activeUserIds7d.size)} sub={`${activePct}% del totale`} color="var(--pattern)" />
        <StatCard label="A rischio" value={String(atRiskCount)} sub="onboarded, fermi 7+ gg" color="#B45454" />
      </div>

      {/* Plan breakdown */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Distribuzione piani</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(['free', 'pro', 'coach'] as const).map(plan => (
            <div key={plan} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1rem 1.5rem', minWidth: '100px' }}>
              <p style={{ ...mutedLabel, marginBottom: '0.4rem' }}>{plan}</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{planCounts[plan]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Uso AI */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Uso AI — ultimi 7 giorni</p>

        <div
          className="animate-stagger"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}
        >
          <StatCard label="Chiamate" value={formatNumber(aiUsage.length)} sub="tutte le route" color="var(--credenze)" />
          <StatCard label="Token totali" value={formatNumber(totalTokens7d)} sub="input + output + cache" color="var(--credenze)" />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {byRouteSorted.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nessuna chiamata AI negli ultimi 7 giorni.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Route</th>
                  <th style={thStyle}>Chiamate</th>
                  <th style={thStyle}>Input</th>
                  <th style={thStyle}>Output</th>
                  <th style={thStyle}>Cache read</th>
                  <th style={thStyle}>Cache write</th>
                </tr>
              </thead>
              <tbody>
                {byRouteSorted.map(([route, s]) => (
                  <tr key={route}>
                    <td style={tdStyle}>{route}</td>
                    <td style={tdStyle}>{s.calls}</td>
                    <td style={tdStyle}>{formatNumber(s.input)}</td>
                    <td style={tdStyle}>{formatNumber(s.output)}</td>
                    <td style={tdStyle}>{formatNumber(s.cacheRead)}</td>
                    <td style={tdStyle}>{formatNumber(s.cacheWrite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {topUsers.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
            <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Top utenti per consumo token</p>
            {topUsers.map(u => (
              <div key={u.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <Link href={`/admin/users/${u.userId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>
                  {u.profile?.full_name ?? u.profile?.email ?? u.userId}
                </Link>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatNumber(u.tokens)} token · {u.calls} chiamate</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/admin/users" style={{ fontSize: '0.85rem', color: 'var(--gold)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
        Vedi tutti gli utenti →
      </Link>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `2px solid ${color}`, borderRadius: '3px', padding: '1.25rem 1.5rem' }}>
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color, marginBottom: '0.75rem' }}>{label}</p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('it-IT');
}

// ─── Styles ─────────────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

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
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem 0.5rem 0',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem 0.5rem 0',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'Georgia, serif',
};
