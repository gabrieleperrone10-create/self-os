import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import Link from 'next/link';
import type { Experiment, ExperimentEntry } from '@/types';

const RESPONSE_DOT: Record<string, { color: string; label: string }> = {
  acted_differently: { color: 'var(--pattern)',   label: 'Agito diversamente' },
  noticed_during:    { color: 'var(--gold)',       label: 'Visto in tempo reale' },
  noticed_after:     { color: '#7A8B9E',           label: 'Visto dopo' },
  automatic:         { color: '#B45454',           label: 'Automatico' },
};

export default async function LabPage() {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) redirect('/login');
  const { viewUserId, isImpersonating } = viewContext;

  const [experimentsRes, entriesRes] = await Promise.all([
    supabase
      .from('experiments')
      .select('*')
      .eq('user_id', viewUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('experiment_entries')
      .select('*')
      .eq('user_id', viewUserId)
      .order('date', { ascending: true }),
  ]);

  const experiments = (experimentsRes.data ?? []) as Experiment[];
  const allEntries = (entriesRes.data ?? []) as ExperimentEntry[];

  const active = experiments.filter(e => e.status === 'active');
  const past = experiments.filter(e => e.status !== 'active');
  const canAdd = active.length < 2;

  const entriesByExp = allEntries.reduce<Record<string, ExperimentEntry[]>>((acc, e) => {
    if (!acc[e.experiment_id]) acc[e.experiment_id] = [];
    acc[e.experiment_id].push(e);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>Trasformazione comportamentale</p>
        <h1 style={pageTitle}>Lab</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginTop: '0.5rem', maxWidth: '480px' }}>
          Dove un pattern smette di essere osservato e inizia ad essere trasformato.
          Max 2 esperimenti attivi.
        </p>
      </div>

      {/* Active experiments */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
          <p style={mutedLabel}>Attivi — {active.length}/2</p>
          {canAdd && !isImpersonating && (
            <Link href="/lab/new" style={goldLink}>
              + Nuovo esperimento
            </Link>
          )}
        </div>

        {active.length === 0 ? (
          <div style={emptyCard}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Nessun esperimento attivo.
            </p>
            {!isImpersonating && (
              <Link href="/lab/new" style={goldBtn}>Apri il primo esperimento →</Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {active.map(exp => {
              const entries = entriesByExp[exp.id] ?? [];
              const daysPassed = Math.floor((Date.now() - new Date(exp.started_at + 'T12:00:00').getTime()) / 86400000);
              const trackedToday = entries.some(e => e.date === today);
              return (
                <ExperimentCard
                  key={exp.id}
                  experiment={exp}
                  entries={entries}
                  daysPassed={daysPassed}
                  trackedToday={trackedToday}
                  isImpersonating={isImpersonating}
                />
              );
            })}
          </div>
        )}

        {!canAdd && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Hai raggiunto il limite di 2 esperimenti attivi. Completa o metti in pausa uno per aprirne un nuovo.
          </p>
        )}
      </div>

      {/* Past experiments */}
      {past.length > 0 && (
        <div>
          <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Completati</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {past.map(exp => {
              const resolutionLabel: Record<string, string> = {
                integrated: 'Integrato',
                behavioral_shift: 'Discontinuità comportamentale',
                no_change: 'Nessun cambiamento',
              };
              return (
                <Link key={exp.id} href={`/lab/${exp.id}`} style={pastCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {exp.pattern_title}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: exp.resolution === 'integrated' ? 'var(--pattern)' : 'var(--text-muted)' }}>
                      {exp.resolution ? resolutionLabel[exp.resolution] : exp.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Experiment Card ────────────────────────────────────────────

function ExperimentCard({
  experiment: exp,
  entries,
  daysPassed,
  trackedToday,
  isImpersonating,
}: {
  experiment: Experiment;
  entries: ExperimentEntry[];
  daysPassed: number;
  trackedToday: boolean;
  isImpersonating?: boolean;
}) {
  const totalDays = exp.duration_days;
  const dots = Array.from({ length: totalDays }, (_, i) => {
    const dayDate = new Date(exp.started_at + 'T12:00:00');
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    return { dateStr, entry, isFuture: i > daysPassed };
  });

  return (
    <div style={activeCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.3rem' }}>
            Giorno {Math.min(daysPassed + 1, totalDays)}/{totalDays}
          </p>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 'normal' }}>
            {exp.pattern_title}
          </h3>
        </div>
        <Link href={`/lab/${exp.id}`} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          Dettaglio →
        </Link>
      </div>

      {/* Trigger */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.6 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Trigger </span>
        {exp.triggers[0]}
      </p>

      {/* Different action reminder */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Azione </span>
        {exp.different_action}
      </p>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {dots.map(({ dateStr, entry, isFuture }) => {
          let bg = 'var(--border)';
          if (entry) {
            if (!entry.emerged) bg = 'rgba(139,158,122,0.3)';
            else if (entry.response) bg = RESPONSE_DOT[entry.response]?.color ?? 'var(--text-muted)';
          }
          return (
            <div
              key={dateStr}
              title={entry ? (entry.emerged ? entry.response ?? 'emerso' : 'non emerso') : isFuture ? 'futuro' : 'non tracciato'}
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: isFuture ? 'transparent' : bg,
                border: isFuture ? '1px solid var(--border)' : 'none',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Track today CTA */}
      {!trackedToday && daysPassed < totalDays && !isImpersonating && (
        <Link href={`/lab/${exp.id}#track`} style={trackBtn}>
          Segna la giornata →
        </Link>
      )}
      {trackedToday && (
        <p style={{ fontSize: '0.78rem', color: 'var(--pattern)' }}>✓ Giornata segnata</p>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '2rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginTop: '0.5rem',
};

const activeCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderLeft: '2px solid var(--gold)', borderRadius: '3px',
  padding: '1.5rem 1.75rem', maxWidth: '640px',
};

const emptyCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '2rem', maxWidth: '480px',
};

const pastCard: React.CSSProperties = {
  display: 'block', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1rem 1.25rem', maxWidth: '640px',
  textDecoration: 'none', transition: 'border-color 0.3s ease',
};

const goldLink: React.CSSProperties = {
  fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none',
  fontFamily: 'Georgia, serif', letterSpacing: '0.03em',
};

const goldBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.625rem 1.25rem',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', textDecoration: 'none', letterSpacing: '0.05em',
};

const trackBtn: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.82rem', color: 'var(--gold)',
  textDecoration: 'none', fontFamily: 'Georgia, serif',
  borderBottom: '1px solid rgba(201,169,110,0.3)', paddingBottom: '1px',
};
