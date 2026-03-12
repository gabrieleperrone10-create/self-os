'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Decision } from '@/types';

export function DecisionJournal() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [outcomeInputs, setOutcomeInputs] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setDecisions((data ?? []) as Decision[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveOutcome(decision: Decision) {
    const outcome = outcomeInputs[decision.id]?.trim();
    if (!outcome || submitting) return;
    setSubmitting(decision.id);

    try {
      const res = await fetch('/api/ai/outcome-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: decision.id, outcome }),
      });

      const data = await res.json() as { reflection?: string };
      if (data.reflection) {
        setReflections(prev => ({ ...prev, [decision.id]: data.reflection! }));
        setDecisions(prev =>
          prev.map(d => d.id === decision.id ? { ...d, outcome, outcome_date: new Date().toISOString().split('T')[0] } : d)
        );
      }
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return null;

  if (decisions.length === 0) {
    return (
      <div style={emptyState}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
          Nessuna decisione registrata ancora.<br />
          Usa il Mirror per la prossima decisione importante.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {decisions.map(d => {
        const isOpen = expanded === d.id;
        const reflection = reflections[d.id] ?? null;
        const hasOutcome = !!d.outcome;

        return (
          <div
            key={d.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `2px solid ${d.origin === 'vision' ? 'var(--pattern)' : d.origin === 'fear' ? '#9E7A7A' : 'var(--border)'}`,
              borderRadius: '3px',
            }}
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : d.id)}
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                textAlign: 'left',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                  {d.description.length > 100 ? d.description.slice(0, 100) + '…' : d.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(d.created_at).toLocaleDateString('it-IT')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Stato: {d.state_score}/10
                  </span>
                  {d.origin && (
                    <span style={{ fontSize: '0.7rem', color: d.origin === 'vision' ? 'var(--pattern)' : '#9E7A7A' }}>
                      {d.origin === 'vision' ? 'Visione' : d.origin === 'fear' ? 'Paura' : '—'}
                    </span>
                  )}
                  {hasOutcome && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--pattern)' }}>Esito ✓</span>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0, marginTop: '2px' }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded */}
            {isOpen && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                {/* Mirror response */}
                {d.ai_mirror && (
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--credenze)', marginBottom: '0.5rem' }}>
                      Mirror
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'Georgia, serif', lineHeight: 1.7, fontStyle: 'italic' }}>
                      {d.ai_mirror}
                    </p>
                  </div>
                )}

                {/* Outcome registered */}
                {hasOutcome ? (
                  <div>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--pattern)', marginBottom: '0.5rem' }}>
                      Esito — {d.outcome_date ? new Date(d.outcome_date).toLocaleDateString('it-IT') : ''}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.6, marginBottom: '1rem' }}>
                      {d.outcome}
                    </p>
                    {reflection && (
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(201,169,110,0.05)',
                        border: '1px solid rgba(201,169,110,0.15)',
                        borderRadius: '3px',
                      }}>
                        <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                          Riflessione sull'esito
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.7, fontStyle: 'italic' }}>
                          {reflection}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Outcome input */
                  <div>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Registra l&apos;esito
                    </p>
                    <textarea
                      value={outcomeInputs[d.id] ?? ''}
                      onChange={e => setOutcomeInputs(prev => ({ ...prev, [d.id]: e.target.value }))}
                      rows={2}
                      placeholder="Cosa hai deciso? Come è andata?"
                      style={textareaStyle}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
                    />
                    {outcomeInputs[d.id]?.trim() && (
                      <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => saveOutcome(d)}
                          disabled={submitting === d.id}
                          style={saveBtn}
                        >
                          {submitting === d.id ? 'Analisi...' : 'Salva e analizza'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const emptyState: React.CSSProperties = {
  padding: '2rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.875rem',
  lineHeight: 1.7,
  padding: '0.375rem 0',
  resize: 'none',
  outline: 'none',
  transition: 'border-color 0.3s ease',
  caretColor: 'var(--gold)',
};

const saveBtn: React.CSSProperties = {
  padding: '0.4rem 1rem',
  background: 'transparent',
  border: '1px solid var(--gold)',
  borderRadius: '3px',
  color: 'var(--gold)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.75rem',
  cursor: 'pointer',
  letterSpacing: '0.04em',
};
