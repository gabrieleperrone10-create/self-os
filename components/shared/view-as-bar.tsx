'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Search, X } from 'lucide-react';
import type { Profile, UserRole } from '@/types';

type UserOption = Pick<Profile, 'id' | 'full_name' | 'email'>;

interface ViewAsBarProps {
  realRole: UserRole;
  isImpersonating: boolean;
  viewProfile: Profile | null;
  users?: UserOption[];
}

export function ViewAsBar({ realRole, isImpersonating, viewProfile, users = [] }: ViewAsBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }, [users, query]);

  if (realRole !== 'admin') return null;

  async function enterAs(userId: string) {
    setLoading(true);
    try {
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setOpen(false);
      setQuery('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function exit() {
    setLoading(true);
    try {
      await fetch('/api/admin/impersonate', { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isImpersonating) {
    const name = viewProfile?.full_name ?? viewProfile?.email ?? 'utente';
    const extra = viewProfile?.full_name && viewProfile?.email ? ` (${viewProfile.email})` : '';

    return (
      <div className="view-as-banner" style={bannerStyle}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          Stai visualizzando come <strong style={{ color: 'var(--gold)' }}>{name}</strong>
          {extra} — sola lettura
        </span>
        <button onClick={exit} disabled={loading} className="btn-gold-hover" style={exitBtnStyle}>
          <X size={14} strokeWidth={1.5} />
          Esci
        </button>
      </div>
    );
  }

  return (
    <div className="view-as-picker" style={pickerWrapStyle}>
      {open && (
        <div style={panelStyle}>
          <div style={searchRowStyle}>
            <Search size={14} strokeWidth={1.5} color="var(--text-muted)" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca per nome o email..."
              style={inputStyle}
            />
          </div>
          <div style={listStyle}>
            {filtered.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.75rem 1rem' }}>
                Nessun utente trovato.
              </p>
            ) : (
              filtered.map(u => (
                <button
                  key={u.id}
                  onClick={() => enterAs(u.id)}
                  disabled={loading}
                  className="view-as-user-row"
                  style={userRowStyle}
                >
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                    {u.full_name ?? '—'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.email}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="btn-gold-hover" style={toggleBtnStyle}>
        {open ? <X size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        Entra come utente
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const bannerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '0.6rem 1rem',
  background: 'var(--surface)',
  borderBottom: '1px solid var(--gold)',
  flexWrap: 'wrap',
};

const exitBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.3rem 0.75rem',
  background: 'transparent',
  border: '1px solid var(--gold)',
  borderRadius: '3px',
  color: 'var(--gold)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.75rem',
  cursor: 'pointer',
  transition: 'background 0.3s ease, color 0.3s ease',
};

const pickerWrapStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.75rem',
};

const toggleBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.6rem 1.1rem',
  background: 'var(--surface)',
  border: '1px solid var(--gold)',
  borderRadius: '3px',
  color: 'var(--gold)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.8rem',
  letterSpacing: '0.03em',
  cursor: 'pointer',
  transition: 'background 0.3s ease, color 0.3s ease',
};

const panelStyle: React.CSSProperties = {
  width: '280px',
  maxHeight: '360px',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const searchRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid var(--border)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.85rem',
};

const listStyle: React.CSSProperties = {
  overflowY: 'auto',
};

const userRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  textAlign: 'left',
  padding: '0.6rem 1rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'background 0.3s ease',
};
