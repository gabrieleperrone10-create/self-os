// Motore del modulo STAT — assegnazione della condizione e della tendenza.
//
// Due letture distinte, come nella fonte (vedi .agents/plan-stat-module.md §1.1, §2):
//   • CONDIZIONE — lo "slant" di un periodo: due punti, disponibile dal secondo periodo.
//   • TENDENZA   — la direzione su più periodi: Theil–Sen + Mann–Kendall.
// Il Power esiste solo al livello della tendenza: è una Normal tenuta in fascia
// altissima, e per definizione non si legge da una linea sola.
//
// Differenza sostanziale rispetto all'originale: lì l'angolo si legge a occhio su un
// grafico scalato a piacere, quindi la stessa serie può dare condizioni diverse.
// Qui tutto è normalizzato sulla scala della stat stessa → invariante di scala.

import { mad, mannKendall, median, percentile, theilSen, theilSenIntercept } from './math';

export type Condition = 'non_existence' | 'danger' | 'emergency' | 'normal' | 'affluence' | 'power';
export type Direction = 'up' | 'down';
export type Mode = 'grow' | 'maintain';
export type Confidence = 'alta' | 'media' | 'bassa';
export type Divergence = 'confirm' | 'fluctuation' | 'rebound' | 'no_trend';

/** Dal peggiore al migliore: serve a confrontare condizione e tendenza. */
export const CONDITION_ORDER: readonly Condition[] = [
  'non_existence',
  'danger',
  'emergency',
  'normal',
  'affluence',
  'power',
];

export const TREND_WINDOW = 13;
export const MIN_TREND_POINTS = 4;
export const P_THRESHOLD = 0.1;

/** Sotto questa scala la percentuale non è informazione, è rumore aritmetico. */
const SMALL_SCALE = 5;
const FLAT_BAND_RELATIVE = 0.05;
const FLAT_BAND_ABSOLUTE = 0.5;

// Calibrazione sul rumore proprio della stat.
//
// Le bande relative (piatto ±5%, Danger −15%, …) sono tarate su stat tipo
// conteggi e fatturato, dove un +5% in un periodo è poco. Ma una misura
// fisiologica non si muove così: una massa grassa che scende del 2,8% in un mese
// è un progresso eccellente, e con le bande fisse finirebbe dentro "piatto" →
// Emergency. Lo stesso vale per i carichi in palestra o il peso.
//
// La soluzione è la stessa filosofia del resto del motore: invece di una soglia
// universale, il metro è la stat stessa. Si misura di quanto si muove tipicamente
// da un periodo all'altro (mediana delle variazioni relative) e si scala tutta la
// struttura delle bande di conseguenza. Serve storico, quindi vale solo da
// CALIBRATION_MIN_POINTS in su; sotto, bande fisse.
// La calibrazione STRINGE soltanto (k <= 1), non allarga mai. Le bande di default
// descrivono bene "quanto è un movimento grosso" per conteggi e valori economici;
// il caso rotto è solo quello opposto, le misure che si muovono di poco. Allargarle
// per le stat volatili introdurrebbe il difetto simmetrico: su una stat che cresce
// sempre del 13% un salto improvviso del +47% smetterebbe di essere Affluence,
// perché la sua stessa irrequietezza avrebbe alzato l'asticella.
const CALIBRATION_MIN_POINTS = 4;
const CALIBRATION_MIN_K = 0.3;
const CALIBRATION_MAX_K = 1;

export interface StatOptions {
  /** 'down' = stat invertita (peso, spese): scendere è migliorare. Default 'up'. */
  direction?: Direction;
  /** 'grow' = deve salire (dottrina: piatta = Emergency). 'maintain' = basta tenere il livello. */
  mode?: Mode;
  /** Livello dichiarato dall'utente, per le stat 'maintain'. */
  target?: number | null;
  /** Riferimento storico usato quando manca il target. Calcolato da readStat(). */
  reference?: number | null;
  /**
   * Variazione relativa tipica della stat da un periodo all'altro: il metro con cui
   * si scalano le bande. Calcolato da readStat(); passarlo a mano solo nei test.
   */
  naturalStep?: number | null;
}

export interface ConditionReading {
  condition: Condition;
  /** Variazione già orientata: positiva = miglioramento, anche per le stat 'down'. */
  delta: number;
  /** Variazione relativa orientata. null quando il periodo precedente è 0. */
  deltaPct: number | null;
  /** Quale banda ha deciso: percentuale o assoluta (numeri piccoli). */
  scale: 'relative' | 'absolute';
  previous: number;
  current: number;
}

export interface TrendReading {
  condition: Condition;
  /** Theil–Sen orientata, unità per periodo. */
  slope: number;
  /** Pendenza relativa alla scala della stat: invariante di scala. */
  relativeSlope: number;
  tau: number;
  pValue: number;
  significant: boolean;
  /** MAD dei residui rapportata alla scala: quanto è rumorosa la serie. */
  noise: number;
  points: number;
  confidence: Confidence;
}

export interface StatReadout {
  /** null con meno di 2 periodi. */
  condition: ConditionReading | null;
  /** null con meno di MIN_TREND_POINTS periodi. */
  trend: TrendReading | null;
  divergence: Divergence;
  /** Quale formula applicare. null = nessuna formula (fluttuazione o rimbalzo). */
  formula: Condition | null;
  /** true quando la condizione non ha ancora una tendenza a confermarla. */
  provisional: boolean;
}

const rank = (c: Condition): number => CONDITION_ORDER.indexOf(c);
const orient = (direction: Direction): number => (direction === 'down' ? -1 : 1);

/**
 * Di quanto si muove tipicamente questa stat da un periodo all'altro, in relativo.
 * Mediana (non media) perché un singolo salto anomalo non deve ritarare le bande.
 * null quando non c'è abbastanza storico o la serie è perfettamente ferma.
 */
export function naturalStepOf(values: readonly number[]): number | null {
  const steps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    if (prev === 0) continue;
    steps.push(Math.abs((values[i] - prev) / prev));
  }
  if (steps.length < CALIBRATION_MIN_POINTS - 1) return null;
  const m = median(steps);
  return m > 0 ? m : null;
}

/** Fattore di scala delle bande relative. 1 = bande di default, <1 = stat più fine. */
function calibration(naturalStep: number | null | undefined): number {
  if (!naturalStep || naturalStep <= 0) return 1;
  const k = naturalStep / FLAT_BAND_RELATIVE;
  return Math.min(Math.max(k, CALIBRATION_MIN_K), CALIBRATION_MAX_K);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONDIZIONE — due punti
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Condizione del periodo, dallo "slant" fra il periodo precedente e quello corrente.
 * Bastano due dati: è il livello che rende il modulo utile dal secondo periodo.
 */
export function assignCondition(
  previous: number,
  current: number,
  opts: StatOptions = {},
): ConditionReading {
  const direction = opts.direction ?? 'up';
  const mode = opts.mode ?? 'grow';
  const sign = orient(direction);

  const delta = sign * (current - previous);
  const deltaPct = previous === 0 ? null : delta / Math.abs(previous);
  const useAbsolute = Math.abs(previous) < SMALL_SCALE || deltaPct === null;
  const scale: ConditionReading['scale'] = useAbsolute ? 'absolute' : 'relative';

  const base: Omit<ConditionReading, 'condition'> = {
    delta,
    deltaPct,
    scale,
    previous,
    current,
  };

  // Nessuna produzione = Non-Existence. Vale solo per le stat 'up': per una stat
  // invertita (spese, sgarri) lo zero è il risultato migliore possibile.
  if (direction === 'up' && current === 0) {
    return { ...base, condition: 'non_existence' };
  }

  const flatOutcome = (): Condition => resolveFlat(current, mode, direction, opts);

  if (useAbsolute) {
    if (delta <= -1.5) return { ...base, condition: 'danger' };
    if (delta <= -FLAT_BAND_ABSOLUTE) return { ...base, condition: 'emergency' };
    if (delta < FLAT_BAND_ABSOLUTE) return { ...base, condition: flatOutcome() };
    if (delta < 1.5) return { ...base, condition: 'normal' };
    return { ...base, condition: 'affluence' };
  }

  const d = deltaPct as number;
  const k = calibration(opts.naturalStep);
  if (d <= -0.5 * k) return { ...base, condition: 'non_existence' }; // crollo quasi verticale
  if (d <= -0.15 * k) return { ...base, condition: 'danger' };
  if (d < -FLAT_BAND_RELATIVE * k) return { ...base, condition: 'emergency' };
  if (d <= FLAT_BAND_RELATIVE * k) return { ...base, condition: flatOutcome() };
  if (d <= 0.25 * k) return { ...base, condition: 'normal' };
  return { ...base, condition: 'affluence' };
}

/**
 * Cosa significa "piatta" — unica deviazione deliberata dalla dottrina.
 * Nell'originale piatta = Emergency sempre: un'org deve sempre espandersi.
 * Per una vita non è vero: "3 allenamenti a settimana" tenuti sono una Normal.
 */
function resolveFlat(
  current: number,
  mode: Mode,
  direction: Direction,
  opts: StatOptions,
): Condition {
  if (mode === 'grow') return 'emergency';
  const bar = opts.target ?? opts.reference ?? null;
  if (bar === null) return 'normal';
  const sign = orient(direction);
  return sign * current < sign * bar ? 'emergency' : 'normal';
}

// ─────────────────────────────────────────────────────────────────────────────
// TENDENZA — N punti
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tendenza sulla finestra degli ultimi TREND_WINDOW periodi.
 * Restituisce null finché non ci sono abbastanza punti: meglio nessuna tendenza
 * che una tendenza finta.
 */
export function analyzeTrend(
  values: readonly number[],
  opts: StatOptions = {},
): TrendReading | null {
  const window = values.slice(-TREND_WINDOW);
  if (window.length < MIN_TREND_POINTS) return null;

  const direction = opts.direction ?? 'up';
  const mode = opts.mode ?? 'grow';
  const sign = orient(direction);
  const oriented = window.map((v) => sign * v);

  const slope = theilSen(oriented);
  const scale = scaleOf(window);
  const relativeSlope = scale === 0 ? 0 : slope / scale;

  const { tau, pValue } = mannKendall(oriented);
  const significant = pValue < P_THRESHOLD;

  const intercept = theilSenIntercept(oriented, slope);
  const residuals = oriented.map((v, i) => v - (intercept + slope * i));
  const noise = scale === 0 ? 0 : mad(residuals) / scale;

  const condition = trendCondition({
    values,
    window,
    oriented,
    relativeSlope,
    significant,
    direction,
    mode,
    opts,
  });

  return {
    condition,
    slope,
    relativeSlope,
    tau,
    pValue,
    significant,
    noise,
    points: window.length,
    confidence: confidenceOf(window.length, pValue, noise),
  };
}

/** Scala di riferimento della stat: mediana in valore assoluto, con ripiego sulla media. */
function scaleOf(window: readonly number[]): number {
  const m = Math.abs(median(window));
  if (m > 0) return m;
  const mean = window.reduce((sum, v) => sum + Math.abs(v), 0) / window.length;
  return mean;
}

interface TrendInput {
  values: readonly number[];
  window: readonly number[];
  oriented: readonly number[];
  relativeSlope: number;
  significant: boolean;
  direction: Direction;
  mode: Mode;
  opts: StatOptions;
}

function trendCondition(input: TrendInput): Condition {
  const { values, window, oriented, relativeSlope, significant, direction, mode, opts } = input;
  const r = relativeSlope;
  const k = calibration(opts.naturalStep);

  if (direction === 'up' && median(window.slice(-3)) === 0) return 'non_existence';

  if ((significant && r <= -0.15 * k) || consecutiveDecline(oriented, 3)) return 'danger';

  if (significant && r <= -0.03 * k) return 'emergency';

  const flat = !significant && Math.abs(r) < 0.03 * k;
  if (flat) {
    const last = window[window.length - 1];
    const reference = opts.reference ?? median(values);
    const outcome = resolveFlat(last, mode, direction, { ...opts, reference });
    if (outcome === 'emergency') return 'emergency';
  }

  if (significant && r >= 0.1 * k) return 'affluence';

  // Theil–Sen è robusto per costruzione: una serie che cresce a lungo e poi crolla
  // e resta bassa ha pendenza mediana vicina a zero (metà punti sopra, metà sotto),
  // e Mann–Kendall non la legge come monotona. Senza questo controllo un crollo
  // netto seguito da un plateau basso risulterebbe "Normal" — il motore
  // scambierebbe un cambio di regime per rumore. È il simmetrico di heldInHighRange.
  if (heldInLowRange(values, direction, significant, r)) {
    const s = orient(direction);
    return median(values.slice(-3).map((v) => s * v)) <= 0 ? 'non_existence' : 'danger';
  }

  return heldInHighRange(values, direction, significant, r) ? 'power' : 'normal';
}

/** `count` periodi consecutivi in calo: risposta rapida che non aspetta la significatività. */
function consecutiveDecline(oriented: readonly number[], count: number): boolean {
  if (oriented.length < count + 1) return false;
  for (let i = oriented.length - count; i < oriented.length; i++) {
    if (oriented[i] >= oriented[i - 1]) return false;
  }
  return true;
}

/**
 * Power: una Normal tenuta in fascia altissima. Gli ultimi 3 periodi devono stare
 * tutti sopra il 90° percentile della *prima metà* dello storico — cioè su un nuovo
 * altopiano rispetto a com'era prima — e la stat non deve essere in calo.
 *
 * Il confronto è con la prima metà, non con tutto lo storico: altrimenti una stat
 * sempre piatta allo stesso livello risulterebbe in Power, e una stat che tiene un
 * altopiano da mesi lo perderebbe man mano che l'altopiano stesso alza il percentile.
 */
function heldInHighRange(
  values: readonly number[],
  direction: Direction,
  significant: boolean,
  relativeSlope: number,
): boolean {
  if (values.length < 12) return false;
  if (significant && relativeSlope < 0) return false;

  const sign = orient(direction);
  const baseline = values.slice(0, Math.floor(values.length / 2)).map((v) => sign * v);
  if (baseline.length < 6) return false;

  // Stretto (> non >=): su una serie perfettamente piatta bar == valori, e con
  // >= una stat sempre uguale a se stessa risulterebbe falsamente in Power.
  const bar = percentile(baseline, 0.9);
  return values
    .slice(-3)
    .map((v) => sign * v)
    .every((v) => v > bar);
}

/**
 * Simmetrico di heldInHighRange: un crollo che si stabilizza in un plateau basso
 * rispetto a com'era la prima metà dello storico. Soglia più bassa (6 periodi,
 * non 12) perché un allarme di sicurezza deve scattare prima di quanto serva per
 * dichiarare un Power — l'asimmetria è deliberata, non un refuso.
 */
function heldInLowRange(
  values: readonly number[],
  direction: Direction,
  significant: boolean,
  relativeSlope: number,
): boolean {
  if (values.length < 8) return false;
  if (significant && relativeSlope > 0) return false;

  const sign = orient(direction);
  const baseline = values.slice(0, Math.floor(values.length / 2)).map((v) => sign * v);
  if (baseline.length < 4) return false;

  // Stretto (< non <=) per lo stesso motivo: niente falsi Danger su una serie
  // perfettamente piatta.
  const bar = percentile(baseline, 0.1);
  return values
    .slice(-3)
    .map((v) => sign * v)
    .every((v) => v < bar);
}

/**
 * Quanto ci si può fidare della lettura. Non dipende solo dal p-value: una serie
 * lunga e poco rumorosa è affidabile anche quando dice "nessun trend".
 */
function confidenceOf(points: number, pValue: number, noise: number): Confidence {
  if (points >= 10 && (pValue < 0.05 || noise < 0.15)) return 'alta';
  if (points >= 6 && (pValue < P_THRESHOLD || noise < 0.3)) return 'media';
  return 'bassa';
}

// ─────────────────────────────────────────────────────────────────────────────
// ISTERESI E LETTURA COMPLETA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * La tendenza cambia solo se confermata per due periodi — tranne Danger e
 * Non-Existence, immediate (nella dottrina il Danger si assegna sul posto).
 * Senza isteresi il rumore settimanale farebbe oscillare la tendenza, che è
 * proprio la cosa che la tendenza deve filtrare.
 */
export function applyTrendHysteresis(
  raw: Condition,
  previousRaw: Condition | null,
  previousAssigned: Condition | null,
): Condition {
  if (raw === 'danger' || raw === 'non_existence') return raw;
  if (previousAssigned === null) return raw;
  if (raw === previousAssigned) return raw;
  return raw === previousRaw ? raw : previousAssigned;
}

/**
 * Lettura completa di una stat: condizione, tendenza, e quale formula applicare.
 *
 * `values` è denso e ordinato dal periodo più vecchio al più recente.
 * Quale formula si applica lo decide qui il motore, mai il modello: l'AI si limita
 * a istanziarne i passi sui dati reali.
 */
export function readStat(values: readonly number[], opts: StatOptions = {}): StatReadout {
  // Le bande si tarano sul rumore della stat, misurato sulla stessa finestra usata
  // per la tendenza: condizione e tendenza devono parlare della stessa scala.
  const effective: StatOptions = {
    ...opts,
    reference: opts.reference ?? median(values),
    naturalStep: opts.naturalStep ?? naturalStepOf(values.slice(-TREND_WINDOW)),
  };

  const trend = analyzeTrend(values, effective);

  const condition =
    values.length >= 2
      ? assignCondition(values[values.length - 2], values[values.length - 1], effective)
      : null;

  if (condition === null) {
    return { condition: null, trend, divergence: 'no_trend', formula: null, provisional: true };
  }

  if (trend === null) {
    return {
      condition,
      trend: null,
      divergence: 'no_trend',
      formula: condition.condition,
      provisional: true,
    };
  }

  const { divergence, formula } = resolveDivergence(condition.condition, trend.condition);
  return { condition, trend, divergence, formula, provisional: false };
}


/**
 * Cronologia completa delle letture, periodo per periodo, con l'isteresi della
 * tendenza applicata correttamente in sequenza (§2.2, §2.4). Serve a due cose:
 *  - il valore corrente per la board (`series.at(-1)`);
 *  - "seleziono un punto sul grafico" (§5.1): la scheda per quel periodo, non
 *    quella di oggi, usando solo i dati disponibili fino a lì.
 *
 * `values` denso e ordinato dal periodo più vecchio al più recente — nessuna
 * nozione di date qui dentro (§2.4): chi legge dal DB decide quali periodi
 * includere.
 */
export function computeReadoutSeries(values: readonly number[], opts: StatOptions = {}): StatReadout[] {
  const out: StatReadout[] = [];
  let previousRaw: Condition | null = null;
  let previousAssigned: Condition | null = null;

  for (let i = 0; i < values.length; i++) {
    const prefix = values.slice(0, i + 1);
    const raw = readStat(prefix, opts);

    if (raw.trend === null) {
      out.push(raw);
      previousRaw = null;
      previousAssigned = null;
      continue;
    }

    const rawCondition = raw.trend.condition;
    const assignedCondition = applyTrendHysteresis(rawCondition, previousRaw, previousAssigned);
    const trend = assignedCondition === rawCondition ? raw.trend : { ...raw.trend, condition: assignedCondition };
    const { divergence, formula } = resolveDivergence(raw.condition!.condition, assignedCondition);

    out.push({ ...raw, trend, divergence, formula });
    previousRaw = rawCondition;
    previousAssigned = assignedCondition;
  }

  return out;
}

/**
 * Il pezzo di prodotto: condizione e tendenza che si contraddicono sono esse stesse
 * l'informazione. Un Danger dentro una tendenza in salita è una fluttuazione, non
 * un'emergenza — e applicargli la formula di Danger sarebbe l'errore cardinale
 * della tech: eseguire la formula di una condizione in cui non sei.
 */
export function resolveDivergence(
  condition: Condition,
  trend: Condition,
): { divergence: Divergence; formula: Condition | null } {
  // Il Power vive solo nella tendenza: una settimana ordinaria non lo smentisce.
  if (trend === 'power' && rank(condition) >= rank('normal')) {
    return { divergence: 'confirm', formula: 'power' };
  }
  if (rank(condition) < rank(trend)) return { divergence: 'fluctuation', formula: null };
  if (rank(condition) > rank(trend)) return { divergence: 'rebound', formula: null };
  return { divergence: 'confirm', formula: trend };
}
