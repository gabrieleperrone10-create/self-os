'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Pattern, ExperimentGeneration } from '@/types';

type Step = 'source' | 'input' | 'generating' | 'review' | 'creating';

export default function LabNewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]           = useState<Step>('source');
  const [sourceType, setSourceType] = useState<'pattern' | 'freeform' | null>(null);
  const [patterns, setPatterns]   = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [freeformText, setFreeformText] = useState('');
  const [generation, setGeneration] = useState<ExperimentGeneration | null>(null);
  const [patternId, setPatternId] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    supabase.from('patterns').select('*').eq('is_active', true).order('frequency', { ascending: false })
      .then(({ data }) => setPatterns((data ?? []) as Pattern[]));
  }, [supabase]);

  async function generate() {
    setError(null);
    setStep('generating');
    try {
      const res = await fetch('/api/ai/generate-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: sourceType,
          patternId: selectedPattern?.id ?? null,
          userDescription: freeformText.trim() || null,
        }),
      });
      const data = await res.json() as { generation?: ExperimentGeneration; error?: string; patternId?: string };
      if (!res.ok || !data.generation) throw new Error(data.error ?? 'Generazione fallita');
      setGeneration(data.generation);
      setPatternId(data.patternId ?? null);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setStep('input');
    }
  }

  async function confirm() {
    if (!generation) return;
    setStep('creating');
    setError(null);
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation, patternId }),
      });
      const data = await res.json() as { experiment?: { id: string }; error?: string };
      if (!res.ok || !data.experiment) throw new Error(data.error ?? 'Creazione fallita');
      router.push(`/lab/${data.experiment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setStep('review');
    }
  }

  // ── Step: Source ───────────────────────────────────────────────
  if (step === 'source') return (
    <div style={container}>
      <p style={mutedLabel}>Lab — Nuovo esperimento</p>
      <h1 style={title}>Da dove partiamo?</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem', maxWidth: '480px' }}>
        <button
          onClick={() => { setSourceType('pattern'); setStep('input'); }}
          style={sourceCard}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Da un pattern identificato
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Scegli uno dei pattern che il sistema ha già mappato nel tuo profilo.
          </p>
        </button>

        <button
          onClick={() => { setSourceType('freeform'); setStep('input'); }}
          style={sourceCard}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Descrivo un comportamento
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Descrivi liberamente un comportamento che vuoi trasformare.
            Lab mapperà il loop e progetterà l&apos;esperimento.
          </p>
        </button>
      </div>
    </div>
  );

  // ── Step: Input ────────────────────────────────────────────────
  if (step === 'input') return (
    <div style={container}>
      <button onClick={() => setStep('source')} style={back}>← Indietro</button>

      {sourceType === 'pattern' ? (
        <>
          <p style={mutedLabel}>Seleziona il pattern</p>
          <h1 style={title}>Su cosa vuoi lavorare?</h1>

          {patterns.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2rem' }}>
              Nessun pattern identificato ancora. Fai qualche check-in per far emergere i pattern,
              oppure usa &ldquo;Descrivo un comportamento&rdquo;.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem', maxWidth: '480px' }}>
              {patterns.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPattern(p)}
                  style={{
                    ...sourceCard,
                    borderColor: selectedPattern?.id === p.id ? 'var(--gold)' : 'var(--border)',
                    background: selectedPattern?.id === p.id ? 'color-mix(in srgb, var(--gold) 6%, transparent)' : 'var(--surface)',
                    textAlign: 'left' as const,
                  }}
                >
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    {p.type}
                  </p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {p.title}
                  </p>
                  {p.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedPattern && (
            <button onClick={generate} style={{ ...primaryBtn, marginTop: '2rem' }}>
              Genera esperimento →
            </button>
          )}
        </>
      ) : (
        <>
          <p style={mutedLabel}>Descrivi il comportamento</p>
          <h1 style={title}>Cosa vuoi trasformare?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '480px' }}>
            Descrivi il comportamento che si ripete e che vorresti fare diversamente.
            Più sei specifico, più l&apos;esperimento sarà chirurgico.
          </p>

          <textarea
            value={freeformText}
            onChange={e => setFreeformText(e.target.value)}
            rows={6}
            maxLength={600}
            placeholder="Es. Quando ho un progetto aperto e non mi sento ispirato, tendo ad aprirne uno nuovo invece di continuare. Succede quasi ogni settimana, spesso di lunedì o martedì mattina..."
            style={textareaStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{freeformText.length}/600</span>
            <button
              onClick={generate}
              disabled={freeformText.trim().length < 30}
              style={{ ...primaryBtn, opacity: freeformText.trim().length < 30 ? 0.35 : 1 }}
            >
              Mappa il loop →
            </button>
          </div>
          {error && <p style={errorText}>{error}</p>}
        </>
      )}
    </div>
  );

  // ── Step: Generating ───────────────────────────────────────────
  if (step === 'generating') return (
    <div style={container}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
        Lab sta mappando il tuo loop...
      </p>
    </div>
  );

  // ── Step: Review ───────────────────────────────────────────────
  if (step === 'review' && generation) {
    const { loop_map, intervention, meta } = generation;
    return (
      <div style={container}>
        <p style={mutedLabel}>Lab — Rivedi prima di iniziare</p>
        <h1 style={{ ...title, marginBottom: '2.5rem' }}>{meta.pattern_title}</h1>

        {/* Loop map */}
        <div style={section}>
          <p style={sectionLabel}>Come funziona adesso</p>

          <LoopRow label="Trigger" value={loop_map.triggers.join(' / ')} />
          <LoopRow label="Emozione / Sensazione" value={loop_map.emotion_sensation} />
          <LoopRow label="Azione automatica" value={loop_map.automatic_action} />
          <LoopRow label="Conferma identità" value={loop_map.identity_confirmation} />
        </div>

        {/* Intervention */}
        <div style={{ ...section, borderLeftColor: 'var(--pattern)' }}>
          <p style={{ ...sectionLabel, color: 'var(--pattern)' }}>L&apos;esperimento — {meta.duration_days} giorni</p>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={rowLabel}>Scarico corporeo — {intervention.body_discharge.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {intervention.body_discharge.duration}
            </p>
            <p style={rowValue}>{intervention.body_discharge.instruction}</p>
          </div>

          <div>
            <p style={rowLabel}>Azione diversa</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {intervention.different_action.when}
            </p>
            <p style={rowValue}>{intervention.different_action.instruction}</p>
          </div>
        </div>

        {/* Rationale */}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '520px' }}>
          {meta.ai_rationale}
        </p>

        {error && <p style={errorText}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setStep('input')} style={outlineBtn}>← Modifica</button>
          <button onClick={confirm} style={primaryBtn}>
            Inizia l&apos;esperimento →
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Creating ─────────────────────────────────────────────
  return (
    <div style={container}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
        Apertura esperimento...
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function LoopRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={rowLabel}>{label}</p>
      <p style={rowValue}>{value}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const container: React.CSSProperties = { maxWidth: '580px', paddingTop: '1rem' };

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem',
};

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.75rem',
  fontWeight: 'normal', color: 'var(--text-primary)', lineHeight: 1.3,
};

const section: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderLeft: '2px solid var(--gold)', borderRadius: '3px',
  padding: '1.5rem 1.75rem', marginBottom: '1.5rem',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem',
};

const rowLabel: React.CSSProperties = {
  fontSize: '0.68rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem',
};

const rowValue: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '0.95rem',
  color: 'var(--text-primary)', lineHeight: 1.65,
};

const sourceCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.25rem 1.5rem',
  cursor: 'pointer', textAlign: 'left', width: '100%',
  transition: 'border-color 0.3s ease',
};

const textareaStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif', fontSize: '0.95rem', lineHeight: 1.75,
  padding: '0.5rem 0', resize: 'none', outline: 'none',
  caretColor: 'var(--gold)',
};

const primaryBtn: React.CSSProperties = {
  padding: '0.625rem 1.5rem', background: 'transparent',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', letterSpacing: '0.05em',
  cursor: 'pointer', transition: 'all 0.35s ease',
};

const outlineBtn: React.CSSProperties = {
  ...primaryBtn, borderColor: 'var(--border)', color: 'var(--text-muted)',
};

const back: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-muted)',
  fontFamily: 'Georgia, serif', fontSize: '0.82rem', cursor: 'pointer',
  padding: 0, marginBottom: '2rem', display: 'block',
};

const errorText: React.CSSProperties = {
  color: '#B45454', fontSize: '0.82rem', marginTop: '0.75rem',
};
