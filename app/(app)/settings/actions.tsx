'use client';

import { useState } from 'react';
import type { UserPlan } from '@/types';

interface Props {
  plan: UserPlan;
  hasBilling: boolean;
  currentPlan: UserPlan;
  portalOnly?: boolean;
}

export function SettingsActions({ plan, hasBilling, currentPlan, portalOnly }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  const isDowngrade =
    (currentPlan === 'coach' && plan === 'pro') ||
    (currentPlan !== 'free' && plan === 'free');

  if (portalOnly) {
    return (
      <button onClick={handlePortal} disabled={loading} style={outlineBtn}>
        {loading ? 'Caricamento...' : 'Gestisci fatturazione →'}
      </button>
    );
  }

  if (isDowngrade) {
    return (
      <button onClick={handlePortal} disabled={loading} style={{ ...outlineBtn, borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        {loading ? 'Caricamento...' : 'Gestisci piano'}
      </button>
    );
  }

  return (
    <button onClick={handleUpgrade} disabled={loading} style={outlineBtn}>
      {loading ? 'Caricamento...' : `Passa a ${plan.charAt(0).toUpperCase() + plan.slice(1)} →`}
    </button>
  );
}

const outlineBtn: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  background: 'transparent',
  border: '1px solid var(--gold)',
  borderRadius: '3px',
  color: 'var(--gold)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.8rem',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};
