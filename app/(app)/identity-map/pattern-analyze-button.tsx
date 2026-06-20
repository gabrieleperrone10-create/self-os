'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PatternAnalyzeButton({ hasEnoughData, disabled }: { hasEnoughData: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = hasEnoughData && !disabled;

  async function analyze() {
    if (!enabled || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/patterns/analyze', { method: 'POST' });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore analisi');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#B45454' }}>{error}</span>
      )}
      <button
        onClick={analyze}
        disabled={!enabled || loading}
        style={{
          padding: '0.4rem 0.875rem',
          background: 'transparent',
          border: `1px solid ${enabled ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px',
          color: enabled ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          cursor: enabled && !loading ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {loading ? 'Analisi...' : 'Analizza pattern'}
      </button>
    </div>
  );
}
