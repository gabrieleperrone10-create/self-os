'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StatDefinition } from '@/types';

// Modifica ed eliminazione — mancavano del tutto in F2 (le route PATCH/DELETE
// esistevano, nessuna UI le chiamava). Eliminazione a doppio passaggio invece di
// window.confirm: più chiaro, e non blocca l'automazione browser durante i test.
export function SettingsPanel({ definition }: { definition: StatDefinition }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(definition.label);
  const [unit, setUnit] = useState(definition.unit ?? '');
  const [def, setDef] = useState(definition.definition ?? '');
  const [target, setTarget] = useState(definition.target !== null ? String(definition.target) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats/${definition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Aggiornamento fallito');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    await patch({
      label: label.trim(),
      unit: unit.trim() || null,
      definition: def.trim() || null,
      target: definition.mode === 'maintain' && target.trim() !== '' ? Number(target) : null,
    });
  }

  async function toggleActive() {
    await patch({ active: !definition.active });
  }

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats/${definition.id}`, { method: 'DELETE' });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Eliminazione fallita');
      router.push('/stat');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={toggleBtn}>
        Impostazioni della stat
      </button>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={sectionLabel}>Impostazioni</p>
        <button onClick={() => setOpen(false)} style={closeBtn}>chiudi</button>
      </div>

      <label style={fieldLabel}>Nome</label>
      <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} style={input} />

      <label style={fieldLabel}>Unità</label>
      <input value={unit} onChange={(e) => setUnit(e.target.value)} style={input} />

      {definition.mode === 'maintain' && (
        <>
          <label style={fieldLabel}>Livello da mantenere</label>
          <input type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} style={input} />
        </>
      )}

      <label style={fieldLabel}>Cosa conta, di preciso</label>
      <textarea value={def} onChange={(e) => setDef(e.target.value)} rows={2} maxLength={300} style={{ ...input, resize: 'vertical' as const }} />

      {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' as const }}>
        <button onClick={save} disabled={saving} style={primaryBtn}>Salva modifiche</button>
        <button onClick={toggleActive} disabled={saving} style={secondaryBtn}>
          {definition.active ? 'Metti in pausa' : 'Riattiva'}
        </button>
        {!confirmingDelete ? (
          <button onClick={() => setConfirmingDelete(true)} disabled={saving} style={dangerBtn}>
            Elimina
          </button>
        ) : (
          <>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              Elimina anche tutto lo storico registrato. Sicuro?
            </span>
            <button onClick={remove} disabled={saving} style={dangerBtn}>Sì, elimina</button>
            <button onClick={() => setConfirmingDelete(false)} disabled={saving} style={secondaryBtn}>Annulla</button>
          </>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.25rem 1.5rem', marginTop: '2rem',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.68rem', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  marginTop: '1rem', marginBottom: '0.35rem',
};

const input: React.CSSProperties = {
  width: '100%', background: 'var(--background)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '0.55rem 0.7rem', color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif', fontSize: '0.85rem',
};

const toggleBtn: React.CSSProperties = {
  display: 'block', marginTop: '2rem', fontSize: '0.78rem', color: 'var(--text-muted)',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', padding: 0,
};

const closeBtn: React.CSSProperties = {
  fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  padding: '0.5rem 1rem', border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', background: 'none', fontFamily: 'Georgia, serif', fontSize: '0.82rem', cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '3px',
  color: 'var(--text-secondary)', background: 'none', fontFamily: 'Georgia, serif', fontSize: '0.82rem', cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  padding: '0.5rem 1rem', border: '1px solid #B45454', borderRadius: '3px',
  color: '#B45454', background: 'none', fontFamily: 'Georgia, serif', fontSize: '0.82rem', cursor: 'pointer',
};
