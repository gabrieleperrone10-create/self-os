// Generazione del programma del periodo per una stat (modulo STAT, F3).
//
// Il confine, che è la cosa importante di questo file: il MOTORE decide la
// condizione e quale formula si applica; l'AI istanzia i passi di quella
// formula sui dati reali. Se il modello non risponde, o risponde male, la
// scheda continua a mostrare i passi generici deterministici di formulas.ts
// (§5.3) — il modulo non si rompe mai per colpa dell'AI.

import { anthropic, AI_MODEL, NO_THINKING, cachedKbSystem } from '@/lib/anthropic/client';
import {
  STAT_PROGRAM_PROMPT,
  STAT_PROGRAM_INSTRUCTION,
  type StatProgramChild,
} from '@/lib/anthropic/prompts/stat-program';
import { statProgramSchema, type StatProgram } from '@/lib/anthropic/schemas';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { fetchStatContext } from '@/lib/knowledge-base/fetch';
import { identityProfileContext } from '@/lib/ai/identity-profile';
import { recordAiUsage } from '@/lib/ai/usage';
import { getStatByKey } from '@/lib/stats/data';
import { buildReadoutCopy } from '@/lib/stats/copy';
import { buildFamilyCopy } from '@/lib/stats/family-copy';
import { FORMULAS } from '@/lib/stats/formulas';
import { formatPeriodLabel } from '@/lib/stats/period';
import type { createClient } from '@/lib/supabase/server';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface StatProgramRow {
  id: string;
  stat_id: string;
  user_id: string;
  period_start: string;
  condition: string;
  diagnosis: string | null;
  program: StatProgram;
  user_writeup: string | null;
  outcome: 'compiuta' | 'parziale' | 'saltata' | null;
  created_at: string;
}

/** Motivo per cui non c'è un programma da scrivere — distinto da un errore. */
export type NoProgramReason =
  | 'no_data'
  /** Condizione e tendenza divergono: la formula giusta è NON applicarne una. */
  | 'divergence'
  /** Tutti i livelli in ordine e il risultato peggiora: la causa non è nei dati. */
  | 'unmanned_post'
  /** Il risultato migliora mentre un livello cede: non c'è niente da consolidare. */
  | 'unexplained_gain';

export class NoProgramError extends Error {
  constructor(public readonly reason: NoProgramReason) {
    super(reason);
  }
}

/** Il programma già salvato per il periodo corrente di una stat, se c'è. */
export async function fetchStatProgram(
  supabase: ServerClient,
  userId: string,
  statId: string,
  periodStart: string,
): Promise<StatProgramRow | null> {
  try {
    const { data } = await supabase
      .from('stat_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('stat_id', statId)
      .eq('period_start', periodStart)
      .maybeSingle();
    return (data as StatProgramRow | null) ?? null;
  } catch {
    // La tabella potrebbe non essere ancora applicata al DB live: fail-open,
    // la scheda mostra comunque la copy deterministica.
    return null;
  }
}

/**
 * Genera e persiste il programma del periodo per la stat `key`.
 * Lancia NoProgramError quando NON va scritto un programma — non è un errore
 * tecnico ma una decisione del motore.
 */
export async function generateStatProgram(
  supabase: ServerClient,
  userId: string,
  key: string,
): Promise<StatProgramRow> {
  const stat = await getStatByKey(supabase, userId, key);
  if (!stat) throw new NoProgramError('no_data');
  if (stat.points.length === 0) throw new NoProgramError('no_data');

  const family = stat.family;

  // Due diagnosi non hanno una formula da applicare, per costruzione: dirlo è la
  // risposta giusta, e farla scrivere a un modello significherebbe fargli inventare
  // un'azione proprio dove la lettura dice che non ce n'è una.
  if (family?.diagnosis === 'unmanned_post' || family?.diagnosis === 'unexplained_gain') {
    throw new NoProgramError(family.diagnosis);
  }

  // Quando la diagnosi nomina un livello che cede, il programma si scrive su QUEL
  // livello. Applicare al risultato la formula della propria condizione produrrebbe
  // la stessa contraddizione già corretta nella copy deterministica: su una diagnosi
  // "il lavoro c'è, il metodo no", il primo passo di Emergency è "aumenta il volume".
  const culpritDef = family?.culprit
    ? stat.childDefinitions.find(d => d.id === family.culprit!.id) ?? null
    : null;
  const target = culpritDef ? await getStatByKey(supabase, userId, culpritDef.key) : stat;
  if (!target) throw new NoProgramError('no_data');

  const { definition, points, current } = target;
  if (!current?.condition || points.length === 0) throw new NoProgramError('no_data');

  // Quando condizione e tendenza divergono il motore NON assegna una formula:
  // l'indicazione corretta è non applicarne nessuna, e la copy deterministica
  // la dice già meglio di quanto potrebbe un modello. Generare qui rischierebbe
  // di far inventare al modello un'azione strutturale proprio nel caso in cui
  // la regola cardinale dice di non agire.
  if (current.formula === null) throw new NoProgramError('divergence');

  const formula = FORMULAS[current.formula];
  const copy = buildReadoutCopy(current, { unit: definition.unit });
  const familyCopy = family ? buildFamilyCopy(family) : null;

  // L'unità sta sulla definizione del figlio, non nello stato di famiglia: un
  // carico è in kg anche quando il VFP è in %.
  const unitById = new Map(stat.childDefinitions.map(c => [c.id, c.unit]));
  const children: StatProgramChild[] = (family?.children ?? []).map(c => ({
    label: c.label,
    role: c.role,
    condition: c.readout?.condition?.condition ?? null,
    inOrder: c.inOrder,
    currentValue: c.readout?.condition?.current ?? null,
    unit: unitById.get(c.id) ?? null,
  }));

  const periodStart = stat.points[stat.points.length - 1].periodStart;

  const prompt = STAT_PROGRAM_PROMPT({
    label: definition.label,
    unit: definition.unit,
    definition: definition.definition,
    direction: definition.direction,
    mode: definition.mode,
    target: definition.target,
    periodLabel: formatPeriodLabel(definition.period, periodStart),
    series: points.slice(-13).map(p => ({
      period: formatPeriodLabel(definition.period, p.periodStart),
      value: p.value,
    })),
    condition: current.condition.condition,
    conditionLabel: copy.conditionLabel ?? current.condition.condition,
    previous: current.condition.previous,
    current: current.condition.current,
    deltaText: copy.conditionDelta ?? '',
    trendLabel: copy.trendLabel,
    trendText: copy.trendSentence,
    divergence: current.divergence,
    formulaName: formula.name,
    formulaSteps: formula.steps,
    diagnosis: family?.diagnosis ?? null,
    diagnosisTitle: familyCopy?.title ?? null,
    children,
    parentLabel: culpritDef ? stat.definition.label : null,
  });

  const [kbContext, userContext] = await Promise.all([
    fetchStatContext(),
    identityProfileContext(supabase, userId),
  ]);

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    thinking: NO_THINKING,
    max_tokens: 1200,
    system: cachedKbSystem(kbContext, STAT_PROGRAM_INSTRUCTION, userContext || undefined),
    messages: [{ role: 'user', content: prompt }],
  });

  void recordAiUsage(supabase, userId, 'stat-program', AI_MODEL, message.usage);

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = parseAIJson(raw, statProgramSchema, 'stat-program');

  // La sequenza È la formula: un programma con un numero di passi diverso da
  // quello della formula assegnata significa che il modello ne ha inventato o
  // saltato uno. Si taglia sui passi generici invece di propagare il difetto.
  const program: StatProgram = {
    ...parsed,
    passi: parsed.passi.length === formula.steps.length ? parsed.passi : [...formula.steps],
  };
  if (parsed.passi.length !== formula.steps.length) {
    console.error(
      `[stat-program] passi attesi ${formula.steps.length}, ricevuti ${parsed.passi.length} — fallback sui passi generici`,
    );
  }

  const { data: saved, error } = await supabase
    .from('stat_programs')
    .upsert({
      stat_id: stat.definition.id,
      user_id: userId,
      period_start: periodStart,
      condition: stat.current?.condition?.condition ?? current.condition.condition,
      diagnosis: family?.diagnosis ?? null,
      program,
    }, { onConflict: 'stat_id,period_start' })
    .select()
    .single();

  if (error) throw error;
  return saved as StatProgramRow;
}
