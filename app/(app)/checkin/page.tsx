'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCheckinType } from '@/lib/utils/checkin';
import type { CheckinType } from '@/types';

// ─── Question definitions ──────────────────────────────────────

type QType = 'slider' | 'choice' | 'text';

interface Question {
  id: string;
  type: QType;
  label: string;
  text: string;
  placeholder?: string;
  options?: string[];
  poleLeft?: string;
  poleRight?: string;
  maxChars?: number;
}

const MORNING_QUESTIONS: Question[] = [
  {
    id: 'stato',
    type: 'slider',
    label: 'Stato',
    text: 'Come stai adesso — non come vorresti stare.',
    poleLeft: '1 — paura, chiusura',
    poleRight: '10 — chiarezza, forza',
  },
  {
    id: 'corpo',
    type: 'choice',
    label: 'Corpo',
    text: 'Dove senti questo stato nel corpo?',
    options: [
      'Petto / cuore',
      'Stomaco / pancia',
      'Testa / mente',
      'Gola',
      'Non lo sento chiaramente',
    ],
  },
  {
    id: 'fonte',
    type: 'choice',
    label: 'Fonte',
    text: 'Da dove viene questo stato?',
    options: [
      'Da qualcosa che è successo',
      'Da qualcosa che sto aspettando',
      'Da qualcosa che sto evitando',
      'Non so da dove viene',
      'Viene da dentro, senza motivo esterno',
    ],
  },
  {
    id: 'intenzione',
    type: 'text',
    label: 'Intenzione',
    text: 'Chi vuoi essere oggi — non cosa vuoi fare.',
    placeholder: 'Es. Voglio essere la persona che agisce anche quando non si sente pronta',
    maxChars: 300,
  },
  {
    id: 'ostacolo',
    type: 'text',
    label: 'Ostacolo',
    text: 'Qual è la cosa che, se non la fai oggi, domani mattina ti peserà?',
    placeholder: 'Scrivi la prima cosa che ti viene...',
    maxChars: 300,
  },
];

const EVENING_QUESTIONS: Question[] = [
  {
    id: 'stato',
    type: 'slider',
    label: 'Stato',
    text: 'Come stai adesso — onestamente.',
    poleLeft: '1 — paura, chiusura',
    poleRight: '10 — chiarezza, forza',
  },
  {
    id: 'momento',
    type: 'text',
    label: 'Momento',
    text: 'Qual è stato il momento della giornata in cui eri più te stesso?',
    placeholder: 'Anche un momento piccolo conta...',
    maxChars: 300,
  },
  {
    id: 'pattern_recognition',
    type: 'choice',
    label: 'Pattern',
    text: "C'è stato un momento oggi in cui hai riconosciuto un tuo pattern?",
    options: [
      'Sì, l\'ho riconosciuto e ho scelto diversamente',
      'Sì, l\'ho riconosciuto ma ci sono caduto lo stesso',
      'No, non ho riconosciuto nessun pattern oggi',
      'L\'ho riconosciuto solo dopo — a posteriori',
    ],
  },
  {
    id: 'decision_origin',
    type: 'choice',
    label: 'Decisione',
    text: 'La decisione più importante di oggi veniva da...',
    options: [
      'Visione chiara di dove vado',
      'Paura di cosa succede se non agisco',
      'Aspettativa di qualcun altro',
      'Abitudine — l\'avrei fatto comunque',
      'Non ho preso decisioni importanti oggi',
    ],
  },
  {
    id: 'chiusura',
    type: 'text',
    label: 'Chiusura',
    text: 'Cosa non hai finito oggi — lo lasci qui per scelta o ci ricaschi domani senza averlo scelto?',
    placeholder: 'Distingui: ho scelto di lasciarlo aperto, oppure mi è scivolato via...',
    maxChars: 400,
  },
];

// ─── Component ────────────────────────────────────────────────

type Step = 'type-select' | 'q' | 'submitting' | 'insight' | 'lab';

export default function CheckinPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>('type-select');
  const [checkinType, setCheckinType] = useState<CheckinType>(getCheckinType());
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [activeExperiments, setActiveExperiments] = useState<Array<{ id: string; pattern_title: string; triggers: string[]; different_action: string; trackedToday: boolean }>>([]);
  const [labStep, setLabStep] = useState(0);

  const questions = checkinType === 'morning' ? MORNING_QUESTIONS : EVENING_QUESTIONS;
  const typeLabel = checkinType === 'morning' ? 'Mattina' : 'Sera';
  const typeColor = checkinType === 'morning' ? 'var(--stato)' : 'var(--identita)';
  const totalQ = questions.length;
  const progress = step === 'q' ? ((currentQ + 1) / totalQ) * 100 : step === 'insight' ? 100 : 0;

  const currentQuestion = questions[currentQ];
  const currentAnswer = answers[currentQuestion?.id ?? ''];

  // Check already done
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('checkins').select('id')
        .eq('user_id', user.id).eq('type', checkinType).eq('date', today).limit(1);
      if (data && data.length > 0) setAlreadyDone(true);
    }
    check();
  }, [checkinType, supabase]);

  // Auto-focus textarea only on desktop (on mobile keyboard hides the submit button)
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile && step === 'q' && currentQuestion?.type === 'text') {
      setTimeout(() => textRef.current?.focus(), 450);
    }
  }, [step, currentQ, currentQuestion?.type]);

  async function transition(fn: () => void, dir: 'in' | 'out' = 'in') {
    setVisible(false);
    setSlideDir('out');
    await delay(380);
    fn();
    setSlideDir(dir);
    setVisible(true);
  }

  function selectType(type: CheckinType) {
    setCheckinType(type);
    setAnswers({});
    setCurrentQ(0);
    transition(() => setStep('q'));
  }

  function handleSliderChange(val: number) {
    setAnswers(prev => ({ ...prev, stato: val }));
  }

  function handleChoiceSelect(option: string) {
    const id = currentQuestion.id;
    setAnswers(prev => ({ ...prev, [id]: option }));
    // Auto-advance after a short delay
    setTimeout(() => advance({ ...answers, [id]: option }), 260);
  }

  function handleTextConfirm() {
    const val = (currentAnswer as string)?.trim();
    if (!val) return;
    advance(answers);
  }

  function handleSliderConfirm() {
    const val = answers.stato ?? 5;
    advance({ ...answers, stato: val });
  }

  function advance(currentAnswers: Record<string, string | number>) {
    if (currentQ < totalQ - 1) {
      transition(() => {
        setAnswers(currentAnswers);
        setCurrentQ(q => q + 1);
      });
    } else {
      setAnswers(currentAnswers);
      submitCheckin(currentAnswers);
    }
  }

  async function submitCheckin(finalAnswers: Record<string, string | number>) {
    setStep('submitting');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const stateScore = Number(finalAnswers.stato ?? 5);
      // Remove stato from answers dict (stored separately as state_score)
      const { stato: _stato, ...rest } = finalAnswers;
      void _stato;

      const { data: checkin, error: insertError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          type: checkinType,
          state_score: stateScore,
          answers: rest,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const [insightRes, experimentsRes] = await Promise.all([
        fetch('/api/ai/daily-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkinId: checkin.id }),
        }),
        fetch('/api/experiments'),
      ]);

      const insightData = await insightRes.json() as { insight?: string };
      setInsight(insightData.insight ?? null);

      // Load active experiments for lab micro-tracking
      if (experimentsRes.ok) {
        const expData = await experimentsRes.json() as { experiments?: Array<{ id: string; pattern_title: string; triggers: string[]; different_action: string; status: string }> };
        const today = new Date().toISOString().split('T')[0];
        const active = (expData.experiments ?? []).filter(e => e.status === 'active');

        // Check which ones are already tracked today
        const tracked = await Promise.all(
          active.map(async e => {
            const r = await fetch(`/api/experiments/${e.id}/entries`);
            const d = await r.json() as { entries?: Array<{ date: string }> };
            const trackedToday = (d.entries ?? []).some(en => en.date === today);
            return { ...e, trackedToday };
          })
        );
        setActiveExperiments(tracked);
      }

      setStep('insight');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setStep('q');
      setVisible(true);
    }
  }

  // ─── Already done ────────────────────────────────────────────

  if (alreadyDone && step === 'type-select') {
    return (
      <div style={{ maxWidth: '540px' }}>
        <p style={label(typeColor)}>{typeLabel}</p>
        <h2 style={heading}>Check-in già completato oggi.</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Torna stasera{checkinType === 'morning' ? ' per il check-in serale' : ''}.
        </p>
        <button
          onClick={() => {
            setAlreadyDone(false);
            setCheckinType(checkinType === 'morning' ? 'evening' : 'morning');
          }}
          style={outlineBtn}
        >
          Fai il check-in {checkinType === 'morning' ? 'serale' : 'mattutino'} →
        </button>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '580px' }}>
      {/* Progress bar */}
      {step !== 'type-select' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ height: '1px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--gold)',
              width: `${progress}%`,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <p style={label(typeColor)}>{typeLabel}</p>
            {step === 'q' && (
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {currentQ + 1}/{totalQ}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Animated content */}
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0)'
          : slideDir === 'out' ? 'translateY(-8px)' : 'translateY(8px)',
        transition: 'opacity 0.38s ease, transform 0.38s ease',
      }}>

        {/* TYPE SELECT */}
        {step === 'type-select' && (
          <div>
            <p style={label('var(--text-muted)')}>CHECK-IN</p>
            <h1 style={heading}>Quale momento è?</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {(['morning', 'evening'] as CheckinType[]).map(type => (
                <button key={type} onClick={() => selectType(type)} style={{
                  flex: 1, padding: '1.75rem 1.25rem',
                  background: 'var(--surface)',
                  border: `1px solid ${type === checkinType ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '3px',
                  color: type === checkinType ? 'var(--gold)' : 'var(--text-secondary)',
                  fontFamily: 'Georgia, serif', fontSize: '0.95rem',
                  cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left' as const,
                }}>
                  <p style={{ marginBottom: '0.3rem' }}>{type === 'morning' ? '☀  Mattina' : '◑  Sera'}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {type === 'morning' ? '5 domande per iniziare' : '5 domande per riflettere'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUESTION */}
        {step === 'q' && currentQuestion && (
          <div>
            <p style={{ ...label(typeColor), marginBottom: '0.4rem' }}>{currentQuestion.label}</p>
            <h2 style={{ ...heading, marginBottom: currentQuestion.type === 'choice' ? '2rem' : '2.5rem' }}>
              {currentQuestion.text}
            </h2>

            {/* SLIDER */}
            {currentQuestion.type === 'slider' && (
              <div>
                <div style={{
                  fontSize: '4rem', fontFamily: 'Georgia, serif',
                  color: 'var(--gold)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1,
                }}>
                  {answers.stato ?? 5}
                </div>
                <input
                  type="range" min={1} max={10}
                  value={Number(answers.stato ?? 5)}
                  onChange={e => handleSliderChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentQuestion.poleLeft}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentQuestion.poleRight}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={handleSliderConfirm} style={primaryBtn}>Continua →</button>
                </div>
              </div>
            )}

            {/* CHOICE */}
            {currentQuestion.type === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {currentQuestion.options?.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleChoiceSelect(opt)}
                    style={{
                      padding: '1rem 1.25rem',
                      background: currentAnswer === opt ? 'rgba(201,169,110,0.06)' : 'var(--surface)',
                      border: `1px solid ${currentAnswer === opt ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: '3px',
                      color: currentAnswer === opt ? 'var(--gold)' : 'var(--text-secondary)',
                      fontFamily: 'Georgia, serif', fontSize: '0.9rem',
                      cursor: 'pointer', textAlign: 'left' as const,
                      transition: 'all 0.25s ease',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={e => {
                      if (currentAnswer !== opt) {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.4)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.03)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (currentAnswer !== opt) {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* TEXT */}
            {currentQuestion.type === 'text' && (
              <div style={{ paddingBottom: '6rem' }}>
                <textarea
                  ref={textRef}
                  value={(currentAnswer as string) ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTextConfirm(); }}
                  rows={4}
                  maxLength={currentQuestion.maxChars}
                  placeholder={currentQuestion.placeholder}
                  style={textarea}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {((currentAnswer as string) ?? '').length}/{currentQuestion.maxChars}
                  </span>
                  <button
                    onClick={handleTextConfirm}
                    disabled={!((currentAnswer as string)?.trim())}
                    style={{
                      ...primaryBtn,
                      opacity: (currentAnswer as string)?.trim() ? 1 : 0.35,
                      cursor: (currentAnswer as string)?.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {currentQ === totalQ - 1 ? 'Completa' : 'Continua →'}
                  </button>
                </div>
                {error && <p style={{ color: '#B45454', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</p>}
              </div>
            )}
          </div>
        )}

        {/* SUBMITTING */}
        {step === 'submitting' && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
              SELF OS sta leggendo...
            </p>
          </div>
        )}

        {/* INSIGHT */}
        {step === 'insight' && (
          <div>
            <p style={label(typeColor)}>Riflessione</p>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `2px solid ${typeColor}`,
              borderRadius: '3px',
              padding: '2rem 2.25rem',
              marginBottom: '2.5rem',
            }}>
              <p style={{
                fontFamily: 'Georgia, serif', fontSize: '1rem',
                lineHeight: 1.9, color: 'var(--text-primary)', fontStyle: 'italic',
              }}>
                {insight ?? 'Riflessione non disponibile.'}
              </p>
            </div>

            {activeExperiments.filter(e => !e.trackedToday).length > 0 && (
              <button
                onClick={() => { setLabStep(0); transition(() => setStep('lab')); }}
                style={{ ...outlineBtn, borderColor: 'rgba(201,169,110,0.4)', marginBottom: '1rem', display: 'block', width: 'fit-content' }}
              >
                Traccia il Lab ({activeExperiments.filter(e => !e.trackedToday).length}) →
              </button>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/dashboard" style={outlineBtn}>Dashboard →</a>
              {checkinType === 'morning' && (
                <button
                  onClick={() => {
                    setCheckinType('evening');
                    setStep('type-select');
                    setAnswers({});
                    setCurrentQ(0);
                    setInsight(null);
                    setAlreadyDone(false);
                  }}
                  style={{ ...outlineBtn, borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Check-in sera
                </button>
              )}
            </div>
          </div>
        )}

        {/* LAB MICRO-TRACKING */}
        {step === 'lab' && (() => {
          const untracked = activeExperiments.filter(e => !e.trackedToday);
          const exp = untracked[labStep];
          if (!exp) return (
            <div>
              <p style={label('var(--pattern)')}>Lab</p>
              <h2 style={{ ...heading, marginBottom: '1.5rem' }}>Tutto tracciato.</h2>
              <a href="/dashboard" style={outlineBtn}>Dashboard →</a>
            </div>
          );
          return (
            <LabMicroTracker
              key={exp.id}
              experiment={exp}
              onDone={() => {
                setActiveExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, trackedToday: true } : e));
                if (labStep < untracked.length - 1) {
                  transition(() => setLabStep(s => s + 1));
                } else {
                  transition(() => setStep('insight'));
                }
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}

// ─── Lab Micro Tracker ────────────────────────────────────────

function LabMicroTracker({
  experiment,
  onDone,
}: {
  experiment: { id: string; pattern_title: string; triggers: string[]; different_action: string };
  onDone: () => void;
}) {
  const [emerged, setEmerged] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: boolean, response?: string) {
    setSaving(true);
    await fetch(`/api/experiments/${experiment.id}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emerged: e, response: response ?? null }),
    }).catch(() => null);
    setSaving(false);
    onDone();
  }

  return (
    <div>
      <p style={label('var(--gold)')}>Lab</p>
      <h2 style={{ ...heading, marginBottom: '0.5rem' }}>{experiment.pattern_title}</h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
        Ricorda: {experiment.triggers[0]} → {experiment.different_action}
      </p>

      {emerged === null ? (
        <>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Il pattern è emerso oggi?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => save(false)} disabled={saving} style={outlineBtn}>No, non è emerso</button>
            <button onClick={() => setEmerged(true)} disabled={saving} style={outlineBtn}>Sì, è emerso →</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Cosa è successo?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { value: 'acted_differently', label: 'Ho agito diversamente',          color: 'var(--pattern)' },
              { value: 'noticed_during',    label: 'Ci sono caduto, l\'ho visto',   color: 'var(--gold)' },
              { value: 'noticed_after',     label: 'Ci sono caduto, l\'ho visto dopo', color: '#7A8B9E' },
              { value: 'automatic',         label: 'Non l\'ho visto',               color: '#B45454' },
            ].map(r => (
              <button
                key={r.value}
                onClick={() => save(true, r.value)}
                disabled={saving}
                style={{ ...outlineBtn, color: r.color, borderColor: 'var(--border)' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

function label(color: string): React.CSSProperties {
  return {
    fontSize: '0.65rem', letterSpacing: '0.2em',
    textTransform: 'uppercase', color, marginBottom: '0.5rem',
  };
}

const heading: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.45rem',
  fontWeight: 'normal', color: 'var(--text-primary)',
  lineHeight: 1.45, marginBottom: '2rem',
};

const textarea: React.CSSProperties = {
  width: '100%', background: 'transparent',
  border: 'none', borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)', fontFamily: 'Georgia, serif',
  fontSize: '1rem', lineHeight: 1.75, padding: '0.5rem 0',
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

const outlineBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.625rem 1.5rem',
  background: 'transparent', border: '1px solid var(--gold)',
  borderRadius: '3px', color: 'var(--gold)',
  fontFamily: 'Georgia, serif', fontSize: '0.875rem',
  letterSpacing: '0.05em', cursor: 'pointer',
  textDecoration: 'none', transition: 'all 0.35s ease',
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
