import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Profile, Checkin, Pattern } from '@/types';
import { averageStateScore } from '@/lib/utils/checkin';
import { InviteLink } from './invite-link';

interface ClientRow {
  id: string;
  client_id: string;
  status: string;
  profiles: Profile;
}

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Only coaches can access this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user.id)
    .single<Profile>();

  if (profile?.role !== 'coach' && profile?.plan !== 'coach') {
    redirect('/settings');
  }

  // Fetch clients with their profiles
  const { data: clientRows } = await supabase
    .from('coach_clients')
    .select('id, client_id, status, profiles(*)')
    .eq('coach_id', user.id)
    .eq('status', 'active');

  const clients = (clientRows ?? []) as unknown as ClientRow[];

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>COACH LAYER</p>
        <h1 style={pageTitle}>I tuoi clienti</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {clients.length} {clients.length === 1 ? 'cliente attivo' : 'clienti attivi'}
        </p>
      </div>

      {/* Invite link — always visible */}
      <InviteLink coachId={user.id} />

      {clients.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          padding: '2rem',
          maxWidth: '480px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
            Nessun cliente attivo ancora. Condividi il link sopra per iniziare.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
          {clients.map(row => (
            <ClientCard key={row.client_id} clientId={row.client_id} profile={row.profiles} />
          ))}
        </div>
      )}
    </div>
  );
}

async function ClientCard({ clientId, profile }: { clientId: string; profile: Profile }) {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [checkinsRes, patternsRes, scanRes] = await Promise.all([
    supabase
      .from('checkins')
      .select('*')
      .eq('user_id', clientId)
      .gte('date', sevenDaysAgo),
    supabase
      .from('patterns')
      .select('title, type')
      .eq('user_id', clientId)
      .eq('is_active', true)
      .limit(3),
    supabase
      .from('scans')
      .select('completed_at')
      .eq('user_id', clientId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const patterns = patternsRes.data ?? [];
  const scan = scanRes.data;
  const avgScore = averageStateScore(checkins);
  const firstName = profile.full_name?.split(' ')[0] ?? 'Cliente';

  return (
    <Link
      href={`/coach/${clientId}`}
      style={{
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        padding: '1.5rem',
        textDecoration: 'none',
        transition: 'border-color 0.3s ease',
      }}
      className="card-hover"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {profile.full_name ?? 'Cliente'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.email}</p>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem' }}>
        <Metric
          label="Stato medio 7gg"
          value={avgScore !== null ? `${avgScore}/10` : '—'}
          color="var(--stato)"
        />
        <Metric
          label="Check-in 7gg"
          value={String(checkins.length)}
          color="var(--pattern)"
        />
        <Metric
          label="Pattern attivi"
          value={String(patterns.length)}
          color="var(--identita)"
        />
        <Metric
          label="Scan"
          value={scan ? '✓' : '—'}
          color="var(--credenze)"
        />
      </div>

      {patterns.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {patterns.map((p, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                color: 'var(--text-muted)',
              }}
            >
              {p.title}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color }}>
        {value}
      </p>
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginBottom: '0.25rem',
};
