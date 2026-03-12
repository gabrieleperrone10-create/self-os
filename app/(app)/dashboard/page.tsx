import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { calculateStreak, averageStateScore } from '@/lib/utils/checkin';
import { calculateMomentum } from '@/lib/utils/momentum';
import type { Profile, Checkin, Scan, Decision } from '@/types';
import { VoiceCheckinCard } from '@/components/shared/voice-checkin-card';
import { MomentumCard } from '@/components/shared/momentum-card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Parallel fetches
  const [profileRes, checkinsRes, scanRes, decisionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60),
    supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single<Scan>(),
    supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const profile = profileRes.data;
  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const scan = scanRes.data;
  const decisions = (decisionsRes.data ?? []) as Decision[];

  // Redirect to scan if onboarding not done
  if (profile && !profile.onboarding_completed) redirect('/scan');

  const firstName = profile?.full_name?.split(' ')[0] ?? 'amico';

  // Onboarding progress
  const hasScan = !!scan;
  const hasCheckin = checkins.length > 0;
  const hasMirror = decisions.length > 0;
  const onboardingDone = hasScan && hasCheckin && hasMirror;
  const onboardingCount = [hasScan, hasCheckin, hasMirror].filter(Boolean).length;

  // Today's check-ins
  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = checkins.filter(c => c.date === today);
  const morningDone = todayCheckins.some(c => c.type === 'morning');
  const eveningDone = todayCheckins.some(c => c.type === 'evening');

  // Last insight (most recent checkin with insight)
  const lastInsight = checkins.find(c => c.ai_insight)?.ai_insight ?? null;

  // Last 7 days state score
  const last7 = checkins.filter(c => {
    const diff = (Date.now() - new Date(c.date).getTime()) / 86400000;
    return diff <= 7;
  });
  const avgScore = averageStateScore(last7);

  // Streak
  const streak = calculateStreak(checkins);

  // Momentum score
  const momentum = calculateMomentum(checkins, decisions, streak);

  // Today's state score
  const todayScore = todayCheckins.length > 0
    ? Math.round(todayCheckins.reduce((s, c) => s + (c.state_score ?? 0), 0) / todayCheckins.length)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>Sistema Operativo Identitario</p>
        <h1 style={pageTitle}>Benvenuto, {firstName}</h1>
      </div>

      {/* Onboarding progress */}
      {!onboardingDone && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--gold)',
            borderRadius: '3px',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            maxWidth: '560px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Attiva il sistema — {onboardingCount}/3
            </p>
            <Link href="/onboarding" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Vedi tutto →
            </Link>
          </div>
          <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', marginBottom: '1rem' }}>
            <div style={{ height: '100%', width: `${(onboardingCount / 3) * 100}%`, background: 'var(--gold)', borderRadius: '1px' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Scan', done: hasScan, href: '/scan' },
              { label: 'Check-in', done: hasCheckin, href: '/checkin' },
              { label: 'Mirror', done: hasMirror, href: '/mirror' },
            ].map(step => (
              <Link
                key={step.label}
                href={step.done ? '#' : step.href}
                style={{ fontSize: '0.8rem', color: step.done ? 'var(--pattern)' : 'var(--text-secondary)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}
              >
                {step.done ? '✓ ' : '○ '}{step.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Momentum + State cards */}
      <div
        className="animate-stagger"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}
      >
        <MomentumCard data={momentum} />
        <StateCard
          label="Stato oggi"
          color="var(--stato)"
          value={todayScore !== null ? `${todayScore}/10` : '—'}
          sub={todayScore !== null ? 'Registrato' : 'Nessun check-in'}
        />
        <StateCard
          label="Media 7 giorni"
          color="var(--pattern)"
          value={avgScore !== null ? `${avgScore}` : '—'}
          sub="Stato interno"
        />
        <StateCard
          label="Streak"
          color="var(--gold)"
          value={streak > 0 ? `${streak}` : '—'}
          sub={streak === 1 ? 'giorno consecutivo' : streak > 1 ? 'giorni consecutivi' : 'Inizia oggi'}
        />
        <StateCard
          label="Scan"
          color="var(--identita)"
          value={scan ? '✓' : '—'}
          sub={scan ? 'Profilo completato' : 'Non completato'}
        />
      </div>

      {/* Check-in oggi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '3rem', maxWidth: '560px' }}>
        <CheckinStatusCard type="morning" done={morningDone} />
        <CheckinStatusCard type="evening" done={eveningDone} />
      </div>

      {/* Voice check-in */}
      <div style={{ marginBottom: '3rem' }}>
        <VoiceCheckinCard />
      </div>

      {/* Last insight */}
      {lastInsight && (
        <div
          className="animate-fade-up"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--gold)',
            borderRadius: '3px',
            padding: '1.75rem 2rem',
            maxWidth: '640px',
            marginBottom: '3rem',
          }}
        >
          <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Ultima riflessione</p>
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1rem',
              lineHeight: 1.85,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
            }}
          >
            {lastInsight}
          </p>
        </div>
      )}

      {/* Scan identity summary */}
      {scan?.analysis && (
        <div style={{ maxWidth: '640px' }}>
          <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Il tuo profilo identitario</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(() => {
              // Support both old schema (shadow_pattern/expansion_zone) and new ScanReport schema (archetype_primary/wheel_expansion)
              const a = scan.analysis as unknown as Record<string, unknown>;
              const items: { label: string; title: string; color: string }[] = [];

              if (a.archetype_primary && typeof a.archetype_primary === 'object') {
                const ap = a.archetype_primary as { title: string };
                items.push({ label: 'Archetipo Primario', title: ap.title, color: 'var(--identita)' });
              } else if (a.shadow_pattern && typeof a.shadow_pattern === 'object') {
                items.push({ label: 'Pattern Ombra', title: (a.shadow_pattern as { title: string }).title, color: 'var(--identita)' });
              }

              if (a.identity_target && typeof a.identity_target === 'object') {
                const it = a.identity_target as { name: string };
                items.push({ label: 'Identità Target', title: it.name, color: 'var(--pattern)' });
              } else if (a.expansion_zone && typeof a.expansion_zone === 'object') {
                items.push({ label: 'Zona di Espansione', title: (a.expansion_zone as { title: string }).title, color: 'var(--pattern)' });
              }

              return items.map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: item.color, marginBottom: '0.2rem' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
                      {item.title}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
          <Link
            href="/identity-map"
            style={{
              display: 'inline-block',
              marginTop: '1.25rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Vedi Identity Map →
          </Link>
        </div>
      )}

      {/* CTA se nessun scan */}
      {!scan && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            padding: '2rem',
            maxWidth: '480px',
          }}
        >
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Completa il tuo Scan iniziale
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            8 domande per mappare chi sei davvero.
          </p>
          <Link href="/scan" style={goldLinkStyle}>Inizia lo Scan →</Link>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function StateCard({
  label,
  color,
  value,
  sub,
}: {
  label: string;
  color: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${color}`,
        borderRadius: '3px',
        padding: '1.25rem 1.5rem',
      }}
    >
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color, marginBottom: '0.75rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

function CheckinStatusCard({ type, done }: { type: 'morning' | 'evening'; done: boolean }) {
  const label = type === 'morning' ? 'Mattina' : 'Sera';
  const color = type === 'morning' ? 'var(--stato)' : 'var(--identita)';

  return (
    <Link
      href={done ? '#' : '/checkin'}
      style={{
        display: 'block',
        padding: '1.25rem',
        background: 'var(--surface)',
        border: `1px solid ${done ? color : 'var(--border)'}`,
        borderRadius: '3px',
        textDecoration: 'none',
        opacity: done ? 0.6 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color, marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.85rem', color: done ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
        {done ? 'Completato ✓' : 'Fai il check-in →'}
      </p>
    </Link>
  );
}

// ─── Shared styles ─────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginTop: '0.5rem',
};

const goldLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.625rem 1.25rem',
  border: '1px solid var(--gold)',
  borderRadius: '3px',
  color: 'var(--gold)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.875rem',
  textDecoration: 'none',
  letterSpacing: '0.05em',
};
