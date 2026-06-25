'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceRecorder } from './voice-recorder';
import type { VoiceAnalysis } from '@/app/api/ai/voice-analyze/route';

type Phase = 'idle' | 'recording' | 'analyzing' | 'done';

export function VoiceCheckinCard({ disabled }: { disabled?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleTranscript(transcript: string) {
    setPhase('analyzing');
    setError(null);

    try {
      const res = await fetch('/api/ai/voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, saveCheckin: true }),
      });

      const data = await res.json() as { analysis?: VoiceAnalysis; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analisi fallita');

      setAnalysis(data.analysis ?? null);
      setPhase('done');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setPhase('idle');
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: '2px solid var(--gold)',
        borderRadius: '3px',
        padding: '1.5rem',
        maxWidth: '480px',
      }}
    >
      <p style={sectionLabel}>Check-in vocale</p>

      {phase === 'idle' && disabled && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>
          Non disponibile in modalità sola lettura.
        </p>
      )}

      {phase === 'idle' && !disabled && (
        <>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem', fontFamily: 'Georgia, serif' }}>
            Parla per 30–60 secondi. Come stai adesso?
          </p>
          <VoiceRecorder
            onConfirm={handleTranscript}
            maxSeconds={60}
          />
          {error && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#B45454' }}>{error}</p>
          )}
        </>
      )}

      {phase === 'analyzing' && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          Analisi in corso...
        </p>
      )}

      {phase === 'done' && analysis && (
        <div className="animate-stagger">
          {/* State score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'var(--gold)' }}>
              {analysis.state_score}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/10</span>
          </div>

          {/* Keywords */}
          {analysis.keywords.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {analysis.keywords.map(kw => (
                <span
                  key={kw}
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)',
                    borderRadius: '2px',
                    color: 'var(--gold)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Insight */}
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.9rem',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              borderLeft: '2px solid var(--gold)',
              paddingLeft: '1rem',
              marginBottom: '1rem',
            }}
          >
            {analysis.insight}
          </p>

          {/* Pattern */}
          {analysis.pattern && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pattern rilevato: <span style={{ color: 'var(--identita)' }}>{analysis.pattern}</span>
            </p>
          )}

          <button
            onClick={() => { setPhase('idle'); setAnalysis(null); }}
            style={{
              marginTop: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ← Nuovo check-in
          </button>
        </div>
      )}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '1rem',
};
