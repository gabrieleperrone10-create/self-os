import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Profile, Checkin, Pattern, Decision } from '@/types';
import { averageStateScore, calculateStreak } from '@/lib/utils/checkin';

interface AiUsageRow {
  route: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [profileRes, checkinsRes, patternsRes, scanRes, decisionsRes, aiUsageRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single<Profile>(),
    supabase.from('checkins').select('*').eq('user_id', id).gte('date', thirtyDaysAgo).order('date', { ascending: false }),
    supabase.from('patterns').select('*').eq('user_id', id).eq('is_active', true),
    supabase.from('scans').select('completed_at').eq('user_id', id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('decisions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
    supabase
      .from('ai_usage')
      .select('route, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens')
      .eq('user_id', id)
      .gte('date', thirtyDaysAgo),
  ]);

  const profile = profileRes.data;
  if (!profile) notFound();

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = scanRes.data;
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const aiUsage = (aiUsageRes.data ?? []) as AiUsageRow[];

  const avgScore = averageStateScore(checkins);
  const streak = calculateStreak(checkins);

  // Uso AI per route
  const byRoute = new Map<string, { calls: number; tokens: number }>();
  let totalAiTokens = 0;
  for (const row of aiUsage) {
    const total = row.input_tokens + row.output_tokens + row.cache_read_tokens + row.cache_write_tokens;
    totalAiTokens += total;
    const entry = byRoute.get(row.route) ?? { calls: 0, tokens: 0 };
    entry.calls += 1;
    entry.tokens += total;
    byRoute.set(row.route, entry);
  }
  const byRouteSorted = Array.from(byRoute.entries()).sort((a, b) => b[1].tokens - a[1].tokens);

  return (
    <div>
      <Link href="/admin/users" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
        ← Tutti gli utenti
      </Link>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '2.5rem' }}>
        <p style={mutedLabel}>UTENTE</p>
        <h1 style={pageTitle}>{profile.full_name ?? 'Senza nome'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{profile.email}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Tag>{profile.plan}</Tag>
          <Tag>{profile.role}</Tag>
          <Tag>iscritto {formatDate(profile.created_at)}</Tag>
        </div>
      </div>

      {/* Metrics */}
      <div className="admin-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Stato medio 30gg', value: avgScore !== null ? `${avgScore}/10` : '—', color: 'var(--stato)' },
          { label: 'Check-in 30gg', value: String(checkins.length), color: 'var(--pattern)' },
          { label: 'Streak', value: streak > 0 ? `${streak}gg` : '—', color: 'var(--gold)' },
          { label: 'Pattern attivi', value: String(patterns.length), color: 'var(--identita)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `2px solid ${m.color}`, borderRadius: '3px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: m.color, marginBottom: '0.5rem' }}>{m.label}</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Onboarding / scan status */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <SmallStat label="Onboarding" value={profile.onboarding_completed ? 'Completato' : 'In corso'} />
        <SmallStat label="Scan iniziale" value={scan ? `Completato il ${formatDate(scan.completed_at)}` : 'Non completato'} />
      </div>

      <div className="admin-detail-grid" style={{ marginBottom: '2.5rem' }}>
        {/* Recent decisions */}
        {decisions.length > 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
            <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Decisioni recenti</p>
            {decisions.map(d => (
              <div key={d.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                  {d.description}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stato: {d.state_score}/10</span>
                  {d.origin && (
                    <span style={{ fontSize: '0.7rem', color: d.origin === 'fear' ? '#B45454' : 'var(--pattern)' }}>
                      {d.origin === 'fear' ? 'Paura' : 'Visione'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard label="Decisioni" text="Nessuna decisione registrata." />
        )}

        {/* Active patterns */}
        {patterns.length > 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
            <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Pattern attivi</p>
            {patterns.map(p => (
              <div key={p.id} style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{p.type}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>{p.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard label="Pattern" text="Nessun pattern attivo." />
        )}
      </div>

      {/* Uso AI */}
      <div>
        <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Uso AI — ultimi 30 giorni</p>
        {byRouteSorted.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nessuna chiamata AI negli ultimi 30 giorni.</p>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem', maxWidth: '480px' }}>
            {byRouteSorted.map(([route, s]) => (
              <div key={route} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>{route}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.calls} chiamate · {s.tokens.toLocaleString('it-IT')} token</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Totale</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
                {aiUsage.length} chiamate · {totalAiTokens.toLocaleString('it-IT')} token
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </span>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1rem 1.25rem' }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>{value}</p>
    </div>
  );
}

function EmptyCard({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
      <p style={{ ...mutedLabel, marginBottom: '0.75rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{text}</p>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT');
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
