import Link from 'next/link';

interface PaywallProps {
  feature: string;
  title?: string;
  description?: string;
}

const FEATURE_LABELS: Record<string, { title: string; description: string }> = {
  mirror: {
    title: 'Mirror Decisionale',
    description: 'Vedi i pattern nelle tue decisioni nel tempo. Riconosci da dove decidi — paura o visione.',
  },
  identity_map: {
    title: 'Identity Map',
    description: 'Visualizza la tua evoluzione psicologica in 30 giorni. Grafici, pattern, heatmap.',
  },
  pattern_analysis: {
    title: 'Pattern Recognition AI',
    description: "Claude analizza i tuoi check-in e identifica i pattern ricorrenti nella tua identità.",
  },
};

export function Paywall({ feature, title, description }: PaywallProps) {
  const label = FEATURE_LABELS[feature] ?? { title: title ?? 'Funzionalità Pro', description: description ?? '' };

  return (
    <div style={{ maxWidth: '520px' }}>
      {/* Lock indicator */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>PIANO PRO</p>
        <h1 style={pageTitle}>{label.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Disponibile dal piano Pro
        </p>
      </div>

      {/* Paywall card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: '2px solid var(--gold)',
        borderRadius: '3px',
        padding: '2.5rem',
      }}>
        {/* Lock icon */}
        <div style={{
          width: '40px', height: '40px',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.75rem',
          color: 'var(--gold)',
          fontSize: '1.1rem',
        }}>
          ◇
        </div>

        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.1rem',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}>
          {label.description}
        </p>

        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}>
          Questa funzionalità è inclusa nel piano Pro — insieme all&apos;Identity Map,
          al Pattern Recognition AI e ai check-in illimitati.
        </p>

        {/* Features preview */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          marginBottom: '2rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {[
            'Mirror decisionale illimitato',
            'Identity Map completa',
            'Pattern recognition AI',
            'Check-in illimitati',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>✦</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>

        <Link
          href="/settings?upgrade=pro"
          style={{
            display: 'inline-block',
            padding: '0.875rem 2rem',
            background: 'transparent',
            border: '1px solid var(--gold)',
            borderRadius: '3px',
            color: 'var(--gold)',
            fontFamily: 'Georgia, serif',
            fontSize: '0.9rem',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            transition: 'all 0.4s ease',
          }}
          className="btn-gold-hover"
        >
          Passa a Pro — €19/mese →
        </Link>
      </div>
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
  marginBottom: '0.25rem',
};
