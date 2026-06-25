'use client';

import { useTheme, type Theme } from '@/components/shared/theme-provider';

const themes: { id: Theme; label: string; description: string }[] = [
  { id: 'scuro', label: 'Scuro', description: 'Raffinato, diretto' },
  { id: 'rituale', label: 'Rituale', description: 'Contemplativo, calmo' },
];

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ marginBottom: '3rem', maxWidth: '480px' }}>
      <p style={sectionLabel}>ASPETTO</p>
      <p style={sectionHint}>Scegli come vuoi vivere Self OS</p>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        {themes.map(t => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                flex: 1,
                background: active ? 'var(--surface)' : 'transparent',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '1.25rem 1rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.3s ease',
              }}
            >
              <ThemePreview themeId={t.id} />
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                margin: '0.75rem 0 0.25rem',
              }}>
                {t.label}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                {t.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemePreview({ themeId }: { themeId: Theme }) {
  const isRituale = themeId === 'rituale';

  const bg = isRituale ? '#eef1ea' : '#0A0806';
  const surface = isRituale ? 'rgba(255,255,255,0.55)' : '#120F0A';
  const accent = isRituale ? '#5f8366' : '#C9A96E';
  const line = isRituale ? 'rgba(95,131,102,0.18)' : '#1E1812';
  const text = isRituale ? '#2a312a' : '#F5F0E8';
  const muted = isRituale ? '#8b9488' : '#4A4035';
  const r = isRituale ? 8 : 2;

  return (
    <div style={{
      width: '100%',
      height: 72,
      background: bg,
      borderRadius: r,
      border: `1px solid ${line}`,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${accent}` }} />
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: muted, opacity: 0.5 }} />
      </div>
      <div style={{
        flex: 1,
        background: surface,
        borderRadius: r / 2,
        border: `1px solid ${line}`,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}>
        <div style={{ width: '60%', height: 3, borderRadius: 1, background: text, opacity: 0.4 }} />
        <div style={{ width: '40%', height: 3, borderRadius: 1, background: accent, opacity: 0.6 }} />
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.25rem',
};

const sectionHint: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  margin: 0,
};
