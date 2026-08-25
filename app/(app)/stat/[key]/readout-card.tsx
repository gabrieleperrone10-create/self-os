// Le tre sezioni sempre presenti (piano §5.1): CONDIZIONE, TENDENZA, COSA FARE
// ORA. Nessun hook, nessuno stato — puramente presentazionale, per questo può
// essere importato sia da un server component sia dal client chart.tsx.

import type { ReadoutCopy } from '@/lib/stats/copy';

export function ReadoutCard({ copy, periodLabel }: { copy: ReadoutCopy; periodLabel: string }) {
  return (
    <div style={card}>
      <p style={{ ...sectionLabel, marginBottom: '0.5rem' }}>{periodLabel}</p>

      <Section label="Condizione">
        {copy.conditionLabel ? (
          <>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              {copy.conditionLabel}
            </p>
            {copy.conditionDelta && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {copy.conditionDelta}
              </p>
            )}
            {copy.conditionSentence && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.6 }}>
                {copy.conditionSentence}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Serve almeno un secondo periodo.</p>
        )}
      </Section>

      <Section label="Tendenza">
        {copy.trendLabel ? (
          <>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {copy.trendLabel}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {copy.trendSentence}
            </p>
          </>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Non ancora leggibile — servono più periodi.
          </p>
        )}
      </Section>

      <Section label="Cosa fare ora" last>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--gold)', marginBottom: '0.6rem' }}>
          {copy.actionTitle}
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {copy.actionSteps.map((step, i) => (
            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {step}
            </li>
          ))}
        </ol>
        {copy.actionNote && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem', fontStyle: 'italic' }}>
            {copy.actionNote}
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      padding: '1.1rem 0',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <p style={sectionLabel}>{label}</p>
      <div style={{ marginTop: '0.5rem' }}>{children}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '0 1.5rem',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};
