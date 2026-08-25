// Layer di lettura per il modulo STAT — l'unico punto dove `lib/stats/engine.ts`
// (puro) incontra Supabase. Nessuna cache: per il volume di un tracker
// personale (poche centinaia di punti per stat, nel caso più estremo) ricalcolare
// a ogni richiesta è più semplice e più corretto di tenere allineata una tabella
// di readings — niente storico di lettura da invalidare quando una entry viene
// modificata o cancellata.
//
// Semplificazione dichiarata: i periodi senza una entry vengono ESCLUSI, non
// trattati come zero — un periodo saltato in un tracker manuale non significa
// "produzione nulla", significa "non registrato" (piano §9: "nessuna penalità
// per un periodo saltato"). L'ordinale nel motore (Theil–Sen usa l'indice, non
// la data reale) è quindi la sequenza dei periodi EFFETTIVAMENTE loggati.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StatDefinition, StatEntry } from '@/types';
import { computeReadoutSeries, type StatOptions, type StatReadout } from './engine';
import { readFamily, type FamilyChildInput, type FamilyReadout } from './family';

export interface StatSeriesPoint {
  periodStart: string;
  value: number;
  estimated: boolean;
}

export interface StatWithReadout {
  definition: StatDefinition;
  points: StatSeriesPoint[];
  readouts: StatReadout[];
  /** readouts.at(-1) — la lettura corrente, comodo per la board. */
  current: StatReadout | null;
  /** Le definizioni dei figli, quando questa stat è un VFP. */
  childDefinitions: StatDefinition[];
  /** Lettura di famiglia: presente solo se la stat ha figli con dati (§7). */
  family: FamilyReadout | null;
}

function toOptions(def: StatDefinition): StatOptions {
  return { direction: def.direction, mode: def.mode, target: def.target };
}

/**
 * Attacca famiglia e figli a una stat già costruita, dato l'intero set di
 * definizioni/entries dell'utente (già in memoria, nessuna query in più —
 * usato sia dalla board che dal dettaglio).
 */
function attachFamily(
  stat: StatWithReadout,
  allDefs: readonly StatDefinition[],
  byStat: Map<string, StatEntry[]>,
): StatWithReadout {
  const childDefs = allDefs.filter((d) => d.parent_id === stat.definition.id);
  if (childDefs.length === 0) return stat;

  const childInputs: FamilyChildInput[] = childDefs
    .filter((c) => c.role !== null)
    .map((c) => ({
      id: c.id,
      label: c.label,
      role: c.role!,
      period: c.period,
      aggregation: c.aggregation,
      options: toOptions(c),
      entries: (byStat.get(c.id) ?? []).map((e) => ({ periodStart: e.period_start, value: e.value })),
    }));

  const family =
    childInputs.length > 0 && stat.points.length > 0
      ? readFamily(
          stat.points.map((p) => ({ periodStart: p.periodStart, value: p.value })),
          stat.definition.period,
          toOptions(stat.definition),
          childInputs,
        )
      : null;

  return { ...stat, childDefinitions: childDefs, family };
}

/**
 * Tutte le stat attive di un utente, con la lettura corrente e la famiglia
 * calcolate. Le stat figlie (`parent_id` non null) sono incluse nell'elenco:
 * decide il chiamante se mostrarle a sé o annidate sotto il genitore.
 */
export async function listStatsWithReadout(
  supabase: SupabaseClient,
  userId: string,
): Promise<StatWithReadout[]> {
  const { data: definitions } = await supabase
    .from('stat_definitions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  const defs = (definitions ?? []) as StatDefinition[];
  if (defs.length === 0) return [];

  const { data: entries } = await supabase
    .from('stat_entries')
    .select('*')
    .in('stat_id', defs.map((d) => d.id))
    .order('period_start', { ascending: true });

  const byStat = new Map<string, StatEntry[]>();
  for (const e of (entries ?? []) as StatEntry[]) {
    const arr = byStat.get(e.stat_id) ?? [];
    arr.push(e);
    byStat.set(e.stat_id, arr);
  }

  return defs.map((definition) =>
    attachFamily(buildStatWithReadout(definition, byStat.get(definition.id) ?? []), defs, byStat),
  );
}

/** Una singola stat per key, con l'intera cronologia di readout (§5.1: selezionare un punto). */
export async function getStatByKey(
  supabase: SupabaseClient,
  userId: string,
  key: string,
): Promise<StatWithReadout | null> {
  const { data: definition } = await supabase
    .from('stat_definitions')
    .select('*')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle<StatDefinition>();

  if (!definition) return null;

  const { data: children } = await supabase
    .from('stat_definitions')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_id', definition.id)
    .eq('active', true)
    .order('created_at', { ascending: true });

  const childDefs = (children ?? []) as StatDefinition[];
  const ids = [definition.id, ...childDefs.map((c) => c.id)];

  const { data: entries } = await supabase
    .from('stat_entries')
    .select('*')
    .in('stat_id', ids)
    .order('period_start', { ascending: true });

  const byStat = new Map<string, StatEntry[]>();
  for (const e of (entries ?? []) as StatEntry[]) {
    const arr = byStat.get(e.stat_id) ?? [];
    arr.push(e);
    byStat.set(e.stat_id, arr);
  }

  const stat = buildStatWithReadout(definition, byStat.get(definition.id) ?? []);
  return attachFamily(stat, [definition, ...childDefs], byStat);
}

function buildStatWithReadout(definition: StatDefinition, entries: StatEntry[]): StatWithReadout {
  const points: StatSeriesPoint[] = entries.map((e) => ({
    periodStart: e.period_start,
    value: e.value,
    estimated: e.estimated,
  }));
  const values = points.map((p) => p.value);
  const readouts = computeReadoutSeries(values, toOptions(definition));
  return {
    definition,
    points,
    readouts,
    current: readouts.at(-1) ?? null,
    childDefinitions: [],
    family: null,
  };
}
