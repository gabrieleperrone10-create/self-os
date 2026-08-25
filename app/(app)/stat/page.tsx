export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import { listStatsWithReadout } from '@/lib/stats/data';
import { currentPeriodStart } from '@/lib/stats/period';
import { buildReadoutCopy, CONDITION_LABEL } from '@/lib/stats/copy';
import { buildFamilyCopy, ROLE_LABEL_SHORT } from '@/lib/stats/family-copy';
import { CONDITION_COLOR } from '@/lib/stats/colors';
import { MAX_ACTIVE_STATS } from '@/lib/stats/catalog';
import { Sparkline } from './sparkline';
import { QuickEntry } from './quick-entry';

const AREA_LABEL: Record<string, string> = {
  corpo: 'Corpo', dieta: 'Dieta', lavoro: 'Lavoro',
  relazioni: 'Relazioni', mente: 'Mente', soldi: 'Soldi',
};

/** Il valore già registrato nel periodo corrente PER IL FIGLIO — non per il VFP. */
function childTodaysValue(
  stats: Awaited<ReturnType<typeof listStatsWithReadout>>,
  childDef: import('@/types').StatDefinition,
): number | null {
  const child = stats.find((s) => s.definition.id === childDef.id);
  if (!child) return null;
  const today = currentPeriodStart(childDef.period);
  return child.points.find((p) => p.periodStart === today)?.value ?? null;
}

export default async function StatPage() {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) return null;
  const { viewUserId, isImpersonating } = viewContext;

  const stats = await listStatsWithReadout(supabase, viewUserId);
  const canAdd = stats.length < MAX_ACTIVE_STATS;

  // Le stat figlie non aprono una propria sezione area: si vedono annidate sotto
  // il VFP di cui fanno parte, indipendentemente dall'area a cui appartengono
  // loro stesse (es. "Aderenza nutrizionale" è area 'dieta' ma vive sotto un
  // VFP 'corpo'). Restano comunque raggiungibili da /stat/[key] direttamente.
  const topLevel = stats.filter((s) => s.definition.parent_id === null);

  const byArea = topLevel.reduce<Record<string, typeof topLevel>>((acc, s) => {
    (acc[s.definition.area] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>Statistica applicata all&apos;identità</p>
        <h1 style={pageTitle}>Stat</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginTop: '0.5rem', maxWidth: '520px' }}>
          Condizione e tendenza per ogni cosa che tieni sotto osservazione. La condizione
          si legge dal periodo scorso, la tendenza da più periodi — quando sono in
          disaccordo, è quella l&apos;informazione. Max {MAX_ACTIVE_STATS} stat attive.
        </p>
      </div>

      {stats.length === 0 ? (
        <div style={emptyCard}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Nessuna stat definita ancora.
          </p>
          {!isImpersonating && (
            <Link href="/stat/new" style={goldBtn}>Definisci la prima stat →</Link>
          )}
        </div>
      ) : (
        <>
          {Object.entries(byArea).map(([area, areaStats]) => (
            <div key={area} style={{ marginBottom: '2.5rem' }}>
              <p style={{ ...mutedLabel, marginBottom: '1rem' }}>{AREA_LABEL[area] ?? area}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {areaStats.map(({ definition, points, current, family, childDefinitions }) => {
                  const copy = buildReadoutCopy(
                    current ?? { condition: null, trend: null, divergence: 'no_trend', formula: null, provisional: true },
                    { unit: definition.unit }
                  );
                  const chipColor = current?.condition ? CONDITION_COLOR[current.condition.condition] : 'var(--text-muted)';
                  const today = currentPeriodStart(definition.period);
                  const todaysEntry = points.find((p) => p.periodStart === today);

                  return (
                    <div key={definition.id} style={card}>
                      <Link href={`/stat/${definition.key}`} style={{ textDecoration: 'none' }}>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                          {definition.label}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: chipColor, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.78rem', color: chipColor }}>
                            {copy.conditionLabel ?? 'In raccolta'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          {copy.trendLabel ? `Tendenza ${copy.trendLabel}` : 'senza tendenza ancora'}
                        </p>
                        {points.length >= 2 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <Sparkline values={points.slice(-13).map((p) => p.value)} color={chipColor} />
                          </div>
                        )}
                      </Link>
                      {!isImpersonating && (
                        <QuickEntry statId={definition.id} unit={definition.unit} initialValue={todaysEntry?.value ?? null} compact />
                      )}

                      {family && (
                        <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                          <Link href={`/stat/${definition.key}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                              {buildFamilyCopy(family).title}
                            </p>
                          </Link>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {family.children.map((c) => {
                              const childDef = childDefinitions.find((d) => d.id === c.id);
                              const cond = c.readout?.condition?.condition ?? null;
                              const color = cond ? CONDITION_COLOR[cond] : 'var(--text-muted)';
                              return (
                                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                      {ROLE_LABEL_SHORT[c.role]}
                                    </span>
                                    <Link href={childDef ? `/stat/${childDef.key}` : '#'} style={{ fontSize: '0.82rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                      {c.label}
                                    </Link>
                                    <span style={{ fontSize: '0.72rem', color, marginLeft: 'auto' }}>
                                      {c.missingLatest ? 'da registrare' : cond ? CONDITION_LABEL[cond] : 'in raccolta'}
                                    </span>
                                  </div>
                                  {!isImpersonating && childDef && (
                                    <div style={{ paddingLeft: '0.85rem' }}>
                                      <QuickEntry
                                        statId={childDef.id}
                                        unit={childDef.unit}
                                        initialValue={childTodaysValue(stats, childDef)}
                                        compact
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {canAdd && !isImpersonating && (
            <Link href="/stat/new" style={goldLink}>+ Nuova stat</Link>
          )}
        </>
      )}
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '2rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginTop: '0.5rem',
};

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '1.25rem 1.5rem',
};

const emptyCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '3px', padding: '2rem', maxWidth: '480px',
};

const goldLink: React.CSSProperties = {
  fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none',
  fontFamily: 'Georgia, serif', letterSpacing: '0.03em',
};

const goldBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.625rem 1.25rem',
  border: '1px solid var(--gold)', borderRadius: '3px',
  color: 'var(--gold)', fontFamily: 'Georgia, serif',
  fontSize: '0.875rem', textDecoration: 'none', letterSpacing: '0.05em',
};
