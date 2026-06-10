import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>();

  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '2.5rem' }}>
        <p style={mutedLabel}>ADMIN</p>
        <nav style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          <Link href="/admin" style={subNavLink}>Overview</Link>
          <Link href="/admin/users" style={subNavLink}>Utenti</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const subNavLink: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
};
