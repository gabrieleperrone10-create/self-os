'use client';

import { useState } from 'react';
import type { ExperimentEntry, ExperimentResponse } from '@/types';

const RESPONSES: { value: ExperimentResponse; label: string; color: string }[] = [
  { value: 'acted_differently', label: 'Sì — ho agito diversamente',          color: 'var(--pattern)' },
  { value: 'noticed_during',    label: 'Sì — ci sono caduto, l\'ho visto',    color: 'var(--gold)' },
  { value: 'noticed_after',     label: 'Sì — ci sono caduto, l\'ho visto dopo', color: '#7A8B9E' },
  { value: 'automatic',         label: 'Sì — non l\'ho visto',                color: '#B45454' },
];

export function ExperimentTracker({
  experimentId,
  trackedToday,
  todayEntry,
  readOnly,
}: {
  experimentId: string;
  trackedToday: boolean;
  todayEntry: ExperimentEntry | null;
  readOnly?: boolean;
}) {
  const [emerged, setEmerged]     = useState<boolean | null>(trackedToday ? todayEntry?.emerged ?? null : null);
  const [response, setResponse]   = useState<ExperimentResponse | null>(todayEntry?.response ?? null);
  const [note, setNote]           = useState(todayEntry?.note ?? '');
  const [saved, setSaved]         = useState(trackedToday);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function save(e: boolean, r?: ExperimentResponse) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/experiments/${experimentId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emerged: e, response: r ?? null, note: note.trim() || null }),
      });
      if (!res.ok) throw new Error('Salvataggio fallito');
      setSaved(true);
    } catch {
      setError('Salvataggio fallito. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    const responseLabel = response
      ? RESPONSES.find(r => r.value === response)?.label
      : emerged === false ? 'Non emerso oggi' : '—';
    const responseColor = response
      ? RESPONSES.find(r => r.value === response)?.color
      : 'var(--text-muted)';

    return (
      <div style={doneCard}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pattern)', marginBottom: '0.5rem' }}>
          ✓ Tracciato
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: responseColor }}>
          {responseLabel}
        </p>
        {note && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>{note}</p>}
      </div>
    );
  }

  if (readOnly) {
    return (
      <div style={trackerCard}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
          Giornata non ancora tracciata.
        </p>
      </div>
    );
  }

  return (
    <div style={trackerCard}>
      {/* Emerged question */}
      {emerged === null && (
        <>
          <p style={question}>Il pattern è emerso oggi?</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => { setEmerged(false); save(false); }}
              disabled={saving}
              style={choiceBtn}
            >
              No, non è emerso
            </button>
            <button
              onClick={() => setEmerged(true)}
              disabled={saving}
              style={choiceBtn}
            >
              Sì, è emerso →
            </button>
          </div>
        </>
      )}

      {/* Response question */}
      {emerged === true && response === null && (
        <>
          <p style={question}>Cosa è successo?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {RESPONSES.map(r => (
              <button
                key={r.value}
                onClick={() => { setResponse(r.value); }}
                style={{ ...responseBtn, color: r.color, borderColor: 'var(--border)' }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => setEmerged(null)} style={backBtn}>← Indietro</button>
        </>
      )}

      {/* Note + confirm */}
      {emerged !== null && (emerged === false || response !== null) && !saved && (
        <>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Nota opzionale (max 200 caratteri)
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Cosa hai notato..."
            style={noteArea}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => { setResponse(null); setEmerged(emerged === false ? null : true); }}
              style={backBtn}
            >
              ← Modifica
            </button>
            <button
              onClick={() => save(emerged, response ?? undefined)}
              disabled={saving}
              style={saveBtn}
            >
              {saving ? 'Salvo...' : 'Salva giornata →'}
            </button>
          </div>
          {error && <p style={{ color: '#B45454', fontSize: '0.78rem', marginTop: '0.5rem' }}>{error}</p>}
        </>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const trackerCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.5rem 1.75rem',
};

const doneCard: React.CSSProperties = {
  ...trackerCard, borderLeft: '2px solid var(--pattern)',
};

const question: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1rem',
  color: 'var(--text-primary)', marginBottom: '1.25rem',
};

const choiceBtn: React.CSSProperties = {
  padding: '0.75rem 1.25rem', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: '3px',
  color: 'var(--text-secondary)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.25s ease',
};

const responseBtn: React.CSSProperties = {
  padding: '0.875rem 1.25rem', background: 'var(--surface)',
  border: '1px solid', borderRadius: '3px',
  fontFamily: 'Georgia, serif', fontSize: '0.875rem',
  cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.25s ease',
};

const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-muted)',
  fontFamily: 'Georgia, serif', fontSize: '0.78rem',
  cursor: 'pointer', padding: 0, marginTop: '1rem',
};

const saveBtn: React.CSSProperties = {
  padding: '0.625rem 1.25rem', background: 'transparent',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', cursor: 'pointer',
};

const noteArea: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif', fontSize: '0.9rem',
  lineHeight: 1.7, padding: '0.4rem 0', resize: 'none',
  outline: 'none', caretColor: 'var(--gold)',
};
