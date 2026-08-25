import test from 'node:test';
import assert from 'node:assert/strict';

import {
  currentPeriodStart,
  monthStart,
  nextPeriod,
  periodStartOf,
  previousPeriod,
  recentPeriods,
  weekStart,
} from './period';

test('weekStart: torna sempre al lunedì', () => {
  assert.equal(weekStart('2026-08-25'), '2026-08-24'); // martedì → lunedì precedente
  assert.equal(weekStart('2026-08-24'), '2026-08-24'); // lunedì → se stesso
  assert.equal(weekStart('2026-08-30'), '2026-08-24'); // domenica → lunedì della stessa settimana
});

test('currentPeriodStart: day torna la data stessa, week torna il lunedì', () => {
  assert.equal(currentPeriodStart('day', '2026-08-25'), '2026-08-25');
  assert.equal(currentPeriodStart('week', '2026-08-25'), '2026-08-24');
});

test('recentPeriods: n periodi, in ordine crescente, che finiscono su oggi', () => {
  const days = recentPeriods('day', 4, '2026-08-25');
  assert.deepEqual(days, ['2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25']);

  const weeks = recentPeriods('week', 3, '2026-08-25');
  assert.deepEqual(weeks, ['2026-08-10', '2026-08-17', '2026-08-24']);
});

// ── Mese — serve per i VFP di una famiglia (§7) ──────────────────────────────

test('monthStart e periodStartOf: il mese parte dal primo', () => {
  assert.equal(monthStart('2026-08-25'), '2026-08-01');
  assert.equal(periodStartOf('month', '2026-08-25'), '2026-08-01');
  assert.equal(periodStartOf('week', '2026-08-25'), '2026-08-24');
  assert.equal(periodStartOf('day', '2026-08-25'), '2026-08-25');
});

test('previousPeriod / nextPeriod: mesi senza scivolamenti di giorno', () => {
  assert.equal(previousPeriod('month', '2026-03-01'), '2026-02-01');
  assert.equal(nextPeriod('month', '2026-02-01'), '2026-03-01');
  // Il caso che rompe l'aritmetica ingenua sui mesi: gennaio ↔ dicembre.
  assert.equal(previousPeriod('month', '2026-01-01'), '2025-12-01');
  assert.equal(nextPeriod('month', '2025-12-01'), '2026-01-01');
});

test('recentPeriods: mesi consecutivi a ritroso', () => {
  assert.deepEqual(recentPeriods('month', 4, '2026-08-25'), [
    '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01',
  ]);
});

test('recentPeriods: attraversa il cambio di anno', () => {
  assert.deepEqual(recentPeriods('month', 3, '2026-01-15'), [
    '2025-11-01', '2025-12-01', '2026-01-01',
  ]);
});
