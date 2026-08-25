// Helper di periodo per il modulo STAT — fuso orario Roma, coerente con la
// convenzione già usata in biometrics (toRomeDate). Nessuna logica statistica
// qui dentro: solo "che giorno/settimana/mese è" per popolare stat_entries e per
// allineare i figli di una famiglia al periodo del VFP (§7).

export type Period = 'day' | 'week' | 'month';

/** Data odierna in Europe/Rome, come YYYY-MM-DD. */
export function romeToday(): string {
  return new Date().toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function toDateOnly(date: string): Date {
  return new Date(date + 'T12:00:00Z'); // mezzogiorno UTC: evita salti di giorno per DST
}

/** Lunedì della settimana di `date` (ISO, settimana che inizia di lunedì). */
export function weekStart(date: string): string {
  const d = toDateOnly(date);
  const day = d.getUTCDay(); // 0=domenica..6=sabato
  const diff = (day + 6) % 7; // giorni da sottrarre per arrivare a lunedì
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}

/** Primo giorno del mese di `date`. Pura manipolazione di stringa: niente fusi di mezzo. */
export function monthStart(date: string): string {
  return date.slice(0, 7) + '-01';
}

/** L'inizio del periodo che CONTIENE `date`, per la granularità data. */
export function periodStartOf(period: Period, date: string): string {
  if (period === 'day') return date;
  if (period === 'week') return weekStart(date);
  return monthStart(date);
}

/** Il periodo corrente per una stat, oggi. */
export function currentPeriodStart(period: Period, today: string = romeToday()): string {
  return periodStartOf(period, today);
}

/** Il periodo successivo a `periodStart` (usato per iterare una finestra temporale). */
export function nextPeriod(period: Period, periodStart: string): string {
  const d = toDateOnly(periodStart);
  if (period === 'day') d.setUTCDate(d.getUTCDate() + 1);
  else if (period === 'week') d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return periodStartOf(period, d.toISOString().split('T')[0]);
}

/** Il periodo precedente a `periodStart`. */
export function previousPeriod(period: Period, periodStart: string): string {
  const d = toDateOnly(periodStart);
  if (period === 'day') d.setUTCDate(d.getUTCDate() - 1);
  else if (period === 'week') d.setUTCDate(d.getUTCDate() - 7);
  else d.setUTCMonth(d.getUTCMonth() - 1);
  return periodStartOf(period, d.toISOString().split('T')[0]);
}

/** Le ultime `n` date di inizio periodo, dalla più vecchia alla più recente — per la griglia di inserimento retroattivo (§3.2). */
export function recentPeriods(period: Period, n: number, today: string = romeToday()): string[] {
  const out: string[] = [];
  let cursor = currentPeriodStart(period, today);
  for (let i = 0; i < n; i++) {
    out.unshift(cursor);
    cursor = previousPeriod(period, cursor);
  }
  return out;
}

/**
 * Etichetta compatta per l'asse di un grafico. "agosto 2026" occupa troppo:
 * con 6 punti mensili su 600px le etichette si sovrappongono e Recharts ne salta
 * una su due.
 */
export function formatPeriodTick(period: Period, periodStart: string): string {
  if (period !== 'month') return formatPeriodLabel(period, periodStart);
  const [y, m] = periodStart.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  const month = date.toLocaleDateString('it-IT', { month: 'short', timeZone: 'UTC' });
  return `${month} ${String(y).slice(2)}`;
}

export function formatPeriodLabel(period: Period, periodStart: string): string {
  const [y, m, d] = periodStart.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  if (period === 'month') {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  const day = date.getUTCDate();
  const month = date.toLocaleDateString('it-IT', { month: 'short', timeZone: 'UTC' });
  if (period === 'day') return `${day} ${month}`;

  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 6);
  const endMonth = end.toLocaleDateString('it-IT', { month: 'short', timeZone: 'UTC' });
  return end.getUTCMonth() === date.getUTCMonth()
    ? `${day}–${end.getUTCDate()} ${month}`
    : `${day} ${month} – ${end.getUTCDate()} ${endMonth}`;
}
