// Primitive statistiche per il modulo STAT.
//
// Tutto qui dentro è puro e senza dipendenze: nessuna libreria esterna, nessuna
// nozione di date, nessun accesso al DB. Le serie arrivano già dense e ordinate
// dal periodo più vecchio al più recente (chi legge dal DB decide come riempire
// i buchi — l'algoritmo non può indovinarlo).

/** Mediana. NaN su serie vuota (il chiamante deve garantire almeno un punto). */
export function median(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Median Absolute Deviation: dispersione robusta, non gonfiata dagli outlier. */
export function mad(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
}

/** Percentile con interpolazione lineare. `q` in [0,1]. */
export function percentile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * Math.min(Math.max(q, 0), 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Pendenza di Theil–Sen: mediana delle pendenze di tutte le coppie di punti.
 * È la versione rigorosa di "media i punti alti e i punti bassi" — e a differenza
 * della regressione ai minimi quadrati non si fa trascinare da una settimana anomala.
 * Unità: valore per periodo.
 */
export function theilSen(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const slopes: number[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = i + 1; j < values.length; j++) {
      slopes.push((values[j] - values[i]) / (j - i));
    }
  }
  return median(slopes);
}

/** Intercetta associata a una pendenza data, in forma robusta (mediana dei residui). */
export function theilSenIntercept(values: readonly number[], slope: number): number {
  if (values.length === 0) return 0;
  return median(values.map((v, i) => v - slope * i));
}

export interface MannKendallResult {
  /** Somma dei segni delle differenze a coppie. */
  s: number;
  /** Kendall tau-b, in [-1, 1]: forza e direzione della monotonia. */
  tau: number;
  /** Statistica z standardizzata. */
  z: number;
  /** p-value bilaterale. */
  pValue: number;
}

/**
 * Test di Mann–Kendall: esiste un trend monotono, o è rumore?
 * Non parametrico (non assume normalità), con correzione di continuità e
 * gestione dei ties. È esattamente il pezzo che manca al sistema originale,
 * dove la significatività si stimava a occhio guardando l'angolo della linea.
 */
export function mannKendall(values: readonly number[]): MannKendallResult {
  const n = values.length;
  if (n < 3) return { s: 0, tau: 0, z: 0, pValue: 1 };

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      s += Math.sign(values[j] - values[i]);
    }
  }

  // Gruppi di valori identici: riducono sia la varianza sia il tau.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let tieVar = 0;
  let tieTau = 0;
  for (const t of counts.values()) {
    if (t > 1) {
      tieVar += t * (t - 1) * (2 * t + 5);
      tieTau += (t * (t - 1)) / 2;
    }
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieVar) / 18;
  const z = varS <= 0 ? 0 : s > 0 ? (s - 1) / Math.sqrt(varS) : s < 0 ? (s + 1) / Math.sqrt(varS) : 0;

  const n0 = (n * (n - 1)) / 2;
  const denom = Math.sqrt((n0 - tieTau) * n0); // tau-b: il tempo non ha ties
  const tau = denom === 0 ? 0 : s / denom;

  return { s, tau, z, pValue: 2 * (1 - normalCdf(Math.abs(z))) };
}

/** CDF normale standard (Abramowitz–Stegun 7.1.26, errore < 1.5e-7). */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}
