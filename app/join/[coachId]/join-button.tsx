'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinButton({ coachId, coachName }: { coachId: string; coachName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleJoin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/coach/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId }),
      });
      const data = await res.json() as { connected?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore');
      router.push('/dashboard?coach_connected=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p style={{ color: '#B45454', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          width: '100%', padding: '0.875rem 2rem',
          background: 'transparent', border: '1px solid #C9A96E',
          borderRadius: '3px', color: loading ? '#4A4035' : '#C9A96E',
          fontFamily: 'Georgia, serif', fontSize: '0.9rem',
          letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.4s ease',
        }}
      >
        {loading ? 'Connessione...' : `Connettiti a ${coachName.split(' ')[0]} →`}
      </button>
    </div>
  );
}
