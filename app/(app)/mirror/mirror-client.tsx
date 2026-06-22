'use client';

import { useState, useRef, useEffect } from 'react';
import { DecisionJournal } from './decision-journal';
import { useViewAs } from '@/components/shared/view-as-context';
import type { MirrorAnswers, MirrorAnalysis } from '@/lib/anthropic/prompts/mirror';

// ─── Question definitions ──────────────────────────────────────

type QType = 'text' | 'slider';

interface MirrorQuestion {
  id: keyof MirrorAnswers;
  type: QType;
  label: string;
  text: string;
  placeholder?: string;
  poleLeft?: string;
  poleRight?: string;
  maxChars?: number;
  subtext?: string;
}

const MIRROR_QUESTIONS: MirrorQuestion[] = [
  {
    id: 'decisione',
    type: 'text',
    label: 'La Decisione',
    text: 'Descrivi la decisione in una frase sola.',
    placeholder: 'Es. Devo decidere se chiudere questa partnership',
    maxChars: 300,
  },
  {
    id: 'body_score',
    type: 'slider',
    label: 'Il Corpo',
    text: 'Quando pensi a questa decisione, cosa senti fisicamente?',
    poleLeft: '1 — contrazione, chiusura',
    poleRight: '10 — apertura, espansione',
  },
  {
    id: 'fear_under',
    type: 'text',
    label: 'La Paura Sotto',
    text: 'Se non prendi questa decisione, cosa temi che succeda?',
    placeholder: 'La prima cosa che ti viene, senza filtrare...',
    maxChars: 400,
  },
  {
    id: 'hidden_cost',
    type: 'text',
    label: 'Il Costo Nascosto',
    text: 'Se prendi questa decisione, cosa potresti perdere?',
    placeholder: 'Anche se sembra ilogico, scrivi quello che senti...',
    maxChars: 400,
  },
  {
    id: 'evolved_self',
    type: 'text',
    label: 'La Versione Evoluta',
    text: 'La versione più evoluta di te — quella emersa dal tuo scan — cosa farebbe?',
    placeholder: 'Non quello che vorresti fare — quello che la versione più consapevole di te farebbe...',
    maxChars: 400,
  },
  {
    id: 'clarity_score',
    type: 'slider',
    label: 'La Chiarezza',
    text: 'Adesso, dopo aver risposto, la decisione viene da...',
    poleLeft: '1 — paura totale',
    poleRight: '10 — visione totale',
    subtext: 'delta',
  },
];

// ─── Component ────────────────────────────────────────────────

type Step = 'q' | 'loading' | 'result';

export default function MirrorClient({
  seed,
  openDecisionsCount = 0,
}: {
  seed?: string;
  openDecisionsCount?: number;
}) {
  const [step, setStep] = useState<Step>('q');
  const [currentQ, setCurrentQ] = useState(0);
  // seed: ingresso a basso attrito da un segnale — precompila la decisione
  const [answers, setAnswers] = useState<Partial<MirrorAnswers>>({
    body_score: 5,
    clarity_score: 5,
    ...(seed ? { decisione: seed } : {}),
  });
  const [analysis, setAnalysis] = useState<MirrorAnalysis | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('');
  const [outcomeSaved, setOutcomeSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { isImpersonating, viewProfile } = useViewAs();

  const totalQ = MIRROR_QUESTIONS.length;
  const currentQuestion = MIRROR_QUESTIONS[currentQ];
  const progress = (currentQ + 1) / totalQ * 100;

  // body_score at Q1 (index 1), clarity_score at Q5 (index 5)
  const bodyScore = Number(answers.body_score ?? 5);
  const clarityScore = Number(answers.clarity_score ?? 5);
  const delta = clarityScore - bodyScore;

  useEffect(() => {
    if (step === 'q' && currentQuestion?.type === 'text') {
      setTimeout(() => textRef.current?.focus(), 420);
    }
  }, [step, currentQ, currentQuestion?.type]);

  async function transition(fn: () => void) {
    setVisible(false);
    await delay(380);
    fn();
    setVisible(true);
  }

  function handleSliderChange(val: number) {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  }

  function handleTextChange(val: string) {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  }

  function canAdvance() {
    const val = answers[currentQuestion.id];
    if (currentQuestion.type === 'slider') return true;
    return typeof val === 'string' && val.trim().length > 0;
  }

  async function advance() {
    if (!canAdvance()) return;
    if (currentQ < totalQ - 1) {
      transition(() => setCurrentQ(q => q + 1));
    } else {
      await submit();
    }
  }

  // Torna alla domanda precedente — le risposte restano in `answers`,
  // quindi la domanda precedente si ripresenta già compilata.
  function goBack() {
    if (currentQ === 0) return;
    setError(null);
    transition(() => setCurrentQ(q => q - 1));
  }

  async function submit() {
    setStep('loading');
    setError(null);

    try {
      const res = await fetch('/api/ai/mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await res.json() as { analysis?: MirrorAnalysis; decisionId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore Mirror');
      setAnalysis(data.analysis ?? null);
      setDecisionId(data.decisionId ?? null);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setStep('q');
      setCurrentQ(totalQ - 1);
      setVisible(true);
    }
  }

  async function saveOutcome() {
    if (!decisionId || !outcome.trim()) return;
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('decisions')
      .update({ outcome: outcome.trim(), outcome_date: new Date().toISOString().split('T')[0] })
      .eq('id', decisionId);
    setOutcomeSaved(true);
  }

  function reset() {
    setStep('q');
    setCurrentQ(0);
    setAnswers({ body_score: 5, clarity_score: 5 });
    setAnalysis(null);
    setDecisionId(null);
    setOutcome('');
    setOutcomeSaved(false);
    setError(null);
    setVisible(true);
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>MIRROR DECISIONALE</p>
        <h1 style={pageTitle}>Specchio delle tue decisioni</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', lineHeight: 1.7 }}>
          Il Mirror non consiglia. Riflette chi stai essendo mentre decidi.
        </p>
      </div>

      {/* Modalità "Entra come utente": niente nuova sessione Mirror */}
      {isImpersonating && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderLeft: '2px solid var(--gold)', borderRadius: '3px',
          padding: '1rem 1.5rem', marginBottom: '2.5rem', maxWidth: '580px',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Stai visualizzando come <strong style={{ color: 'var(--gold)' }}>{viewProfile?.full_name ?? viewProfile?.email ?? 'utente'}</strong> — sola lettura. Il Mirror non è disponibile in questa modalità.
          </p>
        </div>
      )}

      {/* Nudge esiti: le decisioni senza esito sono intenzioni, non evidenza */}
      {!isImpersonating && openDecisionsCount > 0 && step === 'q' && currentQ === 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderLeft: '2px solid var(--credenze)', borderRadius: '3px',
          padding: '1rem 1.5rem', marginBottom: '2.5rem', maxWidth: '580px',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {openDecisionsCount === 1
              ? 'Hai una decisione aperta da più di 30 giorni senza esito.'
              : `Hai ${openDecisionsCount} decisioni aperte da più di 30 giorni senza esito.`}
            {' '}L&apos;esito è ciò che trasforma un&apos;intenzione in evidenza — lo trovi nel diario qui sotto.
          </p>
        </div>
      )}

      {/* Question flow */}
      {!isImpersonating && (step === 'q' || step === 'loading') && (
        <div style={{ maxWidth: '580px' }}>
          {step === 'q' && (
            <>
              {/* Progress */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ height: '1px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--credenze)',
                    width: `${progress}%`,
                    transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--credenze)' }}>
                    {currentQuestion.label}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    {currentQ + 1}/{totalQ}
                  </span>
                </div>
              </div>

              {/* Animated area */}
              <div style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-8px)',
                transition: 'opacity 0.38s ease, transform 0.38s ease',
              }}>
                {currentQ > 0 && (
                  <button onClick={goBack} style={backBtn}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    ← Indietro
                  </button>
                )}
                <h2 style={{ ...questionText, marginBottom: currentQuestion.type === 'slider' ? '2.5rem' : '2rem' }}>
                  {currentQuestion.text}
                </h2>

                {/* TEXT */}
                {currentQuestion.type === 'text' && (
                  <div>
                    <textarea
                      ref={textRef}
                      value={(answers[currentQuestion.id] as string) ?? ''}
                      onChange={e => handleTextChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) advance(); }}
                      rows={4}
                      maxLength={currentQuestion.maxChars}
                      placeholder={currentQuestion.placeholder}
                      style={textareaStyle}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {((answers[currentQuestion.id] as string) ?? '').length}/{currentQuestion.maxChars}
                      </span>
                      <button
                        onClick={advance}
                        disabled={!canAdvance()}
                        style={{
                          ...primaryBtn,
                          opacity: canAdvance() ? 1 : 0.35,
                          cursor: canAdvance() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {currentQ === totalQ - 1 ? 'Vedi il Mirror' : 'Continua →'}
                      </button>
                    </div>
                    {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</p>}
                  </div>
                )}

                {/* SLIDER */}
                {currentQuestion.type === 'slider' && (
                  <div>
                    <div style={{
                      fontSize: '4rem', fontFamily: 'Georgia, serif',
                      color: 'var(--gold)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1,
                    }}>
                      {answers[currentQuestion.id] ?? 5}
                    </div>

                    {/* Delta indicator for clarity_score */}
                    {currentQuestion.subtext === 'delta' && (
                      <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '1.4rem' }}>
                        {delta !== 0 && (
                          <span style={{
                            fontSize: '0.78rem', letterSpacing: '0.08em',
                            color: delta > 0 ? 'var(--gold)' : 'var(--text-muted)',
                          }}>
                            {delta > 0 ? `+${delta} rispetto all'inizio ↑` : `${delta} rispetto all'inizio`}
                          </span>
                        )}
                      </div>
                    )}

                    <input
                      type="range" min={1} max={10}
                      value={Number(answers[currentQuestion.id] ?? 5)}
                      onChange={e => handleSliderChange(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentQuestion.poleLeft}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentQuestion.poleRight}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button onClick={advance} style={primaryBtn}>
                        {currentQ === totalQ - 1 ? 'Vedi il Mirror' : 'Continua →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
                Il Mirror sta riflettendo...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {!isImpersonating && step === 'result' && analysis && (
        <div style={{ maxWidth: '600px' }}>
          {/* Paura / Visione split */}
          <div className="mirror-fear-card" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '3px', padding: '1.75rem 2rem', marginBottom: '1.25rem',
          }}>
            <PieIndicator fearPct={analysis.paura_percent} />
            <div style={{ flex: 1 }}>
              <div className="mirror-fear-stats">
                <div>
                  <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B45454', marginBottom: '0.2rem' }}>Paura</p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#B45454', lineHeight: 1 }}>{analysis.paura_percent}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--pattern)', marginBottom: '0.2rem' }}>Visione</p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: 'var(--pattern)', lineHeight: 1 }}>{analysis.visione_percent}%</p>
                </div>
                {delta > 0 && (
                  <div>
                    <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.2rem' }}>Delta</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: 'var(--gold)', lineHeight: 1 }}>+{delta} ↑</p>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {analysis.da_dove}
              </p>
            </div>
          </div>

          {/* Versione evoluta */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderLeft: '2px solid var(--identita)',
            borderRadius: '3px', padding: '1.75rem 2rem', marginBottom: '1.25rem',
          }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--identita)', marginBottom: '0.75rem' }}>
              La versione evoluta
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.85, color: 'var(--text-primary)', fontStyle: 'italic' }}>
              {analysis.versione_evoluta}
            </p>
          </div>

          {/* Domanda finale */}
          <div style={{
            padding: '1.75rem 2rem', border: '1px solid var(--border)',
            borderRadius: '3px', marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--credenze)', marginBottom: '0.75rem' }}>
              La domanda che non ti sei fatto
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-primary)', fontStyle: 'italic' }}>
              {analysis.domanda_finale}
            </p>
          </div>

          {/* Outcome */}
          {!outcomeSaved ? (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                (Opzionale) Registra l&apos;esito di questa decisione
              </p>
              <textarea
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                rows={2}
                placeholder="Cosa hai deciso? Come è andata?"
                style={{ ...textareaStyle, fontSize: '0.875rem' }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
              />
              {outcome.trim() && (
                <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                  <button onClick={saveOutcome} style={primaryBtn}>Salva esito</button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--pattern)', marginBottom: '2rem' }}>Esito registrato ✓</p>
          )}

          <button onClick={reset} style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontFamily: 'Georgia, serif',
            fontSize: '0.85rem', cursor: 'pointer', padding: 0, letterSpacing: '0.05em',
          }}>
            ← Nuova decisione
          </button>
        </div>
      )}

      {/* Decision Journal */}
      <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ ...mutedLabel, marginBottom: '0.5rem' }}>Archivio decisioni</p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '2rem' }}>
          Le tue decisioni passate
        </h2>
        <DecisionJournal readOnly={isImpersonating} />
      </div>
    </div>
  );
}

// ─── Pie indicator (CSS only) ─────────────────────────────────

function PieIndicator({ fearPct }: { fearPct: number }) {
  const visione = 100 - fearPct;
  const fearAngle = (fearPct / 100) * 360;
  return (
    <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
      <svg viewBox="0 0 36 36" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#B4545420" strokeWidth="3.2" />
        {/* Visione arc */}
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="var(--pattern)" strokeWidth="3.2"
          strokeDasharray={`${visione} ${fearPct}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Paura arc */}
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="#B45454" strokeWidth="3.2"
          strokeDasharray={`${fearPct} ${visione}`}
          strokeDashoffset={`${-visione}`}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* Unused gap */}
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--background)" strokeWidth="0.5" />
      </svg>
      {/* Center angle indicator */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '4px', height: '4px', borderRadius: '50%',
          background: fearAngle > 180 ? '#B45454' : 'var(--pattern)',
        }} />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.2em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '2rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '0.75rem',
};

const questionText: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.3rem',
  fontWeight: 'normal', color: 'var(--text-primary)', lineHeight: 1.5,
};

const textareaStyle: React.CSSProperties = {
  width: '100%', background: 'transparent',
  border: 'none', borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)', fontFamily: 'Georgia, serif',
  fontSize: '1rem', lineHeight: 1.7, padding: '0.5rem 0',
  resize: 'none', outline: 'none',
  transition: 'border-color 0.4s ease', caretColor: 'var(--gold)',
};

const primaryBtn: React.CSSProperties = {
  padding: '0.625rem 1.5rem', background: 'transparent',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', letterSpacing: '0.05em',
  cursor: 'pointer', transition: 'all 0.35s ease',
};

const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0,
  color: 'var(--text-muted)', fontFamily: 'Georgia, serif',
  fontSize: '0.72rem', letterSpacing: '0.08em', cursor: 'pointer',
  marginBottom: '1.25rem', transition: 'color 0.3s ease',
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
