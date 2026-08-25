'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Inserimento a 1 tap (piano §3.2): un numero, invio, fatto. Prefillato con il
// valore già registrato per il periodo corrente, se esiste, così ri-registrare
// oggi è una correzione, non una doppia scrittura.
export function QuickEntry({
  statId,
  unit,
  initialValue,
  compact = false,
}: {
  statId: string;
  unit: string | null;
  initialValue: number | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue !== null ? String(initialValue) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    const n = Number(value.replace(',', '.'));
    if (value.trim() === '' || !Number.isFinite(n)) {
      setError('Valore non valido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats/${statId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: n }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Salvataggio fallito');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        placeholder="0"
        style={{
          width: compact ? '64px' : '80px',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          padding: '0.4rem 0.5rem',
          color: 'var(--text-primary)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.85rem',
        }}
      />
      {unit && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</span>}
      <button
        onClick={save}
        disabled={saving}
        style={{
          fontSize: '0.75rem',
          color: saved ? 'var(--pattern)' : 'var(--gold)',
          background: 'none',
          border: '1px solid ' + (saved ? 'var(--pattern)' : 'var(--gold)'),
          borderRadius: '3px',
          padding: '0.4rem 0.75rem',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.6 : 1,
          fontFamily: 'Georgia, serif',
        }}
      >
        {saved ? '✓' : 'Salva'}
      </button>
      {error && <span style={{ fontSize: '0.72rem', color: '#B45454' }}>{error}</span>}
    </div>
  );
}
