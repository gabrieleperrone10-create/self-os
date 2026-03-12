'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="animate-fade-up" style={{ width: '100%', maxWidth: '400px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '1rem',
          }}
        >
          SELF OS
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.75rem',
            fontWeight: 'normal',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Bentornato
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Continua il tuo percorso identitario
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label
            htmlFor="email"
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '0.75rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'Georgia, serif',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label
            htmlFor="password"
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '0.75rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'Georgia, serif',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#B45454',
              padding: '0.75rem 1rem',
              background: 'rgba(180,84,84,0.1)',
              border: '1px solid rgba(180,84,84,0.2)',
              borderRadius: '3px',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            padding: '0.875rem 1.5rem',
            background: 'transparent',
            border: '1px solid var(--gold)',
            borderRadius: '3px',
            color: 'var(--gold)',
            fontFamily: 'Georgia, serif',
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.4s ease',
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.color = 'var(--background)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--gold)';
          }}
        >
          {loading ? 'Accesso in corso...' : 'Entra'}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        Non hai un account?{' '}
        <Link
          href="/signup"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Inizia qui
        </Link>
      </p>
    </div>
  );
}
