'use client';

import { useState, useEffect, useCallback } from 'react';

type CalendarStatus = {
  calendar: {
    label: string;
    last_sync: string | null;
    event_count: number;
    created_at: string;
  } | null;
  biometric_token: string | null;
};

export function CalendarSection() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [icsUrl, setIcsUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/calendar/status');
    if (res.ok) setStatus(await res.json() as CalendarStatus);
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  async function handleConnect() {
    if (!icsUrl.trim()) return;
    setConnecting(true);
    const res = await fetch('/api/calendar/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ics_url: icsUrl.trim() }),
    });
    setConnecting(false);
    if (res.ok) {
      setIcsUrl('');
      await loadStatus();
      flash('Calendario connesso. Fai "Sync ora" per importare gli eventi.', true);
    } else {
      const d = await res.json() as { error?: string };
      flash(d.error ?? 'URL non valido', false);
    }
  }

  async function handleDisconnect() {
    await fetch('/api/calendar/connect', { method: 'DELETE' });
    await loadStatus();
    flash('Calendario disconnesso.', true);
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch('/api/calendar/sync', { method: 'POST' });
    setSyncing(false);
    if (res.ok) {
      const d = await res.json() as { synced: number };
      await loadStatus();
      flash(`${d.synced} eventi importati.`, true);
    } else {
      flash('Sync fallito. Controlla l\'URL ICS.', false);
    }
  }

  async function getOrShowToken() {
    if (status?.biometric_token) { setShowToken(true); return; }
    const res = await fetch('/api/biometrics/token');
    if (res.ok) { await loadStatus(); setShowToken(true); }
  }

  async function copy(what: 'url' | 'token') {
    const text = what === 'url'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/biometrics/ingest`
      : status?.biometric_token ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ maxWidth: '480px', marginTop: '3rem' }}>
      <p style={labelStyle}>Connessioni dati</p>

      {/* ── Google Calendar ───────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <p style={sectionLabel}>Google Calendar</p>
          {status?.calendar && (
            <span style={{ fontSize: '0.65rem', color: 'var(--pattern)', letterSpacing: '0.12em' }}>
              ● CONNESSO
            </span>
          )}
        </div>

        {status === null ? (
          <p style={mutedText}>Caricamento…</p>
        ) : status.calendar ? (
          <>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', marginBottom: '0.25rem' }}>
              {status.calendar.label}
            </p>
            <p style={mutedText}>
              {status.calendar.last_sync
                ? `Ultima sync: ${new Date(status.calendar.last_sync).toLocaleString('it-IT')} · ${status.calendar.event_count} eventi`
                : 'Mai sincronizzato'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handleSync} disabled={syncing} style={outlineBtn}>
                {syncing ? 'Sync…' : 'Sync ora'}
              </button>
              <button onClick={handleDisconnect} style={ghostBtn}>Disconnetti</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ ...mutedText, marginBottom: '1rem', lineHeight: 1.65 }}>
              Google Calendar → Impostazioni → [calendario] → Integra calendario →
              copia <em>Indirizzo segreto in formato iCal</em>.
            </p>
            <input
              type="password"
              value={icsUrl}
              onChange={e => setIcsUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/…"
              autoComplete="off"
              style={inputStyle}
            />
            <button
              onClick={handleConnect}
              disabled={connecting || !icsUrl.trim()}
              style={{ ...outlineBtn, marginTop: '0.75rem', opacity: connecting || !icsUrl.trim() ? 0.5 : 1 }}
            >
              {connecting ? 'Connessione…' : 'Connetti'}
            </button>
          </>
        )}

        {msg && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: msg.ok ? 'var(--pattern)' : 'var(--identita)' }}>
            {msg.text}
          </p>
        )}
      </div>

      {/* ── Apple Health / Hume Band ───────────────────── */}
      <div style={{ ...cardStyle, marginTop: '1rem' }}>
        <p style={{ ...sectionLabel, marginBottom: '1rem' }}>Apple Health · Hume Band</p>
        <p style={{ ...mutedText, lineHeight: 1.65, marginBottom: '1rem' }}>
          Scarica <strong style={{ color: 'var(--text-secondary)' }}>Health Auto Export</strong> su iPhone.
          Crea un&apos;esportazione <em>REST API</em> con questi dati:
        </p>

        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ ...mutedText, marginBottom: '0.3rem' }}>URL endpoint</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={codeStyle}>
              {process.env.NEXT_PUBLIC_APP_URL}/api/biometrics/ingest
            </code>
            <button onClick={() => void copy('url')} style={tinyBtn}>
              {copied === 'url' ? '✓' : 'Copia'}
            </button>
          </div>
        </div>

        <div>
          <p style={{ ...mutedText, marginBottom: '0.3rem' }}>Authorization: Bearer [token]</p>
          {showToken && status?.biometric_token ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <code style={{ ...codeStyle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {status.biometric_token}
              </code>
              <button onClick={() => void copy('token')} style={tinyBtn}>
                {copied === 'token' ? '✓' : 'Copia'}
              </button>
            </div>
          ) : (
            <button onClick={() => void getOrShowToken()} style={outlineBtn}>
              {status?.biometric_token ? 'Mostra token' : 'Genera token'}
            </button>
          )}
        </div>
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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  padding: '1.5rem',
};

const mutedText: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  padding: '0.5rem 0.75rem',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
};

const outlineBtn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '3px',
  background: 'none',
  color: 'var(--text-secondary)',
  padding: '0.45rem 1rem',
  fontSize: '0.82rem',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--text-muted)',
  padding: '0.45rem 0',
  fontSize: '0.82rem',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
};

const tinyBtn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '3px',
  background: 'none',
  color: 'var(--text-muted)',
  padding: '0.25rem 0.6rem',
  fontSize: '0.72rem',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  flexShrink: 0,
};

const codeStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  padding: '0.3rem 0.5rem',
  fontFamily: 'monospace',
  display: 'block',
};
