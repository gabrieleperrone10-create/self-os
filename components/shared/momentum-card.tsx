'use client';

import { useEffect, useState } from 'react';
import type { MomentumData } from '@/lib/utils/momentum';
import { MOMENTUM_COLOR } from '@/lib/utils/momentum';

export function MomentumCard({ data }: { data: MomentumData }) {
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai/momentum-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(r => r.json())
      .then((d: { insight?: string }) => setInsight(d.insight ?? null))
      .catch(() => null);
  }, [data.score]); // eslint-disable-line react-hooks/exhaustive-deps

  const color = MOMENTUM_COLOR[data.color];

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${color}`,
        borderRadius: '3px',
        padding: '1.5rem',
        minWidth: '200px',
      }}
    >
      <p style={{
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color,
        marginBottom: '0.75rem',
      }}>
        MOMENTUM
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '3.5rem',
          color,
          lineHeight: 1,
          transition: 'color 0.5s ease',
        }}>
          {data.score}
        </span>
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
      </div>

      {insight ? (
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontFamily: 'Georgia, serif',
          lineHeight: 1.6,
          fontStyle: 'italic',
          marginTop: '0.75rem',
          minHeight: '2.5rem',
        }}>
          {insight}
        </p>
      ) : (
        <div style={{ height: '2.5rem', marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>...</p>
        </div>
      )}

      {/* Breakdown */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <BreakdownBar label="Stato" value={data.stateComponent} max={40} color={color} />
        <BreakdownBar label="Streak" value={data.streakComponent} max={30} color={color} />
        <BreakdownBar label="Visione" value={data.visionComponent} max={30} color={color} />
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '40px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px' }}>
        <div style={{
          height: '100%',
          width: `${(value / max) * 100}%`,
          background: color,
          borderRadius: '1px',
          transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '24px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
