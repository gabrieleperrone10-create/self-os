'use client';

import { useState } from 'react';

export function InviteLink({ coachId }: { coachId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/join/${coachId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '3px',
      padding: '1.25rem 1.5rem',
      maxWidth: '560px',
      marginBottom: '2rem',
    }}>
      <p style={{
        fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: '0.75rem',
      }}>
        Link di invito
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <code style={{
          flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)',
          background: 'var(--background)', padding: '0.5rem 0.75rem',
          borderRadius: '2px', border: '1px solid var(--border)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'Courier New, monospace',
        }}>
          {url}
        </code>
        <button
          onClick={copy}
          style={{
            padding: '0.5rem 1rem', background: 'transparent',
            border: `1px solid ${copied ? 'var(--pattern)' : 'var(--border)'}`,
            borderRadius: '2px', cursor: 'pointer',
            color: copied ? 'var(--pattern)' : 'var(--text-muted)',
            fontSize: '0.75rem', fontFamily: 'Georgia, serif',
            transition: 'all 0.3s ease', whiteSpace: 'nowrap',
          }}
        >
          {copied ? 'Copiato ✓' : 'Copia'}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
        Condividi questo link con i tuoi clienti. Quando si connettono, appariranno in questa dashboard.
      </p>
    </div>
  );
}
