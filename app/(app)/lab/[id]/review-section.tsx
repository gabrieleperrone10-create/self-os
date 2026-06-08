'use client';

import { useState } from 'react';
import type { Experiment } from '@/types';

export function ExperimentReviewSection({
  experiment,
  canReview,
}: {
  experiment: Experiment;
  canReview: boolean;
}) {
  const [review, setReview]     = useState(experiment.last_review ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function generateReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/experiments/${experiment.id}/review`, { method: 'POST' });
      const data = await res.json() as { review?: string; error?: string };
      if (!res.ok || !data.review) throw new Error(data.error ?? 'Review non disponibile');
      setReview(data.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }

  if (review) {
    return (
      <div style={reviewCard}>
        <p style={reviewLabel}>Review — {experiment.duration_days} giorni</p>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.75 }}>
          {review.split('\n').map((line, i) => (
            <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={reviewCard}>
      <p style={reviewLabel}>Review disponibile</p>
      {canReview ? (
        <>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Hai abbastanza dati per una review. Lab leggerà le tue giornate e ti darà una lettura onesta.
          </p>
          <button onClick={generateReview} disabled={loading} style={reviewBtn}>
            {loading ? 'Lettura dati...' : 'Genera review →'}
          </button>
        </>
      ) : (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Traccia almeno {Math.ceil(experiment.duration_days * 0.6)} giorni per sbloccare la review.
        </p>
      )}
      {error && <p style={{ color: '#B45454', fontSize: '0.78rem', marginTop: '0.75rem' }}>{error}</p>}
    </div>
  );
}

const reviewCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderLeft: '2px solid var(--text-muted)', borderRadius: '3px',
  padding: '1.5rem 1.75rem', marginBottom: '2rem',
};

const reviewLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem',
};

const reviewBtn: React.CSSProperties = {
  padding: '0.625rem 1.25rem', background: 'transparent',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', cursor: 'pointer',
};
