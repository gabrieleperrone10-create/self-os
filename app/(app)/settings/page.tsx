import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/types';
import { PLANS } from '@/lib/stripe/plans';
import { SettingsActions } from './actions';
import { DataSection } from './data-section';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const currentPlan = profile?.plan ?? 'free';

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>IMPOSTAZIONI</p>
        <h1 style={pageTitle}>Account e piano</h1>
      </div>

      {/* Account info */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          padding: '1.5rem',
          maxWidth: '480px',
          marginBottom: '2.5rem',
        }}
      >
        <p style={sectionLabel}>Account</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontFamily: 'Georgia, serif' }}>
          {profile?.full_name ?? '—'}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {profile?.email ?? user.email}
        </p>
      </div>

      {/* Plans */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ ...mutedLabel, marginBottom: '1.5rem' }}>Piano attuale e upgrade</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', maxWidth: '820px' }}>
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan;
            const borderColor = isCurrent ? 'var(--gold)' : 'var(--border)';

            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${isCurrent ? 'var(--gold)' : plan.highlight ? 'var(--pattern)' : 'var(--border)'}`,
                  borderRadius: '3px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                {isCurrent && (
                  <span style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    fontSize: '0.6rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                    padding: '0.2rem 0.5rem',
                    border: '1px solid var(--gold)',
                    borderRadius: '2px',
                  }}>
                    Attivo
                  </span>
                )}

                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {plan.label}
                </h3>
                <p style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif', color: 'var(--gold)', marginBottom: '1.25rem' }}>
                  {plan.price === 0 ? 'Gratis' : `€${plan.price}/mo`}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--pattern)', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <SettingsActions
                    plan={plan.id}
                    hasBilling={!!profile?.stripe_customer_id}
                    currentPlan={currentPlan}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing portal */}
      {profile?.stripe_customer_id && (
        <div style={{ maxWidth: '480px' }}>
          <p style={{ ...mutedLabel, marginBottom: '1rem' }}>Fatturazione</p>
          <SettingsActions plan={currentPlan} hasBilling={true} currentPlan={currentPlan} portalOnly />
        </div>
      )}

      {/* Notifiche + dati (GDPR) */}
      <DataSection emailReminders={(profile as unknown as { email_reminders?: boolean })?.email_reminders !== false} />
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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '1rem',
};
