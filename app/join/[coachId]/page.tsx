import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import JoinButton from './join-button';

interface Props {
  params: Promise<{ coachId: string }>;
}

export default async function JoinCoachPage({ params }: Props) {
  const { coachId } = await params;
  const supabase = await createClient();

  // Load coach info (public — any coach profile is visible here)
  const { data: coach } = await supabase
    .from('profiles')
    .select('id, full_name, role, plan')
    .eq('id', coachId)
    .single();

  if (!coach || (coach.role !== 'coach' && coach.plan !== 'coach')) {
    return (
      <div style={container}>
        <p style={label}>SELF OS</p>
        <h1 style={title}>Link non valido</h1>
        <p style={body}>Questo link coach non esiste o non è più attivo.</p>
        <Link href="/dashboard" style={ctaStyle}>Vai alla dashboard →</Link>
      </div>
    );
  }

  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if already connected
    const { data: existing } = await supabase
      .from('coach_clients')
      .select('id, status')
      .eq('coach_id', coachId)
      .eq('client_id', user.id)
      .single();

    if (existing?.status === 'active') {
      redirect('/dashboard');
    }
  }

  const firstName = coach.full_name?.split(' ')[0] ?? 'il tuo coach';

  return (
    <div style={{ minHeight: '100vh', background: '#08070A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <p style={label}>SELF OS — Invito Coach</p>

        <div style={{
          background: '#0F0E12',
          border: '1px solid #1E1C22',
          borderTop: '2px solid #C9A96E',
          borderRadius: '3px',
          padding: '2.5rem',
          marginTop: '1.5rem',
        }}>
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#4A4035', marginBottom: '0.5rem',
            fontFamily: 'var(--font-dm-sans), Georgia, sans-serif',
          }}>
            Hai ricevuto un invito da
          </p>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.5rem', fontWeight: 'normal',
            color: '#F5F0E8', marginBottom: '1.5rem',
          }}>
            {coach.full_name ?? 'Il tuo coach'}
          </h1>

          <p style={{
            fontSize: '0.9rem', color: '#A89880', lineHeight: 1.75,
            marginBottom: '2rem',
          }}>
            {firstName} ti invita a connettere il tuo profilo SELF OS al suo spazio di coaching.
            I tuoi dati rimarranno privati — {firstName} vedrà solo le metriche aggregate e i pattern attivi.
          </p>

          {user ? (
            <JoinButton coachId={coachId} coachName={coach.full_name ?? ''} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href={`/login?next=/join/${coachId}`}
                style={ctaStyle}
              >
                Accedi per connetterti →
              </Link>
              <Link
                href={`/signup?next=/join/${coachId}`}
                style={{ ...ctaStyle, borderColor: '#1E1C22', color: '#A89880' }}
              >
                Crea un account →
              </Link>
            </div>
          )}
        </div>

        <p style={{
          marginTop: '1.5rem', fontSize: '0.75rem', color: '#4A4035',
          lineHeight: 1.6, textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}>
          Puoi disconnetterti dal coach in qualsiasi momento dalle impostazioni.
        </p>
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
  color: '#C9A96E', marginBottom: '0.5rem',
  fontFamily: 'Georgia, serif',
};

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.75rem',
  fontWeight: 'normal', color: '#F5F0E8', marginBottom: '1rem',
};

const body: React.CSSProperties = {
  fontSize: '0.9rem', color: '#A89880', lineHeight: 1.7, marginBottom: '2rem',
};

const container: React.CSSProperties = {
  minHeight: '100vh', background: '#08070A',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '2rem', maxWidth: '480px', margin: '0 auto',
};

const ctaStyle: React.CSSProperties = {
  display: 'inline-block', padding: '0.875rem 2rem',
  background: 'transparent', border: '1px solid #C9A96E',
  borderRadius: '3px', color: '#C9A96E',
  fontFamily: 'Georgia, serif', fontSize: '0.9rem',
  textDecoration: 'none', letterSpacing: '0.05em',
  textAlign: 'center',
};
