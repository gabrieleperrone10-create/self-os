'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recentPeriods, formatPeriodLabel, type Period } from '@/lib/stats/period';
import { QuickEntry } from '../quick-entry';

// Registrazione del periodo corrente + griglia retroattiva (piano §3.2): le
// stime a memoria sono marcate `estimated` dalla route stessa (periodStart
// diverso da oggi) e usate solo per la tendenza, mai enfatizzate come dato certo.
export function QuickEntryPanel({
  statId,
  unit,
  period,
  currentValue,
  loggedPeriods,
}: {
  statId: string;
  unit: string | null;
  period: Period;
  currentValue: number | null;
  loggedPeriods: Set<string>;
}) {
  const router = useRouter();
  const [showRetro, setShowRetro] = useState(false);

  const periods = recentPeriods(period, 8).slice(0, -1); // esclude oggi, già coperto sopra

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.25rem 1.5rem' }}>
      <p style={label}>Registra il periodo corrente</p>
      <div style={{ marginTop: '0.6rem' }}>
        <QuickEntry statId={statId} unit={unit} initialValue={currentValue} />
      </div>

      <button onClick={() => setShowRetro((v) => !v)} style={toggleBtn}>
        {showRetro ? '− nascondi periodi passati' : '+ inserisci periodi passati (a memoria)'}
      </button>

      {showRetro && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {periods.map((p) => (
            <RetroRow key={p} statId={statId} unit={unit} periodStart={p} period={period} already={loggedPeriods.has(p)} onSaved={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}

function RetroRow({
  statId, unit, periodStart, period, already, onSaved,
}: {
  statId: string; unit: string | null; periodStart: string; period: Period; already: boolean; onSaved: () => void;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = Number(value.replace(',', '.'));
    if (!Number.isFinite(n)) return;
    setSaving(true);
    try {
      await fetch(`/api/stats/${statId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: n, periodStart }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: '110px', flexShrink: 0 }}>
        {formatPeriodLabel(period, periodStart)}
      </span>
      <input
        type="text" inputMode="decimal" value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={already ? 'già registrato' : '0'}
        style={{
          width: '64px', background: 'var(--background)', border: '1px solid var(--border)',
          borderRadius: '3px', padding: '0.35rem 0.5rem', color: 'var(--text-primary)',
          fontFamily: 'Georgia, serif', fontSize: '0.8rem',
        }}
      />
      {unit && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>}
      <button onClick={save} disabled={saving || !value} style={{ fontSize: '0.72rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>
        {saving ? '...' : 'salva'}
      </button>
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const toggleBtn: React.CSSProperties = {
  display: 'block', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', padding: 0,
};
