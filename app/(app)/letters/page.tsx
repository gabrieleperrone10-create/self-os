'use client';

import { useState, useEffect } from 'react';
import type { MonthlyLetter } from '@/types';

const MONTH_NAMES_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function LettersPage() {
  const [letters, setLetters] = useState<MonthlyLetter[]>([]);
  const [selected, setSelected] = useState<MonthlyLetter | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/ai/monthly-letter')
      .then(r => r.json())
      .then((data: { letters?: MonthlyLetter[] }) => {
        const l = data.letters ?? [];
        setLetters(l);
        if (l.length > 0) setSelected(l[0]);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/monthly-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json() as { letter?: MonthlyLetter; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore');
      if (data.letter) {
        setLetters(prev => {
          const without = prev.filter(l => !(l.month === data.letter!.month && l.year === data.letter!.year));
          return [data.letter!, ...without];
        });
        setSelected(data.letter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setGenerating(false);
    }
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const hasCurrentMonth = letters.some(l => l.month === currentMonth && l.year === currentYear);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>SELF OS</p>
        <h1 style={pageTitle}>Lettere mensili</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', lineHeight: 1.7 }}>
          Ogni mese, una lettera personale che riflette chi sei stato.
        </p>
      </div>

      <div className="letters-layout">
        {/* Sidebar — letter list */}
        <div>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'transparent',
              border: '1px solid var(--gold)',
              borderRadius: '3px',
              color: 'var(--gold)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.8rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              marginBottom: '1.5rem',
            }}
          >
            {generating ? 'Generando...' : hasCurrentMonth ? 'Rigenera questo mese' : `Genera ${MONTH_NAMES_IT[currentMonth - 1]}`}
          </button>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#B45454', marginBottom: '1rem' }}>{error}</p>
          )}

          {loaded && letters.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
              Nessuna lettera ancora.<br />Genera la prima.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {letters.map(l => {
              const isSelected = selected?.id === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isSelected ? 'var(--surface)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '3px',
                    color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {MONTH_NAMES_IT[l.month - 1]} {l.year}
                </button>
              );
            })}
          </div>
        </div>

        {/* Letter content */}
        <div>
          {selected ? (
            <div className="animate-fade-in">
              <p style={{ ...mutedLabel, marginBottom: '0.5rem' }}>
                {MONTH_NAMES_IT[selected.month - 1]} {selected.year}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Generata il {new Date(selected.generated_at).toLocaleDateString('it-IT')}
              </p>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: '2px solid var(--gold)',
                  borderRadius: '3px',
                  padding: '2.5rem 3rem',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1rem',
                    lineHeight: 2,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-line',
                    fontStyle: 'italic',
                  }}
                >
                  {selected.ai_letter}
                </p>
              </div>
            </div>
          ) : loaded ? (
            <div style={{
              padding: '3rem 2rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
                Genera la tua prima lettera mensile.<br />
                SELF OS rifletterà chi sei stato questo mese.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.5rem',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginBottom: '0.75rem',
};
