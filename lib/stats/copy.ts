// Traduce un StatReadout in testo per la scheda di lettura (piano §5.1–§5.2):
// CONDIZIONE, TENDENZA, COSA FARE ORA. Pura funzione, nessuna chiamata AI —
// è anche il fallback quando l'AI della F3 non risponde (§5.3).

import type { Condition, Divergence, StatReadout } from './engine';
import { FORMULAS } from './formulas';

export const CONDITION_LABEL: Record<Condition, string> = {
  non_existence: 'Non-Existence',
  danger: 'Danger',
  emergency: 'Emergency',
  normal: 'Normal',
  affluence: 'Affluence',
  power: 'Power',
};

const CONDITION_SENTENCE: Record<Condition, string> = {
  non_existence: 'Nessuna produzione in questo periodo.',
  danger: 'Calo netto rispetto al periodo precedente.',
  emergency: 'In calo lieve, o fermo sotto il livello che ti eri dato.',
  normal: 'Lieve miglioramento rispetto al periodo precedente.',
  affluence: 'Salita netta rispetto al periodo precedente.',
  power: 'Fascia alta mantenuta.',
};

export interface ReadoutCopy {
  conditionLabel: string | null;
  conditionSentence: string | null;
  conditionDelta: string | null;
  trendLabel: string | null;
  trendSentence: string | null;
  actionTitle: string;
  actionSteps: readonly string[];
  actionNote: string | null;
  provisional: boolean;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function conditionDeltaText(readout: StatReadout, unit?: string | null): string | null {
  const c = readout.condition;
  if (!c) return null;
  const u = unit ? ` ${unit}` : '';
  const verse = c.delta > 0 ? 'migliora' : c.delta < 0 ? 'peggiora' : 'invariato';
  if (c.scale === 'relative' && c.deltaPct !== null) {
    const pct = Math.round(c.deltaPct * 1000) / 10;
    const sign = pct > 0 ? '+' : '';
    return `${fmtNum(c.previous)} → ${fmtNum(c.current)}${u}  (${sign}${pct}% · ${verse})`;
  }
  const sign = c.delta > 0 ? '+' : '';
  return `${fmtNum(c.previous)} → ${fmtNum(c.current)}${u}  (${sign}${fmtNum(c.delta)}${u} · ${verse})`;
}

function trendSentence(readout: StatReadout): string | null {
  const t = readout.trend;
  if (!t) return null;
  const pct = Math.round(t.relativeSlope * 1000) / 10;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%/periodo su ${t.points} periodi · confidenza ${t.confidence} (p=${t.pValue.toFixed(2)})`;
}

function actionFor(readout: StatReadout): { title: string; steps: readonly string[]; note: string | null } {
  const conditionLabel = readout.condition ? CONDITION_LABEL[readout.condition.condition] : null;
  const trendLabel = readout.trend ? CONDITION_LABEL[readout.trend.condition] : null;

  if (readout.divergence === 'fluctuation') {
    return {
      title: `Non applicare la formula di ${conditionLabel}`,
      steps: [
        `La tendenza resta ${trendLabel}: questo è un periodo sotto, non un'emergenza.`,
        'Nessuna azione strutturale questa settimana.',
        'Annota solo cosa è successo, per avere il dato se si ripetesse.',
      ],
      note: "Regola cardinale: mai la formula di una condizione in cui non sei davvero.",
    };
  }

  if (readout.divergence === 'rebound') {
    return {
      title: 'Non è ancora un recupero',
      steps: [
        'Chiediti se è ripetibile o è stato un periodo isolato.',
        "Se ripetibile, individua cosa l'ha prodotto e ripetilo deliberatamente.",
        'Non festeggiare su un solo periodo: la tendenza resta ' + trendLabel + '.',
      ],
      note: null,
    };
  }

  if (readout.condition === null) {
    return { title: 'In raccolta', steps: ['Serve almeno un secondo periodo per leggere una condizione.'], note: null };
  }

  const target = readout.formula ?? readout.condition.condition;
  const formula = FORMULAS[target];
  return {
    title: formula.name,
    steps: formula.steps,
    note: readout.provisional
      ? 'Provvisoria: basata su due soli periodi, senza ancora una tendenza a confermarla.'
      : null,
  };
}

export function buildReadoutCopy(readout: StatReadout, opts: { unit?: string | null } = {}): ReadoutCopy {
  const action = actionFor(readout);
  return {
    conditionLabel: readout.condition ? CONDITION_LABEL[readout.condition.condition] : null,
    conditionSentence: readout.condition ? CONDITION_SENTENCE[readout.condition.condition] : null,
    conditionDelta: conditionDeltaText(readout, opts.unit),
    trendLabel: readout.trend ? CONDITION_LABEL[readout.trend.condition] : null,
    trendSentence: trendSentence(readout),
    actionTitle: action.title,
    actionSteps: action.steps,
    actionNote: action.note,
    provisional: readout.provisional,
  };
}

export type { Condition, Divergence };
