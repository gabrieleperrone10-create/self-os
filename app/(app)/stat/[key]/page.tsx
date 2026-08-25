export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import Link from 'next/link';
import { getStatByKey } from '@/lib/stats/data';
import { currentPeriodStart, formatPeriodLabel } from '@/lib/stats/period';
import { fetchStatProgram } from '@/lib/ai/stat-program';
import { StatChart } from './chart';
import { QuickEntryPanel } from './quick-entry-panel';
import { FamilyPanel } from './family-panel';
import { SettingsPanel } from './settings-panel';
import { ProgramPanel } from './program-panel';
import type { StatDefinition } from '@/types';

const AREA_LABEL: Record<string, string> = {
  corpo: 'Corpo', dieta: 'Dieta', lavoro: 'Lavoro',
  relazioni: 'Relazioni', mente: 'Mente', soldi: 'Soldi',
};

export default async function StatDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) redirect('/login');
  const { viewUserId, isImpersonating } = viewContext;

  const stat = await getStatByKey(supabase, viewUserId, key);
  if (!stat) notFound();

  const { definition, points, readouts, current, family, childDefinitions } = stat;

  // Se questa stat è figlia di un risultato, si risale al VFP: la lettura utile
  // è là, non qui.
  let parent: Pick<StatDefinition, 'key' | 'label'> | null = null;
  if (definition.parent_id) {
    const { data } = await supabase
      .from('stat_definitions')
      .select('key, label')
      .eq('id', definition.parent_id)
      .eq('user_id', viewUserId)
      .maybeSingle<Pick<StatDefinition, 'key' | 'label'>>();
    parent = data ?? null;
  }
  const today = currentPeriodStart(definition.period);
  const todaysEntry = points.find((p) => p.periodStart === today);
  const loggedPeriods = new Set(points.map((p) => p.periodStart));

  // Il programma vale per l'ultimo periodo REGISTRATO (non per oggi: se non hai
  // ancora inserito il valore di questa settimana, il programma è quello scritto
  // sull'ultimo dato che esiste).
  const lastPeriod = points.at(-1)?.periodStart ?? null;
  const savedProgram = lastPeriod
    ? await fetchStatProgram(supabase, viewUserId, definition.id, lastPeriod)
    : null;
  // Un programma scritto su una condizione che nel frattempo è cambiata è scaduto.
  const programIsCurrent =
    savedProgram !== null &&
    savedProgram.condition === (current?.condition?.condition ?? null);

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href="/stat" style={backLink}>← Stat</Link>
      <p style={mutedLabel}>{AREA_LABEL[definition.area] ?? definition.area}</p>
      <h1 style={title}>{definition.label}</h1>
      {definition.definition && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.4rem', maxWidth: '480px' }}>
          {definition.definition}
        </p>
      )}

      {parent && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Livello di produzione di{' '}
          <Link href={`/stat/${parent.key}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            {parent.label}
          </Link>
        </p>
      )}

      {points.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem', marginBottom: '2rem' }}>
          Ancora nessun valore registrato.
        </p>
      ) : (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <StatChart
            points={points}
            readouts={readouts}
            period={definition.period}
            unit={definition.unit}
            target={definition.mode === 'maintain' ? definition.target : null}
          />
        </div>
      )}

      {family && (
        <div style={{ marginBottom: '2rem' }}>
          <FamilyPanel family={family} childDefinitions={childDefinitions} />
        </div>
      )}

      {!isImpersonating && lastPeriod && current?.condition && (
        <div style={{ marginBottom: '2rem' }}>
          <ProgramPanel
            statKey={definition.key}
            existing={programIsCurrent ? savedProgram!.program : null}
            periodLabel={formatPeriodLabel(definition.period, lastPeriod)}
          />
        </div>
      )}

      {!isImpersonating && (
        <QuickEntryPanel
          statId={definition.id}
          unit={definition.unit}
          period={definition.period}
          currentValue={todaysEntry?.value ?? null}
          loggedPeriods={loggedPeriods}
        />
      )}

      {!isImpersonating && <SettingsPanel definition={definition} />}
    </div>
  );
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: '1.8rem',
  fontWeight: 'normal', color: 'var(--text-primary)', marginTop: '0.4rem',
};

const backLink: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.82rem', color: 'var(--text-muted)',
  textDecoration: 'none', marginBottom: '1.5rem',
};
