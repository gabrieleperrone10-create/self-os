'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_QUESTIONS, SCAN_SECTIONS } from '@/lib/scan-questions';
import type { ScanAnswers, QuestionType } from '@/types/scan';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'selfos_scan_v2_answers';
const STORAGE_COMPLETE_KEY = 'selfos_scan_v2_complete';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function getSectionColor(sectionN: number): string {
  const colors: Record<number, string> = {
    1: 'var(--stato)',
    2: 'var(--pattern)',
    3: 'var(--credenze)',
    4: 'var(--identita)',
    5: 'var(--gold)',
    6: 'var(--stato)',
    7: 'var(--pattern)',
  };
  return colors[sectionN] ?? 'var(--gold)';
}

function isAnswerValid(type: QuestionType, answer: ScanAnswers[string] | undefined): boolean {
  if (answer === undefined || answer === null) return false;
  if (type === 'SCALA' || type === 'ACCORDO') {
    return typeof answer === 'number' && answer >= 1;
  }
  if (type === 'MULTI') {
    return Array.isArray(answer) && answer.length >= 0; // 0+ allowed
  }
  if (type === 'RANK') {
    return Array.isArray(answer) && answer.length >= 3;
  }
  if (type === 'FRASE' || type === 'TESTO') {
    return typeof answer === 'string' && answer.trim().length > 0;
  }
  if (type === 'SCELTA') {
    return typeof answer === 'string' && answer.length > 0;
  }
  return false;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ScalaInputProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  subtext?: string;
}
function ScalaInput({ value, onChange, max = 10, subtext }: ScalaInputProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: '2.5rem',
        color: 'var(--gold)',
        marginBottom: '1.5rem',
        lineHeight: 1,
        minHeight: '3rem',
      }}>
        {value > 0 ? value : '–'}
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={value > 0 ? value : 1}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--gold)',
          height: '4px',
          cursor: 'pointer',
          outline: 'none',
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'Georgia, serif',
      }}>
        <span>1</span>
        <span>{max}</span>
      </div>
      {subtext && (
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.75rem',
          fontStyle: 'italic',
        }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

interface AccordoInputProps {
  value: number;
  onChange: (v: number) => void;
}
function AccordoInput({ value, onChange }: AccordoInputProps) {
  const labels = ['Per niente', '', '', '', 'Completamente'];
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '0.625rem',
        justifyContent: 'center',
      }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1,
              minHeight: '52px',
              background: value === n ? 'var(--gold)' : 'transparent',
              border: `1px solid ${value === n ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '3px',
              color: value === n ? 'var(--background)' : 'var(--text-secondary)',
              fontFamily: 'Georgia, serif',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'Georgia, serif',
      }}>
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

interface SceltaInputProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}
function SceltaInput({ value, options, onChange }: SceltaInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            width: '100%',
            minHeight: '52px',
            padding: '0.75rem 1rem',
            background: value === opt ? 'color-mix(in srgb, var(--gold) 8%, transparent)' : 'transparent',
            border: `1px solid ${value === opt ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: '3px',
            color: value === opt ? 'var(--gold)' : 'var(--text-secondary)',
            fontFamily: 'Georgia, serif',
            fontSize: '0.9rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            lineHeight: 1.4,
          }}
          onMouseEnter={e => {
            if (value !== opt) {
              e.currentTarget.style.borderColor = 'var(--text-muted)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (value !== opt) {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface MultiInputProps {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}
function MultiInput({ value, options, onChange }: MultiInputProps) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter(x => x !== opt));
    } else {
      onChange([...value, opt]);
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              width: '100%',
              minHeight: '52px',
              padding: '0.75rem 1rem',
              background: selected ? 'color-mix(in srgb, var(--gold) 8%, transparent)' : 'transparent',
              border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '3px',
              color: selected ? 'var(--gold)' : 'var(--text-secondary)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.9rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              lineHeight: 1.4,
            }}
          >
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '2px',
              border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
              background: selected ? 'var(--gold)' : 'transparent',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: 'var(--background)',
            }}>
              {selected ? '✓' : ''}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface FraseInputProps {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}
function FraseInput({ value, placeholder, onChange, onEnter }: FraseInputProps) {
  return (
    <input
      autoFocus
      type="text"
      value={value}
      placeholder={placeholder ?? 'Completa la frase...'}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onEnter(); }}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontFamily: 'Georgia, serif',
        fontSize: '1.1rem',
        lineHeight: 1.6,
        padding: '0.5rem 0',
        outline: 'none',
        caretColor: 'var(--gold)',
      }}
      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
    />
  );
}

interface TestoInputProps {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}
function TestoInput({ value, placeholder, onChange }: TestoInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.max(ref.current.scrollHeight, 96) + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      autoFocus
      value={value}
      placeholder={placeholder ?? 'Scrivi qui...'}
      onChange={e => onChange(e.target.value)}
      rows={3}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontFamily: 'Georgia, serif',
        fontSize: '1rem',
        lineHeight: 1.7,
        padding: '0.5rem 0',
        resize: 'none',
        outline: 'none',
        caretColor: 'var(--gold)',
        overflow: 'hidden',
      }}
      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
    />
  );
}

interface RankInputProps {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}
function RankInput({ value, options, onChange }: RankInputProps) {
  function handleTap(opt: string) {
    if (value.includes(opt)) {
      // Remove from rank
      onChange(value.filter(x => x !== opt));
    } else {
      // Add to end of rank
      onChange([...value, opt]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '0.5rem',
        fontStyle: 'italic',
      }}>
        Tocca nell'ordine di priorità. Tocca di nuovo per rimuovere.
      </p>
      {options.map(opt => {
        const rankIndex = value.indexOf(opt);
        const ranked = rankIndex !== -1;
        return (
          <button
            key={opt}
            onClick={() => handleTap(opt)}
            style={{
              width: '100%',
              minHeight: '52px',
              padding: '0.75rem 1rem',
              background: ranked ? 'color-mix(in srgb, var(--gold) 8%, transparent)' : 'transparent',
              border: `1px solid ${ranked ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '3px',
              color: ranked ? 'var(--gold)' : 'var(--text-secondary)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.9rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <span>{opt}</span>
            {ranked && (
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--gold)',
                color: 'var(--background)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 'bold',
              }}>
                {rankIndex + 1}
              </span>
            )}
          </button>
        );
      })}
      {value.length < 3 && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Seleziona almeno 3 valori
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'checking' | 'question' | 'transitioning' | 'pause' | 'ready' | 'analyzing' | 'error';

export default function ScanPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('checking');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ScanAnswers>({});
  const [currentAnswer, setCurrentAnswer] = useState<ScanAnswers[string]>(undefined as unknown as ScanAnswers[string]);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  // Check if scan already completed → redirect
  useEffect(() => {
    async function checkExisting() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: scan } = await supabase
            .from('scans')
            .select('id')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();
          if (scan) {
            router.replace('/scan/results');
            return;
          }
        }
      } catch {
        // No scan found — proceed
      }

      // Restore from localStorage
      try {
        const savedAnswers = localStorage.getItem(STORAGE_KEY);
        const isComplete = localStorage.getItem(STORAGE_COMPLETE_KEY);

        if (isComplete === 'true') {
          router.replace('/scan/results');
          return;
        }

        if (savedAnswers) {
          const parsed = JSON.parse(savedAnswers) as ScanAnswers;
          setAnswers(parsed);
          // Resume from first unanswered
          const resumeIndex = ALL_QUESTIONS.findIndex(q => !isAnswerValid(q.type, parsed[q.id]));
          setCurrentIndex(resumeIndex >= 0 ? resumeIndex : ALL_QUESTIONS.length - 1);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }

      setPhase('question');
    }

    void checkExisting();
  }, [router]);

  // Sync currentAnswer from saved answers when question changes
  useEffect(() => {
    if (phase !== 'question') return;
    const q = ALL_QUESTIONS[currentIndex];
    if (!q) return;
    const saved = answers[q.id];
    if (saved !== undefined) {
      setCurrentAnswer(saved);
    } else {
      // Default values
      if (q.type === 'SCALA') setCurrentAnswer(0);
      else if (q.type === 'ACCORDO') setCurrentAnswer(0);
      else if (q.type === 'MULTI') setCurrentAnswer([]);
      else if (q.type === 'RANK') setCurrentAnswer([]);
      else setCurrentAnswer('');
    }
    setAutoAdvanced(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  const saveAnswer = useCallback(
    (questionId: string, answer: ScanAnswers[string]) => {
      const updated = { ...answers, [questionId]: answer };
      setAnswers(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    },
    [answers],
  );

  const question = ALL_QUESTIONS[currentIndex];
  const section = question ? SCAN_SECTIONS.find(s => s.n === question.section) : null;
  const sectionColor = question ? getSectionColor(question.section) : 'var(--gold)';

  // Questions in current section for progress
  const sectionQuestions = question
    ? ALL_QUESTIONS.filter(q => q.section === question.section)
    : [];
  const sectionAnswered = sectionQuestions.filter(q => isAnswerValid(q.type, answers[q.id])).length;

  // Auto-advance for SCALA, ACCORDO, SCELTA
  async function handleAutoAdvance(answer: ScanAnswers[string]) {
    if (autoAdvanced) return;
    setAutoAdvanced(true);
    const q = ALL_QUESTIONS[currentIndex];
    const updated = saveAnswer(q.id, answer);
    await delay(400);
    await advanceTo(currentIndex + 1, updated);
  }

  async function handleContinue() {
    const q = ALL_QUESTIONS[currentIndex];
    if (!isAnswerValid(q.type, currentAnswer)) return;
    const updated = saveAnswer(q.id, currentAnswer);
    await advanceTo(currentIndex + 1, updated);
  }

  async function advanceTo(nextIndex: number, updatedAnswers: ScanAnswers) {
    // Fade out
    setVisible(false);
    setPhase('transitioning');
    await delay(400);

    if (nextIndex >= ALL_QUESTIONS.length) {
      // All answered — ritual ending
      setPhase('pause');
      await delay(3000);
      setPhase('ready');
      await delay(2500);
      setPhase('analyzing');
      await runAnalysis(updatedAnswers);
    } else {
      setCurrentIndex(nextIndex);
      setPhase('question');
      setVisible(true);
    }
  }

  async function handleBack() {
    if (currentIndex === 0) return;
    setVisible(false);
    setPhase('transitioning');
    await delay(300);
    setCurrentIndex(i => i - 1);
    setPhase('question');
    setVisible(true);
  }

  async function runAnalysis(finalAnswers: ScanAnswers) {
    try {
      // Mark complete in localStorage so refresh doesn't re-trigger scan
      localStorage.setItem(STORAGE_COMPLETE_KEY, 'true');

      const res = await fetch('/api/ai/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Analisi fallita');
      }

      localStorage.removeItem(STORAGE_KEY);
      router.push('/scan/results');
    } catch (err) {
      localStorage.removeItem(STORAGE_COMPLETE_KEY);
      setError(err instanceof Error ? err.message : 'Errore durante l\'analisi');
      setPhase('error');
    }
  }

  // ─── Render phases ─────────────────────────────────────────────────────────

  const fullScreenStyle: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--background)',
    flexDirection: 'column',
  };

  if (phase === 'checking') {
    return <div style={fullScreenStyle} />;
  }

  if (phase === 'pause') {
    return <div style={{ ...fullScreenStyle, minHeight: '100vh', background: 'var(--background)' }} />;
  }

  if (phase === 'ready') {
    return (
      <div style={fullScreenStyle}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.5rem',
          fontWeight: 'normal',
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          animation: 'fadeIn 1s ease forwards',
        }}>
          Sei pronto a vedere?
        </p>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <div style={fullScreenStyle}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Il sistema sta leggendo te...
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={fullScreenStyle}>
        <p style={{ color: '#B45454', fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>
          {error}
        </p>
        <button
          onClick={() => { setPhase('question'); setVisible(true); }}
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid var(--gold)',
            borderRadius: '3px',
            background: 'transparent',
            color: 'var(--gold)',
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!question || !section) return null;

  const canContinue = isAnswerValid(question.type, currentAnswer);
  const needsButton = question.type === 'MULTI' || question.type === 'FRASE' || question.type === 'TESTO' || question.type === 'RANK';

  const isLastQuestion = currentIndex === ALL_QUESTIONS.length - 1;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1.25rem',
      }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            style={{
              background: 'none',
              border: 'none',
              color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              padding: '0.25rem',
              fontFamily: 'Georgia, serif',
              fontSize: '0.85rem',
              opacity: currentIndex === 0 ? 0.3 : 1,
              transition: 'opacity 0.3s ease',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Torna indietro"
          >
            ←
          </button>

          {/* Section dots */}
          <div style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
          }}>
            {SCAN_SECTIONS.map(s => (
              <div
                key={s.n}
                style={{
                  width: s.n === question.section ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: s.n === question.section
                    ? getSectionColor(s.n)
                    : s.n < question.section
                      ? 'var(--text-muted)'
                      : 'var(--border)',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
          </div>

          {/* Section label */}
          <p style={{
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: sectionColor,
            fontFamily: 'Georgia, serif',
            minWidth: '44px',
            textAlign: 'right',
          }}>
            {question.section}/7
          </p>
        </div>

        {/* Section progress bar */}
        <div style={{
          maxWidth: '640px',
          margin: '0.75rem auto 0',
          height: '2px',
          background: 'var(--border)',
          borderRadius: '1px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: sectionColor,
            width: `${sectionQuestions.length > 0 ? (sectionAnswered / sectionQuestions.length) * 100 : 0}%`,
            transition: 'width 0.5s ease',
            borderRadius: '1px',
          }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.25rem 5rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          {/* Section name */}
          <p style={{
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: sectionColor,
            marginBottom: '1.75rem',
            fontFamily: 'Georgia, serif',
          }}>
            {section.title}
          </p>

          {/* Question text */}
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.1rem, 3vw, 1.35rem)',
            fontWeight: 'normal',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            marginBottom: '2.5rem',
          }}>
            {question.text}
          </h2>

          {/* Answer input */}
          <div style={{ marginBottom: '2rem' }}>
            {question.type === 'SCALA' && (
              <ScalaInput
                value={typeof currentAnswer === 'number' ? currentAnswer : 0}
                onChange={v => {
                  setCurrentAnswer(v);
                  saveAnswer(question.id, v);
                }}
                max={question.max ?? 10}
                subtext={question.subtext}
              />
            )}
            {question.type === 'ACCORDO' && (
              <AccordoInput
                value={typeof currentAnswer === 'number' ? currentAnswer : 0}
                onChange={v => {
                  setCurrentAnswer(v);
                  void handleAutoAdvance(v);
                }}
              />
            )}
            {question.type === 'SCELTA' && (
              <SceltaInput
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                options={question.options ?? []}
                onChange={v => {
                  setCurrentAnswer(v);
                  void handleAutoAdvance(v);
                }}
              />
            )}
            {question.type === 'MULTI' && (
              <MultiInput
                value={Array.isArray(currentAnswer) ? currentAnswer as string[] : []}
                options={question.options ?? []}
                onChange={v => {
                  setCurrentAnswer(v);
                  saveAnswer(question.id, v);
                }}
              />
            )}
            {question.type === 'FRASE' && (
              <FraseInput
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                placeholder={question.placeholder}
                onChange={v => {
                  setCurrentAnswer(v);
                  saveAnswer(question.id, v);
                }}
                onEnter={() => { if (canContinue) void handleContinue(); }}
              />
            )}
            {question.type === 'TESTO' && (
              <TestoInput
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                placeholder={question.placeholder}
                onChange={v => {
                  setCurrentAnswer(v);
                  saveAnswer(question.id, v);
                }}
              />
            )}
            {question.type === 'RANK' && (
              <RankInput
                value={Array.isArray(currentAnswer) ? currentAnswer as string[] : []}
                options={question.options ?? []}
                onChange={v => {
                  setCurrentAnswer(v);
                  saveAnswer(question.id, v);
                }}
              />
            )}
          </div>

          {/* Continue button — shown for types that need explicit confirmation */}
          {(needsButton || question.type === 'SCALA') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => void handleContinue()}
                disabled={!canContinue}
                style={{
                  padding: '0.75rem 1.75rem',
                  background: 'transparent',
                  border: `1px solid ${canContinue ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '3px',
                  color: canContinue ? 'var(--gold)' : 'var(--text-muted)',
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.9rem',
                  letterSpacing: '0.04em',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                }}
                onMouseEnter={e => {
                  if (canContinue) {
                    e.currentTarget.style.background = 'var(--gold)';
                    e.currentTarget.style.color = 'var(--background)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = canContinue ? 'var(--gold)' : 'var(--text-muted)';
                }}
              >
                {isLastQuestion ? 'Completa lo scan' : 'Continua →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: section subtitle */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.75rem 1.25rem',
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}>
        <p style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
        }}>
          {section.subtitle}
        </p>
      </div>
    </div>
  );
}
