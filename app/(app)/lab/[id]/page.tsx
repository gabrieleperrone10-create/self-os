import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Experiment, ExperimentEntry } from '@/types';
import { ExperimentTracker } from './tracker';
import { ExperimentReviewSection } from './review-section';

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [expRes, entriesRes] = await Promise.all([
    supabase.from('experiments').select('*').eq('id', id).eq('user_id', user.id).single<Experiment>(),
    supabase.from('experiment_entries').select('*').eq('experiment_id', id).eq('user_id', user.id).order('date', { ascending: true }),
  ]);

  if (!expRes.data) notFound();

  const experiment = expRes.data;
  const entries = (entriesRes.data ?? []) as ExperimentEntry[];

  const today = new Date().toISOString().split('T')[0];
  const trackedToday = entries.some(e => e.date === today);
  const daysPassed = Math.floor((Date.now() - new Date(experiment.started_at + 'T12:00:00').getTime()) / 86400000);
  const isActive = experiment.status === 'active';
  const isExpired = daysPassed >= experiment.duration_days;
  const canReview = entries.length >= Math.floor(experiment.duration_days * 0.6);

  // Build 7-day dot array
  const dots = Array.from({ length: experiment.duration_days }, (_, i) => {
    const d = new Date(experiment.started_at + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    return { dateStr, entry, isFuture: i > daysPassed };
  });

  const RESPONSE_META: Record<string, { color: string; label: string }> = {
    acted_differently: { color: 'var(--pattern)', label: 'Agito diversamente' },
    noticed_during:    { color: 'var(--gold)',     label: 'Visto in tempo reale' },
    noticed_after:     { color: '#7A8B9E',          label: 'Visto dopo' },
    automatic:         { color: '#B45454',          label: 'Automatico' },
  };

  const emerged = entries.filter(e => e.emerged);
  const actedDiff = entries.filter(e => e.response === 'acted_differently');

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <a href="/lab" style={backLink}>← Lab</a>
        <p style={mutedLabel}>
          {isActive
            ? `Giorno ${Math.min(daysPassed + 1, experiment.duration_days)} di ${experiment.duration_days}`
            : experiment.status}
        </p>
        <h1 style={pageTitle}>{experiment.pattern_title}</h1>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {dots.map(({ dateStr, entry, isFuture }) => {
            let bg = 'var(--border)';
            if (entry) {
              if (!entry.emerged) bg = 'rgba(139,158,122,0.25)';
              else if (entry.response) bg = RESPONSE_META[entry.response]?.color ?? 'var(--text-muted)';
            }
            return (
              <div
                key={dateStr}
                title={entry?.response ?? (entry?.emerged === false ? 'non emerso' : isFuture ? 'futuro' : 'non tracciato')}
                style={{
                  width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isFuture ? 'transparent' : bg,
                  border: isFuture ? '1px solid var(--border)' : 'none',
                }}
              />
            );
          })}
        </div>
        {emerged.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Pattern emerso {emerged.length} {emerged.length === 1 ? 'volta' : 'volte'} su {entries.length} giorni tracciati
            {actedDiff.length > 0 && ` · Agito diversamente ${actedDiff.length} ${actedDiff.length === 1 ? 'volta' : 'volte'}`}
          </p>
        )}
      </div>

      {/* Loop map */}
      <div style={card}>
        <p style={cardLabel}>Come funziona adesso</p>
        <Field label="Trigger" value={experiment.triggers.join(' / ')} />
        <Field label="Emozione / Sensazione" value={experiment.emotion_sensation} />
        <Field label="Azione automatica" value={experiment.automatic_action} />
        <Field label="Conferma identità" value={experiment.identity_confirmation} />
      </div>

      {/* Intervention */}
      <div style={{ ...card, borderLeftColor: 'var(--pattern)' }}>
        <p style={{ ...cardLabel, color: 'var(--pattern)' }}>L&apos;esperimento</p>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={fieldLabel}>
            Scarico — {experiment.body_discharge_name}
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>
              {experiment.body_discharge_duration}
            </span>
          </p>
          <p style={fieldValue}>{experiment.body_discharge_instruction}</p>
        </div>

        <div>
          <p style={fieldLabel}>Poi</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            {experiment.different_action_when}
          </p>
          <p style={fieldValue}>{experiment.different_action}</p>
        </div>
      </div>

      {/* Daily tracker */}
      {isActive && !isExpired && (
        <div id="track" style={{ marginBottom: '2.5rem' }}>
          <p style={mutedLabel}>Oggi</p>
          <ExperimentTracker
            experimentId={experiment.id}
            trackedToday={trackedToday}
            todayEntry={entries.find(e => e.date === today) ?? null}
          />
        </div>
      )}

      {/* Review section */}
      {(isExpired || !isActive) && (
        <ExperimentReviewSection
          experiment={experiment}
          canReview={canReview}
        />
      )}

      {/* Entry history */}
      {entries.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Storico giornaliero</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...entries].reverse().map(e => (
              <div key={e.id} style={historyRow}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '80px' }}>{e.date}</span>
                <span style={{ fontSize: '0.82rem', color: e.emerged ? (RESPONSE_META[e.response ?? '']?.color ?? 'var(--text-secondary)') : 'var(--text-muted)' }}>
                  {e.emerged
                    ? (RESPONSE_META[e.response ?? '']?.label ?? e.response)
                    : 'Non emerso'}
                </span>
                {e.note && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{e.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={fieldLabel}>{label}</p>
      <p style={fieldValue}>{value}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.68rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.75rem',
  fontWeight: 'normal', color: 'var(--text-primary)',
};

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderLeft: '2px solid var(--gold)', borderRadius: '3px',
  padding: '1.5rem 1.75rem', marginBottom: '1.25rem',
};

const cardLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem',
};

const fieldLabel: React.CSSProperties = {
  fontSize: '0.68rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem',
};

const fieldValue: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '0.92rem',
  color: 'var(--text-primary)', lineHeight: 1.65,
};

const backLink: React.CSSProperties = {
  display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem',
  textDecoration: 'none', marginBottom: '1.5rem', fontFamily: 'Georgia, serif',
};

const historyRow: React.CSSProperties = {
  display: 'flex', gap: '1rem', alignItems: 'center',
  padding: '0.5rem 0', borderBottom: '1px solid var(--border)',
};
