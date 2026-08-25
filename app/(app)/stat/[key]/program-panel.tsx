'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StatProgram } from '@/lib/anthropic/schemas';

// Il programma del periodo scritto sui dati veri (F3). La formula la sceglie il
// motore; qui si mostra solo il testo istanziato. Se non c'è, la scheda §5.1
// sopra continua a mostrare i passi generici: questo è un sovrappiù, mai
// l'unica fonte.
export function ProgramPanel({
  statKey,
  existing,
  periodLabel,
}: {
  statKey: string;
  existing: StatProgram | null;
  periodLabel: string;
}) {
  const router = useRouter();
  const [program, setProgram] = useState<StatProgram | null>(existing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/stat-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: statKey }),
      });
      const data = await res.json() as { program?: { program: StatProgram }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Generazione fallita');
      setProgram(data.program?.program ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }

  if (!program) {
    return (
      <div style={card}>
        <p style={sectionLabel}>Programma del periodo</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0.6rem 0 1rem' }}>
          I passi della formula riscritti sui tuoi numeri di {periodLabel}, invece che in generale.
        </p>
        <button onClick={generate} disabled={loading} style={goldBtn}>
          {loading ? 'Scrittura...' : 'Scrivi il programma →'}
        </button>
        {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.75rem', lineHeight: 1.6 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ ...card, borderLeft: '2px solid var(--gold)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <p style={sectionLabel}>Programma — {periodLabel}</p>
        <button onClick={generate} disabled={loading} style={regenBtn}>
          {loading ? '...' : 'riscrivi'}
        </button>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: '0.75rem 0 1rem', fontFamily: 'Georgia, serif' }}>
        {program.lettura}
      </p>

      <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {program.passi.map((p, i) => (
          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{p}</li>
        ))}
      </ol>

      {program.nota && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.9rem', fontStyle: 'italic', lineHeight: 1.6 }}>
          {program.nota}
        </p>
      )}

      {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.25rem 1.5rem',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const goldBtn: React.CSSProperties = {
  padding: '0.55rem 1.1rem', border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', background: 'none', fontFamily: 'Georgia, serif',
  fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.03em',
};

const regenBtn: React.CSSProperties = {
  fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none',
  border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', flexShrink: 0,
};
