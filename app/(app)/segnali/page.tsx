'use client';

import { useState, useEffect, useRef } from 'react';
import type { Signal } from '@/types';

// ─── Formatting ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)     return 'Adesso';
  if (diff < 3600)   return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} ore fa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} giorni fa`;
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// Stato non più richiesto in fase di cattura — registrato a un valore neutro fisso
const DEFAULT_STATE_SCORE = 5;

const MAX_CONTENT_LENGTH = 1000;

function stateColor(score: number): string {
  if (score >= 7) return 'var(--pattern)';
  if (score >= 4) return 'var(--gold)';
  return '#B45454';
}

// ─── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, isNew = false }: { signal: Signal; isNew?: boolean }) {
  const [analysis, setAnalysis] = useState(signal.ai_analysis);

  // Poll for analysis if missing (was saved async)
  useEffect(() => {
    if (analysis) return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/signals');
      if (!res.ok) return;
      const data = await res.json() as { signals: Signal[] };
      const updated = data.signals.find(s => s.id === signal.id);
      if (updated?.ai_analysis) {
        setAnalysis(updated.ai_analysis);
        clearInterval(interval);
      }
    }, 2000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [signal.id, analysis]);

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isNew ? 'rgba(201,169,110,0.3)' : 'var(--border)'}`,
      borderLeft: `2px solid ${stateColor(signal.state_score)}`,
      borderRadius: '3px',
      padding: '1.25rem 1.5rem',
      transition: 'border-color 0.4s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.65, margin: 0 }}>
          {signal.content}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(signal.created_at)}</span>
          <span style={{
            fontSize: '0.72rem', color: stateColor(signal.state_score),
            letterSpacing: '0.05em',
          }}>
            {signal.state_score}/10
          </span>
        </div>
      </div>

      {analysis ? (
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '0.85rem',
          color: 'var(--text-secondary)', lineHeight: 1.7,
          fontStyle: 'italic', margin: 0,
          borderTop: '1px solid var(--border)', paddingTop: '0.75rem',
        }}>
          {analysis}
        </p>
      ) : (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          Analisi in corso...
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SegnaliPage() {
  const [content, setContent] = useState('');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [newSignalId, setNewSignalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Load existing signals
  useEffect(() => {
    fetch('/api/signals')
      .then(r => r.json())
      .then((d: { signals?: Signal[] }) => setSignals(d.signals ?? []))
      .catch(() => {});
  }, []);

  async function submit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), state_score: DEFAULT_STATE_SCORE }),
      });
      const data = await res.json() as { signal?: Signal; error?: string };
      if (!res.ok || !data.signal) throw new Error(data.error ?? 'Errore');
      setSignals(prev => [data.signal!, ...prev]);
      setNewSignalId(data.signal!.id);
      setContent('');
      textRef.current?.focus();
      setTimeout(() => setNewSignalId(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSubmitting(false);
    }
  }

  const charsLeft = MAX_CONTENT_LENGTH - content.length;

  return (
    <div style={{ maxWidth: '620px' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={eyebrow}>Cattura spontanea</p>
        <h1 style={pageTitle}>Segnali</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginTop: '0.5rem' }}>
          Cosa hai notato? Una realizzazione, un pattern, una reazione che vale la pena catturare.
          Il sistema lo analizza e lo porta nel contesto del tuo profilo.
        </p>
      </div>

      {/* Capture form */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        padding: '1.5rem',
        marginBottom: '3rem',
      }}>
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          maxLength={MAX_CONTENT_LENGTH}
          rows={4}
          placeholder="Cosa hai notato?"
          style={{
            width: '100%', background: 'transparent', border: 'none',
            color: 'var(--text-primary)', fontFamily: 'Georgia, serif',
            fontSize: '1rem', lineHeight: 1.75, resize: 'none',
            outline: 'none', caretColor: 'var(--gold)',
            marginBottom: '1.25rem',
          }}
        />

        {/* Footer: chars + submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: charsLeft < 30 ? '#B45454' : 'var(--text-muted)' }}>
            {charsLeft} caratteri
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>⌘↵</span>
            <button
              onClick={submit}
              disabled={!content.trim() || submitting}
              style={{
                padding: '0.5rem 1.25rem',
                border: '1px solid var(--gold)', borderRadius: '3px',
                color: 'var(--gold)', background: 'transparent',
                fontFamily: 'Georgia, serif', fontSize: '0.875rem',
                cursor: !content.trim() || submitting ? 'not-allowed' : 'pointer',
                opacity: !content.trim() || submitting ? 0.35 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {submitting ? 'Cattura...' : 'Cattura →'}
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#B45454', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>}
      </div>

      {/* Signal list */}
      {signals.length > 0 && (
        <div>
          <p style={{ ...eyebrow, marginBottom: '1.25rem' }}>Recenti</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {signals.map(s => (
              <SignalCard key={s.id} signal={s} isNew={s.id === newSignalId} />
            ))}
          </div>
        </div>
      )}

      {signals.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Nessun segnale ancora. Cattura il primo momento che vale la pena registrare.
        </p>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontSize: '0.68rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '2rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginTop: '0.5rem',
};
