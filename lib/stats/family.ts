// Famiglie di stat — il VFP e i suoi figli (piano §7, esteso F7).
//
// Nella tech di Hubbard ogni posto ha un VFP (Valuable Final Product) definito con
// precisione, e la statistica misura la produzione di QUEL prodotto — non l'attività
// generica. La distinzione portante è "motion vs production": puoi essere
// pieno di attività (tutti gli allenamenti fatti) senza che il prodotto finale
// arrivi. L'org board risolve questo mettendo divisioni diverse su stat diverse,
// e diagnosticando un prodotto finale che non arriva scendendo la gerarchia per
// trovare quale divisione non sta producendo.
//
// Qui la gerarchia è: VFP (risultato) ← figli (produzione che lo genera).
//   VFP        massa grassa %, carico sul sollevamento target
//   quantity   l'hai fatto?          — allenamenti fatti
//   quality    come l'hai fatto?     — carico progressivo, tecnica
//   support    condizione abilitante — nutrizione, sonno
//
// Cosa questo modulo NON fa: attribuire colpe. Nella pratica documentata, il
// "why finding" della Data Series è degenerato in caccia al colpevole ("chi tiene
// giù le stat"). Applicato a se stessi diventa auto-colpevolizzazione, che non è
// una diagnosi. Qui la diagnosi nomina sempre un LIVELLO strutturale, e il caso
// più prezioso (`unmanned_post`) dice esplicitamente "la causa non è nei tuoi
// dati" invece di inventarne una.

import {
  CONDITION_ORDER,
  computeReadoutSeries,
  type Condition,
  type StatOptions,
  type StatReadout,
} from './engine';
import { periodStartOf, type Period } from './period';

export type StatRole = 'quantity' | 'quality' | 'support';

/** Come si sommano i valori di un figlio quando si sale al periodo del VFP. */
export type Aggregation = 'sum' | 'mean' | 'last';

export type Diagnosis =
  /** VFP giù e la produzione di base è giù: la catena si spiega da sé. */
  | 'consistent_down'
  /** VFP giù, il lavoro è stato fatto, ma il modo in cui lo fai non funziona. */
  | 'method_failure'
  /** VFP giù, lavoro e metodo tengono: cede una condizione abilitante. */
  | 'support_failure'
  /** VFP giù e TUTTI i figli in ordine: la causa è fuori da ciò che misuri. */
  | 'unmanned_post'
  /** VFP in ordine e figli in ordine: sai cosa lo produce. */
  | 'confirmed'
  /** VFP in ordine nonostante un figlio giù: fortuna, o stai misurando la cosa sbagliata. */
  | 'unexplained_gain'
  /** Non abbastanza dati per una lettura di famiglia. */
  | 'insufficient';

const rank = (c: Condition): number => CONDITION_ORDER.indexOf(c);

/**
 * "Sta producendo?" — non è solo la condizione del periodo.
 *
 * Riusa la regola di divergenza §2.3: un periodo storto dentro una tendenza
 * buona è una fluttuazione, non un fallimento (e trattarlo come tale sarebbe
 * l'errore cardinale della tech). Simmetricamente un periodo buono dentro una
 * tendenza in calo è un rimbalzo, non produzione ristabilita.
 */
export function isInOrder(readout: StatReadout | null): boolean | null {
  if (!readout?.condition) return null;
  if (readout.divergence === 'fluctuation') return true;
  if (readout.divergence === 'rebound') return false;
  return rank(readout.condition.condition) >= rank('normal');
}

export interface FamilyChildInput {
  id: string;
  label: string;
  role: StatRole;
  period: Period;
  aggregation: Aggregation;
  options: StatOptions;
  entries: readonly { periodStart: string; value: number }[];
}

export interface FamilyChildState {
  id: string;
  label: string;
  role: StatRole;
  readout: StatReadout | null;
  inOrder: boolean | null;
  /** Nessun valore registrato nel periodo corrente del VFP. */
  missingLatest: boolean;
  /** Condizione del figlio per ogni periodo del VFP (null dove manca il dato). */
  conditionByParentIndex: (Condition | null)[];
}

export interface FamilyReadout {
  parent: StatReadout | null;
  parentPeriods: string[];
  children: FamilyChildState[];
  diagnosis: Diagnosis;
  /** Il figlio responsabile della diagnosi, quando ne esiste uno. */
  culprit: FamilyChildState | null;
  associations: Association[];
}

/**
 * Somma i valori di un figlio dentro ogni periodo del VFP.
 *
 * Un figlio settimanale sotto un VFP mensile va aggregato, e COME aggregarlo
 * dipende dalla stat: gli allenamenti di un mese si sommano, il peso no (si
 * prende l'ultimo), una percentuale di aderenza si media. Senza questa distinzione
 * un peso settimanale aggregato a mese darebbe 4× il valore vero.
 *
 * Un periodo del figlio è assegnato al periodo del VFP che contiene la sua data
 * di INIZIO — regola semplice e dichiarata, per le settimane a cavallo di due mesi.
 */
export function alignToParentPeriods(
  entries: readonly { periodStart: string; value: number }[],
  parentPeriods: readonly string[],
  parentPeriod: Period,
  aggregation: Aggregation,
): (number | null)[] {
  const buckets = new Map<string, number[]>();
  for (const e of entries) {
    const bucket = periodStartOf(parentPeriod, e.periodStart);
    const arr = buckets.get(bucket) ?? [];
    arr.push(e.value);
    buckets.set(bucket, arr);
  }

  return parentPeriods.map((p) => {
    const values = buckets.get(p);
    if (!values || values.length === 0) return null;
    if (aggregation === 'last') return values[values.length - 1];
    const total = values.reduce((sum, v) => sum + v, 0);
    return aggregation === 'mean' ? total / values.length : total;
  });
}

function buildChildState(
  child: FamilyChildInput,
  parentPeriods: readonly string[],
  parentPeriod: Period,
): FamilyChildState {
  const aligned = alignToParentPeriods(child.entries, parentPeriods, parentPeriod, child.aggregation);

  // I periodi vuoti si escludono (non valgono zero: "non registrato" non è
  // "produzione nulla" — stessa regola dichiarata in data.ts), ma si tiene la
  // corrispondenza con l'indice del VFP per poterli riallineare dopo.
  const values: number[] = [];
  const parentIndexOf: number[] = [];
  aligned.forEach((v, i) => {
    if (v !== null) {
      values.push(v);
      parentIndexOf.push(i);
    }
  });

  const readouts = computeReadoutSeries(values, child.options);
  const conditionByParentIndex: (Condition | null)[] = parentPeriods.map(() => null);
  readouts.forEach((r, k) => {
    if (r.condition) conditionByParentIndex[parentIndexOf[k]] = r.condition.condition;
  });

  const latestIndex = parentPeriods.length - 1;
  const missingLatest = aligned[latestIndex] === null || latestIndex < 0;
  const readout = missingLatest ? null : (readouts.at(-1) ?? null);

  return {
    id: child.id,
    label: child.label,
    role: child.role,
    readout,
    inOrder: isInOrder(readout),
    missingLatest,
    conditionByParentIndex,
  };
}

/**
 * Diagnosi della famiglia nel periodo corrente.
 *
 * L'ordine dei controlli non è arbitrario ed è la parte di logica organizzativa
 * vera: la QUANTITÀ viene prima. Su allenamenti che non hai fatto non puoi
 * valutare il metodo — una divisione che non produce affatto non ha un problema
 * di metodo, ha un problema di produzione. Solo con il lavoro effettivamente
 * fatto ha senso chiedersi se il modo in cui lo fai funziona.
 */
function diagnose(
  parent: StatReadout | null,
  children: FamilyChildState[],
): { diagnosis: Diagnosis; culprit: FamilyChildState | null } {
  const known = children.filter((c) => c.inOrder !== null);
  if (!parent?.condition || known.length === 0) {
    return { diagnosis: 'insufficient', culprit: null };
  }

  const parentInOrder = isInOrder(parent);
  const outOfRole = (role: StatRole) => known.find((c) => c.role === role && c.inOrder === false) ?? null;

  if (parentInOrder === false) {
    const quantityOut = outOfRole('quantity');
    if (quantityOut) return { diagnosis: 'consistent_down', culprit: quantityOut };

    const qualityOut = outOfRole('quality');
    if (qualityOut) return { diagnosis: 'method_failure', culprit: qualityOut };

    const supportOut = outOfRole('support');
    if (supportOut) return { diagnosis: 'support_failure', culprit: supportOut };

    return { diagnosis: 'unmanned_post', culprit: null };
  }

  const anyOut = known.find((c) => c.inOrder === false) ?? null;
  return anyOut
    ? { diagnosis: 'unexplained_gain', culprit: anyOut }
    : { diagnosis: 'confirmed', culprit: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSOCIAZIONE — il pezzo che Hubbard non aveva
// ─────────────────────────────────────────────────────────────────────────────

export interface Association {
  childId: string;
  childLabel: string;
  /** Periodi in cui il figlio produceva e il VFP è migliorato / totale di quei periodi. */
  improvedWhenInOrder: number;
  periodsInOrder: number;
  improvedWhenOut: number;
  periodsOut: number;
  /** Differenza tra i due tassi, in punti (0–1). */
  contrast: number;
  /** true solo se le soglie di prudenza sono rispettate (vedi ASSOCIATION_MIN_*). */
  reportable: boolean;
}

/** Con meno di così qualunque "correlazione" è un racconto, non un dato. */
export const ASSOCIATION_MIN_PERIODS = 6;
export const ASSOCIATION_MIN_PER_ARM = 2;
export const ASSOCIATION_MIN_CONTRAST = 0.4;

/**
 * Quanto spesso il VFP è migliorato nei periodi in cui il figlio produceva,
 * contro quelli in cui non produceva.
 *
 * Deliberatamente conteggi grezzi, mai un p-value: su 8 periodi mensili
 * auto-riportati un p-value sarebbe falsa precisione. È un'osservazione di
 * co-occorrenza, e va presentata come tale — non come causa.
 */
export function computeAssociation(
  parentReadouts: readonly StatReadout[],
  child: FamilyChildState,
): Association {
  let improvedWhenInOrder = 0;
  let periodsInOrder = 0;
  let improvedWhenOut = 0;
  let periodsOut = 0;

  for (let i = 1; i < parentReadouts.length; i++) {
    const parentCondition = parentReadouts[i]?.condition;
    const childCondition = child.conditionByParentIndex[i];
    if (!parentCondition || !childCondition) continue;

    const improved = parentCondition.delta > 0;
    if (rank(childCondition) >= rank('normal')) {
      periodsInOrder++;
      if (improved) improvedWhenInOrder++;
    } else {
      periodsOut++;
      if (improved) improvedWhenOut++;
    }
  }

  const total = periodsInOrder + periodsOut;
  const rateInOrder = periodsInOrder > 0 ? improvedWhenInOrder / periodsInOrder : 0;
  const rateOut = periodsOut > 0 ? improvedWhenOut / periodsOut : 0;
  const contrast = rateInOrder - rateOut;

  return {
    childId: child.id,
    childLabel: child.label,
    improvedWhenInOrder,
    periodsInOrder,
    improvedWhenOut,
    periodsOut,
    contrast,
    reportable:
      total >= ASSOCIATION_MIN_PERIODS &&
      periodsInOrder >= ASSOCIATION_MIN_PER_ARM &&
      periodsOut >= ASSOCIATION_MIN_PER_ARM &&
      Math.abs(contrast) >= ASSOCIATION_MIN_CONTRAST,
  };
}

/** Lettura completa di una famiglia: VFP, figli allineati al suo periodo, diagnosi, associazioni. */
export function readFamily(
  parentEntries: readonly { periodStart: string; value: number }[],
  parentPeriod: Period,
  parentOptions: StatOptions,
  children: readonly FamilyChildInput[],
): FamilyReadout {
  const parentPeriods = parentEntries.map((e) => e.periodStart);
  const parentReadouts = computeReadoutSeries(
    parentEntries.map((e) => e.value),
    parentOptions,
  );
  const parent = parentReadouts.at(-1) ?? null;

  const states = children.map((c) => buildChildState(c, parentPeriods, parentPeriod));
  const { diagnosis, culprit } = diagnose(parent, states);
  const associations = states.map((c) => computeAssociation(parentReadouts, c));

  return { parent, parentPeriods, children: states, diagnosis, culprit, associations };
}
