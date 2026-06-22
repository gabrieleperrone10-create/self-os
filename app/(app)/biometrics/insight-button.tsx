'use client';

import { useState } from 'react';
import type { BiometricsInsight } from '@/lib/anthropic/schemas';

const STATO_CONFIG: Record<BiometricsInsight['stato_nervoso'], {
  color: string; dot: string; label: string;
}> = {
  recupero:        { color: 'var(--pattern)',   dot: '#8B9E7A', label: 'Recupero' },
  attivo_stabile:  { color: 'var(--gold)',      dot: '#C9A96E', label: 'Attivo' },
  stress_moderato: { color: '#C9A96E',          dot: '#C9A06E', label: 'Stress moderato' },
  stress_elevato:  { color: '#B87171',          dot: '#B87171', label: 'Stress elevato' },
  segnale_assente: { color: 'var(--text-muted)', dot: '#4A4035', label: 'Segnale assente' },
};

const AFFIDABILITA_LABEL: Record<BiometricsInsight['affidabilita'], string> = {
  alta:  'dati affidabili',
  media: 'dati parziali',
  bassa: 'dati limitati',
};

export function BiometricsInsightButton({
  hasBiometrics, initialInsight, version, createdAt,
}: {
  hasBiometrics: boolean;
  initialInsight: BiometricsInsight | null;
  version: number | null;
  createdAt: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<BiometricsInsight | null>(initialInsight);
  const [error, setError] = useState<string | null>(null);
  // La meta (versione/data) vale solo per l'insight persistito iniziale
  const [showMeta, setShowMeta] = useState(initialInsight !== null);

  const metaLabel = version !== null && createdAt
    ? `lettura v${version} · ${new Date(createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`
    : null;

  async function analyze() {
    if (loading || !hasBiometrics) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/biometrics-insight', { method: 'POST' });
      const data = await res.json() as BiometricsInsight & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore analisi');
      setInsight(data);
      setShowMeta(false); // appena rigenerata: la meta persistita non vale più
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Trigger */}
      {!insight && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={analyze}
            disabled={!hasBiometrics || loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: `1px solid ${hasBiometrics ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '3px',
              color: hasBiometrics ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.8rem',
              letterSpacing: '0.04em',
              cursor: hasBiometrics && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Analisi in corso…' : 'Leggi il corpo'}
          </button>
          {!hasBiometrics && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Connetti Health Auto Export per abilitare l'analisi
            </span>
          )}
          {error && (
            <span style={{ fontSize: '0.75rem', color: '#B87171' }}>{error}</span>
          )}
        </div>
      )}

      {/* Risultato */}
      {insight && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '3px', overflow: 'hidden',
        }}>
          {/* Header stato */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-block', width: '8px', height: '8px',
                borderRadius: '50%', background: STATO_CONFIG[insight.stato_nervoso].dot,
              }} />
              <span style={{
                fontFamily: 'Georgia, serif', fontSize: '1rem',
                color: STATO_CONFIG[insight.stato_nervoso].color,
              }}>
                {insight.etichetta}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {showMeta && metaLabel ? metaLabel : AFFIDABILITA_LABEL[insight.affidabilita]}
              </span>
              <button
                onClick={() => { setInsight(null); setError(null); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Georgia, serif',
                  padding: '0',
                }}
              >
                rigenera
              </button>
            </div>
          </div>

          {/* Lettura */}
          <div style={{ padding: '1.5rem' }}>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: '0.92rem',
              lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1.5rem',
            }}>
              {insight.lettura}
            </p>

            {/* Correlazioni */}
            {insight.correlazioni.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Correlazioni
                </p>
                {insight.correlazioni.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    marginBottom: '0.6rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>→</span>
                    <div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{c.evento}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>—</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginLeft: '0.4rem' }}>{c.impatto}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Indicazione */}
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: '1.25rem',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingTop: '0.15rem', minWidth: '60px' }}>
                Adesso
              </span>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                {insight.indicazione}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
