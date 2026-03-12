'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PatternAnalyzeButton({ hasEnoughData }: { hasEnoughData: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!hasEnoughData || loading) return;
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
        disabled={!hasEnoughData || loading}
        style={{
          padding: '0.4rem 0.875rem',
          background: 'transparent',
          border: `1px solid ${hasEnoughData ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px',
          color: hasEnoughData ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          cursor: hasEnoughData && !loading ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {loading ? 'Analisi...' : 'Analizza pattern'}
      </button>
    </div>
  );
}
