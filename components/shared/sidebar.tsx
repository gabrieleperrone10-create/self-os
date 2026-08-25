'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Map,
  GitFork,
  Users,
  Settings,
  ScanLine,
  LogOut,
  BookOpen,
  FlaskConical,
  Zap,
  Footprints,
  Menu,
  X,
  Shield,
  Activity,
  Gauge,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { useViewAs } from './view-as-context';

const mainNav = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/checkin',      label: 'Check-in',      icon: CalendarCheck },
  { href: '/identity-map', label: 'Identity Map',  icon: Map },
  { href: '/distanza',     label: 'Distanza',      icon: Footprints },
  { href: '/biometrics',  label: 'Corpo',         icon: Activity },
  { href: '/mirror',       label: 'Mirror',        icon: GitFork },
  { href: '/lab',          label: 'Lab',           icon: FlaskConical },
  { href: '/stat',         label: 'Stat',          icon: Gauge },
  { href: '/segnali',      label: 'Segnali',       icon: Zap },
  { href: '/letters',      label: 'Lettere',       icon: BookOpen },
];

const mobileBottomNav = [
  { href: '/dashboard',    label: 'Home',     icon: LayoutDashboard },
  { href: '/checkin',      label: 'Check-in', icon: CalendarCheck },
  { href: '/mirror',       label: 'Mirror',   icon: GitFork },
  { href: '/lab',          label: 'Lab',      icon: FlaskConical },
  { href: '/segnali',      label: 'Segnali',  icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<UserRole>('user');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isImpersonating } = useViewAs();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) setRole(data.role as UserRole);
        });
    });
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className={`mobile-menu-btn${isImpersonating ? ' shifted-down' : ''}`}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Menu"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 110,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          padding: '0.5rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
      </button>

      {/* Mobile overlay */}
      <div
        className={`app-sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={asideStyle}>
        {/* Logo */}
        <div style={{ padding: '0 1.5rem 2.5rem' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={logoStyle}>SELF OS</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          {mainNav.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} icon={<Icon size={16} strokeWidth={1.5} />} active={isActive(href)} />
          ))}

          {/* Scan */}
          <NavLink href="/scan" label="Scan iniziale" icon={<ScanLine size={16} strokeWidth={1.5} />} active={isActive('/scan')} />

          {/* Coach — only for coach role, nascosto in modalità "Entra come utente" */}
          {!isImpersonating && (role === 'coach' || role === 'admin') && (
            <NavLink href="/coach" label="Clienti" icon={<Users size={16} strokeWidth={1.5} />} active={isActive('/coach')} />
          )}

          {/* Admin — only for admin role, nascosto in modalità "Entra come utente" */}
          {!isImpersonating && role === 'admin' && (
            <NavLink href="/admin" label="Admin" icon={<Shield size={16} strokeWidth={1.5} />} active={isActive('/admin')} />
          )}
        </nav>

        {/* Bottom: settings + logout */}
        <div style={{ padding: '0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink href="/settings" label="Impostazioni" icon={<Settings size={16} strokeWidth={1.5} />} active={isActive('/settings')} muted />

          <button onClick={handleSignOut} style={signOutStyle}>
            <LogOut size={16} strokeWidth={1.5} />
            Esci
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {mobileBottomNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.5rem 0.25rem',
                textDecoration: 'none',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '0.55rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                borderTop: active ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'color 0.2s ease, border-color 0.2s ease',
                minHeight: '56px',
              }}
            >
              <Icon size={22} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function NavLink({
  href,
  label,
  icon,
  active,
  muted,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '3px',
        textDecoration: 'none',
        fontSize: '0.875rem',
        color: active ? 'var(--gold)' : muted ? 'var(--text-muted)' : 'var(--text-secondary)',
        backgroundColor: active ? 'color-mix(in srgb, var(--gold) 8%, transparent)' : 'transparent',
        border: active ? '1px solid color-mix(in srgb, var(--gold) 15%, transparent)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const asideStyle: React.CSSProperties = {
  width: '220px',
  minHeight: '100vh',
  backgroundColor: 'var(--surface)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  padding: '2rem 0',
};

const logoStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '1.1rem',
  color: 'var(--gold)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const signOutStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.625rem 0.75rem',
  width: '100%',
  background: 'none',
  border: '1px solid transparent',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
  fontFamily: 'Georgia, serif',
  transition: 'color 0.3s ease',
};
