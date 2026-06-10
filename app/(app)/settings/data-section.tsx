'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DataSection({ emailReminders }: { emailReminders: boolean }) {
  const router = useRouter();
  const [reminders, setReminders] = useState(emailReminders);
  const [savingPref, setSavingPref] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleReminders() {
    const next = !reminders;
    setReminders(next);
    setSavingPref(true);
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_reminders: next }),
      });
      if (!res.ok) setReminders(!next); // rollback
    } catch {
      setReminders(!next);
    } finally {
      setSavingPref(false);
    }
  }

  async function deleteAccount() {
    if (confirmText !== 'ELIMINA' || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const data = await res.json() as { deleted?: boolean; error?: string };
      if (!res.ok || !data.deleted) throw new Error(data.error ?? 'Cancellazione fallita');
      await createClient().auth.signOut();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', marginTop: '3rem' }}>
      {/* Notifiche */}
      <p style={labelStyle}>Notifiche</p>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', marginBottom: '0.25rem' }}>
              Promemoria email
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Check-in del mattino e della sera, quando non li hai ancora fatti.
            </p>
          </div>
          <button
            onClick={toggleReminders}
            disabled={savingPref}
            aria-pressed={reminders}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
              border: '1px solid var(--border)', cursor: 'pointer', position: 'relative',
              background: reminders ? 'var(--gold)' : 'var(--background)',
              transition: 'background 0.3s ease',
            }}
          >
            <span style={{
              position: 'absolute', top: '2px', left: reminders ? '22px' : '2px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: reminders ? 'var(--background)' : 'var(--text-muted)',
              transition: 'left 0.3s ease, background 0.3s ease',
            }} />
          </button>
        </div>
      </div>

      {/* Dati */}
      <p style={{ ...labelStyle, marginTop: '2.5rem' }}>I tuoi dati</p>
      <div style={cardStyle}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
          Tutto ciò che SELF OS sa di te ti appartiene: scan, check-in, decisioni,
          pattern, segnali, esperimenti, lettere e profili identitari.
        </p>
        <a
          href="/api/account/export"
          download
          style={{
            display: 'inline-block', fontSize: '0.82rem', color: 'var(--gold)',
            border: '1px solid var(--gold)', borderRadius: '3px',
            padding: '0.5rem 1.25rem', textDecoration: 'none', letterSpacing: '0.03em',
          }}
        >
          Esporta tutti i dati (JSON)
        </a>
      </div>

      {/* Cancellazione */}
      <div style={{ ...cardStyle, marginTop: '1rem', borderColor: 'rgba(158,122,139,0.4)' }}>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Georgia, serif',
            }}
          >
            Elimina account e tutti i dati…
          </button>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', marginBottom: '0.75rem' }}>
              Questa azione è irreversibile.
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
              Tutto viene cancellato definitivamente: account, scan, check-in, decisioni,
              pattern, lettere, profili. Scrivi <strong style={{ color: 'var(--identita)' }}>ELIMINA</strong> per confermare.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="ELIMINA"
                style={{
                  flex: 1, background: 'var(--background)', border: '1px solid var(--border)',
                  borderRadius: '3px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)',
                  fontSize: '0.85rem', fontFamily: 'Georgia, serif',
                }}
              />
              <button
                onClick={deleteAccount}
                disabled={confirmText !== 'ELIMINA' || deleting}
                style={{
                  border: '1px solid var(--identita)', borderRadius: '3px',
                  background: 'none', color: confirmText === 'ELIMINA' ? 'var(--identita)' : 'var(--text-muted)',
                  padding: '0.5rem 1.25rem', fontSize: '0.82rem', fontFamily: 'Georgia, serif',
                  cursor: confirmText === 'ELIMINA' ? 'pointer' : 'default',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? 'Cancellazione…' : 'Elimina tutto'}
              </button>
            </div>
            {error && <p style={{ fontSize: '0.78rem', color: 'var(--identita)', marginTop: '0.75rem' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '1rem',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  padding: '1.5rem',
};
