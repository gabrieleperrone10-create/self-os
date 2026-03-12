import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Profile, Checkin, Pattern, Scan, Decision } from '@/types';
import { averageStateScore, calculateStreak } from '@/lib/utils/checkin';
import { CoachNotes } from './coach-notes';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify this coach has access to this client
  const { data: relation } = await supabase
    .from('coach_clients')
    .select('id, notes')
    .eq('coach_id', user.id)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single();

  if (!relation) notFound();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [profileRes, checkinsRes, patternsRes, scanRes, decisionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', clientId).single<Profile>(),
    supabase.from('checkins').select('*').eq('user_id', clientId).gte('date', thirtyDaysAgo).order('date', { ascending: false }),
    supabase.from('patterns').select('*').eq('user_id', clientId).eq('is_active', true),
    supabase.from('scans').select('*').eq('user_id', clientId).order('completed_at', { ascending: false }).limit(1).single<Scan>(),
    supabase.from('decisions').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(5),
  ]);

  const profile = profileRes.data;
  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = scanRes.data;
  const decisions = (decisionsRes.data ?? []) as Decision[];

  const avgScore = averageStateScore(checkins);
  const streak = calculateStreak(checkins);

  return (
    <div>
      {/* Back */}
      <a href="/coach" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
        ← Tutti i clienti
      </a>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>CLIENTE</p>
        <h1 style={pageTitle}>{profile?.full_name ?? 'Cliente'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile?.email}</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem', maxWidth: '720px' }}>
        {[
          { label: 'Stato medio 30gg', value: avgScore !== null ? `${avgScore}/10` : '—', color: 'var(--stato)' },
          { label: 'Check-in 30gg', value: String(checkins.length), color: 'var(--pattern)' },
          { label: 'Streak', value: streak > 0 ? `${streak}gg` : '—', color: 'var(--gold)' },
          { label: 'Pattern attivi', value: String(patterns.length), color: 'var(--identita)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `2px solid ${m.color}`, borderRadius: '3px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: m.color, marginBottom: '0.5rem' }}>{m.label}</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '920px' }}>
        {/* Scan analysis */}
        {scan?.analysis && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
            <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Scan iniziale</p>
            {(['shadow_pattern', 'core_wound', 'expansion_zone', 'next_edge'] as const).map(key => {
              const section = scan.analysis![key] as { title: string; description: string };
              const colors: Record<string, string> = {
                shadow_pattern: 'var(--identita)',
                core_wound: 'var(--credenze)',
                expansion_zone: 'var(--pattern)',
                next_edge: 'var(--stato)',
              };
              return (
                <div key={key} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: colors[key], marginBottom: '0.25rem' }}>
                    {key.replace('_', ' ')}
                  </p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {section.title}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent decisions */}
        <div>
          {decisions.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Decisioni recenti</p>
              {decisions.map(d => (
                <div key={d.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                    {d.description}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stato: {d.state_score}/10</span>
                    {d.origin && (
                      <span style={{ fontSize: '0.7rem', color: d.origin === 'fear' ? '#B45454' : 'var(--pattern)' }}>
                        {d.origin === 'fear' ? 'Paura' : 'Visione'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active patterns */}
          {patterns.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Pattern attivi</p>
              {patterns.map(p => (
                <div key={p.id} style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{p.type}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>{p.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Coach notes — private */}
          <CoachNotes
            relationId={relation.id}
            initialNotes={relation.notes ?? ''}
          />
        </div>
      </div>
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
