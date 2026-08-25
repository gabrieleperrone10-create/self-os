// Lettura di famiglia sul dettaglio di un VFP (piano §7 / F7): i livelli di
// produzione affiancati al risultato, la diagnosi di quale sta cedendo, e le
// associazioni osservate quando c'è abbastanza storico.

import Link from 'next/link';
import type { StatDefinition } from '@/types';
import type { FamilyReadout } from '@/lib/stats/family';
import { associationSentence, buildFamilyCopy, ROLE_LABEL } from '@/lib/stats/family-copy';
import { CONDITION_LABEL } from '@/lib/stats/copy';
import { CONDITION_COLOR } from '@/lib/stats/colors';

export function FamilyPanel({
  family,
  childDefinitions,
}: {
  family: FamilyReadout;
  childDefinitions: StatDefinition[];
}) {
  const copy = buildFamilyCopy(family);
  const keyById = new Map(childDefinitions.map((c) => [c.id, c.key]));
  const associations = family.associations
    .map((a) => ({ a, sentence: associationSentence(a) }))
    .filter((x) => x.sentence !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Livelli di produzione */}
      <div style={card}>
        <p style={sectionLabel}>Livelli di produzione</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.9rem' }}>
          {family.children.map((c) => {
            const condition = c.readout?.condition?.condition ?? null;
            const color = condition ? CONDITION_COLOR[condition] : 'var(--text-muted)';
            const childKey = keyById.get(c.id);
            const isCulprit = family.culprit?.id === c.id;
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: '0.75rem',
                  paddingLeft: '0.75rem',
                  borderLeft: `2px solid ${isCulprit ? color : 'transparent'}`,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, transform: 'translateY(-1px)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {ROLE_LABEL[c.role]}
                  </p>
                  {childKey ? (
                    <Link href={`/stat/${childKey}`} style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.label}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.78rem', color, flexShrink: 0 }}>
                  {c.missingLatest ? 'non registrato' : condition ? CONDITION_LABEL[condition] : 'in raccolta'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnosi */}
      <div style={{ ...card, borderLeft: '2px solid var(--gold)' }}>
        <p style={sectionLabel}>Cosa sta portando il risultato</p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.6rem' }}>
          {copy.title}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '0.5rem' }}>
          {copy.body}
        </p>
        {copy.steps.length > 0 && (
          <ol style={{ margin: '1rem 0 0', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {copy.steps.map((step, i) => (
              <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</li>
            ))}
          </ol>
        )}
        {copy.note && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.8rem', fontStyle: 'italic', lineHeight: 1.6 }}>
            {copy.note}
          </p>
        )}
      </div>

      {/* Associazioni osservate */}
      {associations.length > 0 && (
        <div style={card}>
          <p style={sectionLabel}>Cosa muove davvero l&apos;ago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.8rem' }}>
            {associations.map(({ a, sentence }) => (
              <p key={a.childId} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {sentence}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.25rem 1.5rem',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};
