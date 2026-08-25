'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AREAS, STAT_PRESETS, type Area, type StatPreset } from '@/lib/stats/catalog';
import type { StatAggregation, StatDefinition, StatDirection, StatMode, StatPeriod, StatRole } from '@/types';

type FormState = {
  label: string;
  area: Area;
  unit: string;
  definition: string;
  direction: StatDirection;
  mode: StatMode;
  period: StatPeriod;
  target: string;
  parentId: string;
  role: StatRole;
  aggregation: StatAggregation;
};

const EMPTY: FormState = {
  label: '', area: 'corpo', unit: '', definition: '',
  direction: 'up', mode: 'grow', period: 'week', target: '',
  parentId: '', role: 'quantity', aggregation: 'sum',
};

const ROLE_HINT: Record<StatRole, string> = {
  quantity: 'Quanto lavoro hai fatto. È il primo livello: su lavoro non fatto non si giudica il metodo.',
  quality: 'Come lo fai — progressione, intensità, tecnica. Distingue l’attività dal risultato.',
  support: 'La condizione che abilita il resto: nutrizione, sonno, recupero.',
};

export default function NewStatPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<StatDefinition[]>([]);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d: { definitions?: StatDefinition[] }) => {
        // Solo le stat che non sono già figlie: la gerarchia è a un livello solo.
        setCandidates((d.definitions ?? []).filter((s) => s.parent_id === null && s.active));
      })
      .catch(() => {});
  }, []);

  function applyPreset(p: StatPreset) {
    // Il collegamento a un risultato non fa parte del preset: si sceglie dopo.
    setForm({
      ...EMPTY,
      label: p.label, area: p.area, unit: p.unit ?? '',
      direction: p.direction, mode: p.mode, period: p.period,
      aggregation: p.direction === 'down' ? 'last' : 'sum',
      parentId: form.parentId, role: form.role,
    });
  }

  async function submit() {
    if (!form.label.trim()) { setError('Dai un nome alla stat'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label.trim(),
          area: form.area,
          unit: form.unit.trim() || null,
          definition: form.definition.trim() || null,
          direction: form.direction,
          mode: form.mode,
          period: form.period,
          target: form.mode === 'maintain' && form.target.trim() !== '' ? Number(form.target) : null,
          parentId: form.parentId || null,
          role: form.parentId ? form.role : null,
          aggregation: form.aggregation,
        }),
      });
      const data = await res.json() as { definition?: { key: string }; error?: string };
      if (!res.ok || !data.definition) throw new Error(data.error ?? 'Creazione fallita');
      router.push(`/stat/${data.definition.key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <Link href="/stat" style={backLink}>← Stat</Link>
      <p style={mutedLabel}>Nuova stat</p>
      <h1 style={title}>Cosa vuoi misurare?</h1>

      <p style={{ ...mutedLabel, marginTop: '2rem', marginBottom: '0.75rem' }}>Parti da un suggerimento</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '2rem' }}>
        {STAT_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p)}
            style={{
              ...presetBtn,
              borderColor: form.label === p.label ? 'var(--gold)' : 'var(--border)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p style={{ ...mutedLabel, marginBottom: '0.75rem' }}>Oppure scrivila tu</p>

      <label style={fieldLabel}>Nome</label>
      <input
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        maxLength={80}
        style={input}
      />

      <label style={fieldLabel}>Area</label>
      <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as Area })} style={input}>
        {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Unità (opzionale)</label>
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, €, ore..." style={input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Periodo</label>
          <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as StatPeriod })} style={input}>
            <option value="week">Settimana</option>
            <option value="day">Giorno</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Direzione</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as StatDirection })} style={input}>
            <option value="up">Salire è meglio</option>
            <option value="down">Scendere è meglio</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Tipo</label>
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as StatMode })} style={input}>
            <option value="grow">Deve crescere</option>
            <option value="maintain">Basta mantenerla</option>
          </select>
        </div>
      </div>

      {form.mode === 'maintain' && (
        <>
          <label style={fieldLabel}>Livello da mantenere</label>
          <input
            type="text" inputMode="decimal"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder="es. 3"
            style={input}
          />
        </>
      )}

      {candidates.length > 0 && (
        <>
          <label style={fieldLabel}>Fa parte di un risultato?</label>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
            Collegala a un risultato per capire, quando quello non si muove, quale livello
            sta cedendo — invece di dover indovinare.
          </p>
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            style={input}
          >
            <option value="">No, è una stat a sé</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {form.parentId && (
            <>
              <label style={fieldLabel}>Che livello presidia</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StatRole })}
                style={input}
              >
                <option value="quantity">Quantità — l&apos;hai fatto?</option>
                <option value="quality">Metodo — come l&apos;hai fatto?</option>
                <option value="support">Condizione abilitante</option>
              </select>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '0.4rem' }}>
                {ROLE_HINT[form.role]}
              </p>

              <label style={fieldLabel}>Come si aggrega sul periodo del risultato</label>
              <select
                value={form.aggregation}
                onChange={(e) => setForm({ ...form, aggregation: e.target.value as StatAggregation })}
                style={input}
              >
                <option value="sum">Si somma (allenamenti, unità, euro)</option>
                <option value="mean">Si media (peso, percentuali, carichi)</option>
                <option value="last">Ultimo valore (una misura, non un totale)</option>
              </select>
            </>
          )}
        </>
      )}

      <label style={fieldLabel}>Cosa conta, di preciso</label>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        La difesa contro il gonfiare il numero: scrivi la definizione operativa,
        non un&apos;intenzione.
      </p>
      <textarea
        value={form.definition}
        onChange={(e) => setForm({ ...form, definition: e.target.value })}
        rows={3}
        maxLength={300}
        style={{ ...input, resize: 'vertical' as const }}
      />

      {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</p>}

      <button onClick={submit} disabled={saving} style={{ ...primaryBtn, marginTop: '1.5rem', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Creazione...' : 'Crea stat →'}
      </button>
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.6rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.5rem',
};

const backLink: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.82rem', color: 'var(--text-muted)',
  textDecoration: 'none', marginBottom: '1.5rem',
};

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  marginTop: '1.25rem', marginBottom: '0.4rem',
};

const input: React.CSSProperties = {
  width: '100%', background: 'var(--background)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif', fontSize: '0.88rem',
};

const presetBtn: React.CSSProperties = {
  textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)',
  fontFamily: 'Georgia, serif', fontSize: '0.82rem', cursor: 'pointer',
  transition: 'border-color 0.3s ease',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.7rem 1.5rem',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.9rem', cursor: 'pointer', background: 'none', letterSpacing: '0.05em',
};
