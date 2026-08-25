import test from 'node:test';
import assert from 'node:assert/strict';

import { computeReadoutSeries } from './engine';
import { buildReadoutCopy } from './copy';

test('fluttuazione: il titolo dice esplicitamente di non applicare la formula', () => {
  const serie = [10, 12, 14, 17, 19, 22, 25, 28, 31, 20];
  const readout = computeReadoutSeries(serie).at(-1)!;
  const copy = buildReadoutCopy(readout, { unit: 'unità' });
  assert.match(copy.actionTitle, /Non applicare la formula/);
  assert.ok(copy.actionNote?.includes('Regola cardinale'));
});

test('conferma: il titolo è il nome della formula', () => {
  const serie = [10, 10, 10, 10, 10, 10, 10, 10];
  const readout = computeReadoutSeries(serie, { mode: 'maintain', target: 10 }).at(-1)!;
  assert.equal(readout.divergence, 'confirm');
  const copy = buildReadoutCopy(readout);
  assert.equal(copy.actionTitle, 'Normal');
});

test('provvisoria: due soli punti, nota esplicita', () => {
  const readout = computeReadoutSeries([10, 12]).at(-1)!;
  const copy = buildReadoutCopy(readout, { unit: 'kg' });
  assert.equal(copy.provisional, true);
  assert.match(copy.actionNote ?? '', /Provvisoria/);
  assert.match(copy.conditionDelta ?? '', /10 → 12 kg/);
});
