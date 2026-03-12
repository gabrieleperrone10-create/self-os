'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type OnboardingData = {
  hasScan: boolean;
  hasCheckin: boolean;
  hasMirror: boolean;
};

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData>({ hasScan: false, hasCheckin: false, hasMirror: false });
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [scanRes, checkinRes, mirrorRes] = await Promise.all([
        supabase.from('scans').select('id').eq('user_id', user.id).limit(1),
        supabase.from('checkins').select('id').eq('user_id', user.id).limit(1),
        supabase.from('decisions').select('id').eq('user_id', user.id).limit(1),
      ]);

      setData({
        hasScan: (scanRes.data?.length ?? 0) > 0,
        hasCheckin: (checkinRes.data?.length ?? 0) > 0,
        hasMirror: (mirrorRes.data?.length ?? 0) > 0,
      });
      setLoaded(true);
    }
    load();
  }, [router]);

  const steps = [
    {
      key: 'scan',
      done: data.hasScan,
      label: 'Scan iniziale',
      desc: 'Rispondi alle 8 domande fondamentali. Scopri il tuo pattern ombra, la ferita core e la tua zona di espansione.',
      href: '/scan',
      cta: 'Inizia lo Scan',
      color: 'var(--identita)',
      number: '01',
    },
    {
      key: 'checkin',
      done: data.hasCheckin,
      label: 'Primo Check-in',
      desc: 'Registra il tuo stato interno. Mattina o sera — ogni giorno, un dato su chi stai diventando.',
      href: '/checkin',
      cta: 'Fai il Check-in',
      color: 'var(--stato)',
      number: '02',
    },
    {
      key: 'mirror',
      done: data.hasMirror,
      label: 'Mirror decisionale',
      desc: 'Porta una decisione reale. Il Mirror riflette da dove stai decidendo — paura o visione.',
      href: '/mirror',
      cta: 'Apri il Mirror',
      color: 'var(--credenze)',
      number: '03',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === 3;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>SELF OS — Avvio</p>
        <h1 style={pageTitle}>
          {allDone ? 'Sistema attivato.' : 'Attiva il tuo sistema'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', lineHeight: 1.7 }}>
          {allDone
            ? 'Hai completato i tre moduli fondamentali. Il tuo SELF OS è operativo.'
            : '3 passi fondamentali per iniziare. Puoi completarli in qualsiasi ordine.'}
        </p>
      </div>

      {/* Progress bar */}
      {!allDone && loaded && (
        <div style={{ marginBottom: '3rem', maxWidth: '480px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              PROGRESSO
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>
              {completedCount}/3
            </span>
          </div>
          <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px' }}>
            <div
              style={{
                height: '100%',
                width: `${(completedCount / 3) * 100}%`,
                background: 'var(--gold)',
                borderRadius: '1px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px' }}>
        {steps.map(step => (
          <div
            key={step.key}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${step.done ? step.color : 'var(--border)'}`,
              borderLeft: `2px solid ${step.done ? step.color : 'var(--border)'}`,
              borderRadius: '3px',
              padding: '1.5rem 2rem',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'Georgia, serif', color: step.done ? step.color : 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  {step.number}
                </span>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: step.done ? step.color : 'var(--text-muted)' }}>
                  {step.label}
                </p>
              </div>
              {step.done && (
                <span style={{ fontSize: '0.8rem', color: step.color }}>✓</span>
              )}
            </div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.7, marginBottom: step.done ? 0 : '1.25rem' }}>
              {step.desc}
            </p>
            {!step.done && (
              <Link
                href={step.href}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1.25rem',
                  border: `1px solid ${step.color}`,
                  borderRadius: '3px',
                  color: step.color,
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  transition: 'all 0.3s ease',
                }}
              >
                {step.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div style={{ marginTop: '2.5rem' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.625rem 1.5rem',
              border: '1px solid var(--gold)',
              borderRadius: '3px',
              color: 'var(--gold)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.875rem',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Vai alla Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.5rem',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginBottom: '0.75rem',
};
