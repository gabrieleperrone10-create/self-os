// Test delle famiglie di stat (VFP + figli) — piano §7 / F7.
//
// Lo scenario è quello reale che ha motivato la feature: un risultato di forma
// fisica (massa grassa) che dipende da quanti allenamenti fai, da come li fai, e
// da una condizione abilitante (nutrizione) — e la domanda "cosa sta portando o
// non portando il risultato".

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  alignToParentPeriods,
  computeAssociation,
  isInOrder,
  readFamily,
  type FamilyChildInput,
} from './family';
import { computeReadoutSeries, type StatReadout } from './engine';

const MONTHS = ['2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01'];

/** 4 settimane per mese, con i valori dati mese per mese. */
function weekly(perMonth: number[][]): { periodStart: string; value: number }[] {
  const out: { periodStart: string; value: number }[] = [];
  MONTHS.forEach((m, i) =>
    perMonth[i].forEach((v, w) =>
      out.push({ periodStart: `${m.slice(0, 8)}${String(1 + w * 7).padStart(2, '0')}`, value: v }),
    ),
  );
  return out;
}
const flat = (monthly: number[]) => monthly.map((v) => [v, v, v, v]);
const parentEntries = (vals: number[]) => MONTHS.map((m, i) => ({ periodStart: m, value: vals[i] }));

const VFP_PEGGIORA = [17.3, 17.5, 17.8, 18.2, 18.6, 19.1];
const VFP_MIGLIORA = [19.2, 18.9, 18.5, 18.2, 17.8, 17.3];
const VFP_OPTS = { direction: 'down' as const, mode: 'grow' as const };

const child = (
  id: string,
  label: string,
  role: FamilyChildInput['role'],
  aggregation: FamilyChildInput['aggregation'],
  options: FamilyChildInput['options'],
  entries: FamilyChildInput['entries'],
): FamilyChildInput => ({ id, label, role, period: 'week', aggregation, options, entries });

const QTY_OK = child('q', 'Allenamenti', 'quantity', 'sum', { mode: 'maintain', target: 12 }, weekly(flat([3, 3, 3, 3, 3, 3])));
const QTY_GIU = child('q', 'Allenamenti', 'quantity', 'sum', { mode: 'maintain', target: 12 },
  weekly([[3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 2, 2], [2, 2, 2, 1], [2, 1, 1, 1]]));
const QUAL_OK = child('m', 'Carico medio', 'quality', 'mean', { mode: 'grow' }, weekly(flat([90, 93, 96, 99, 102, 106])));
const QUAL_GIU = child('m', 'Carico medio', 'quality', 'mean', { mode: 'grow' }, weekly(flat([100, 100, 100, 100, 100, 100])));
const SUP_OK = child('s', 'Aderenza', 'support', 'mean', { mode: 'maintain', target: 80 }, weekly(flat([85, 85, 85, 85, 85, 85])));
const SUP_GIU = child('s', 'Aderenza', 'support', 'mean', { mode: 'maintain', target: 80 }, weekly(flat([85, 85, 85, 72, 62, 55])));

const read = (vfp: number[], kids: FamilyChildInput[]) =>
  readFamily(parentEntries(vfp), 'month', VFP_OPTS, kids);

// ── Allineamento figli → periodo del VFP ────────────────────────────────────

test('allineamento: le settimane si sommano dentro il mese del VFP', () => {
  const aligned = alignToParentPeriods(weekly(flat([3, 3, 3, 3, 3, 3])), MONTHS, 'month', 'sum');
  assert.deepEqual(aligned, [12, 12, 12, 12, 12, 12]);
});

test('allineamento: la media non è la somma — il peso non si somma su un mese', () => {
  const pesi = weekly(flat([80, 80, 80, 80, 80, 80]));
  assert.deepEqual(alignToParentPeriods(pesi, MONTHS, 'month', 'mean'), [80, 80, 80, 80, 80, 80]);
  assert.equal(alignToParentPeriods(pesi, MONTHS, 'month', 'sum')[0], 320, 'somma: 4× il valore vero');
  assert.equal(alignToParentPeriods(pesi, MONTHS, 'month', 'last')[0], 80);
});

test('allineamento: un mese senza dati resta null, non zero', () => {
  const parziale = weekly(flat([3, 3, 3, 3, 3, 3])).filter((e) => !e.periodStart.startsWith('2026-05'));
  const aligned = alignToParentPeriods(parziale, MONTHS, 'month', 'sum');
  assert.equal(aligned[2], null, 'maggio non registrato ≠ maggio a zero');
  assert.equal(aligned[3], 12);
});

// ── isInOrder: riusa la regola di divergenza §2.3 ────────────────────────────

test('isInOrder: una fluttuazione non è un fallimento, un rimbalzo non è produzione', () => {
  const fluct = { condition: { condition: 'danger' }, divergence: 'fluctuation' } as unknown as StatReadout;
  const rebound = { condition: { condition: 'affluence' }, divergence: 'rebound' } as unknown as StatReadout;
  assert.equal(isInOrder(fluct), true, 'periodo storto dentro una tendenza buona');
  assert.equal(isInOrder(rebound), false, 'periodo buono dentro una tendenza in calo');
  assert.equal(isInOrder(null), null);
});

// ── Tabella diagnostica ─────────────────────────────────────────────────────

test('VFP giù e allenamenti giù: la catena si spiega da sé', () => {
  const f = read(VFP_PEGGIORA, [QTY_GIU, QUAL_OK, SUP_OK]);
  assert.equal(f.diagnosis, 'consistent_down');
  assert.equal(f.culprit?.label, 'Allenamenti');
});

test('VFP giù ma il lavoro è stato fatto: è il metodo che non funziona', () => {
  const f = read(VFP_PEGGIORA, [QTY_OK, QUAL_GIU, SUP_OK]);
  assert.equal(f.diagnosis, 'method_failure');
  assert.equal(f.culprit?.label, 'Carico medio');
});

test('VFP giù, lavoro e metodo tengono: cede la condizione abilitante', () => {
  const f = read(VFP_PEGGIORA, [QTY_OK, QUAL_OK, SUP_GIU]);
  assert.equal(f.diagnosis, 'support_failure');
  assert.equal(f.culprit?.label, 'Aderenza');
});

test('VFP giù con TUTTI i figli in ordine: la causa non è nei dati', () => {
  // Il caso più prezioso: invece di inventare una causa (o di incolpare la
  // disciplina, che i dati smentiscono), il sistema dichiara il buco.
  const f = read(VFP_PEGGIORA, [QTY_OK, QUAL_OK, SUP_OK]);
  assert.equal(f.diagnosis, 'unmanned_post');
  assert.equal(f.culprit, null);
});

test('VFP in ordine con figli in ordine: sai cosa lo produce', () => {
  const f = read(VFP_MIGLIORA, [QTY_OK, QUAL_OK, SUP_OK]);
  assert.equal(f.diagnosis, 'confirmed');
});

test('VFP in ordine nonostante un figlio giù: o fortuna, o misuri la cosa sbagliata', () => {
  const f = read(VFP_MIGLIORA, [QTY_GIU, QUAL_OK, SUP_OK]);
  assert.equal(f.diagnosis, 'unexplained_gain');
  assert.equal(f.culprit?.label, 'Allenamenti');
});

test('la quantità ha la precedenza: su lavoro non fatto non si giudica il metodo', () => {
  const f = read(VFP_PEGGIORA, [QTY_GIU, QUAL_GIU, SUP_GIU]);
  assert.equal(f.diagnosis, 'consistent_down');
  assert.equal(f.culprit?.role, 'quantity');
});

test('senza figli leggibili non si inventa una diagnosi', () => {
  assert.equal(read(VFP_PEGGIORA, []).diagnosis, 'insufficient');
  const soloUnMese = readFamily([{ periodStart: MONTHS[0], value: 18 }], 'month', VFP_OPTS, [QTY_OK]);
  assert.equal(soloUnMese.diagnosis, 'insufficient');
});

test('un figlio non registrato nel periodo corrente non conta come fallimento', () => {
  const senzaUltimo = child('q', 'Allenamenti', 'quantity', 'sum', { mode: 'maintain', target: 12 },
    weekly(flat([3, 3, 3, 3, 3, 3])).filter((e) => !e.periodStart.startsWith('2026-08')));
  const f = read(VFP_PEGGIORA, [senzaUltimo]);
  assert.equal(f.children[0].missingLatest, true);
  assert.equal(f.children[0].inOrder, null);
  assert.equal(f.diagnosis, 'insufficient', 'nessun figlio leggibile ⇒ nessuna diagnosi');
});

// ── Associazione — conteggi, mai un p-value ─────────────────────────────────

test('associazione: non riportabile con pochi periodi', () => {
  const f = read(VFP_MIGLIORA, [QTY_OK]);
  const a = f.associations[0];
  assert.equal(a.reportable, false, '6 periodi mensili non bastano per un contrasto a due bracci');
});

test('associazione: conta i periodi migliorati nei due bracci', () => {
  const parent = computeReadoutSeries([10, 11, 12, 11, 10, 9, 10, 11], {});
  const kid = {
    id: 'k', label: 'Figlio', role: 'quantity' as const, readout: null, inOrder: null, missingLatest: false,
    conditionByParentIndex: [
      null, 'normal', 'normal', 'danger', 'danger', 'danger', 'normal', 'normal',
    ] as (import('./engine').Condition | null)[],
  };
  const a = computeAssociation(parent, kid);
  assert.equal(a.periodsInOrder + a.periodsOut, 7);
  assert.ok(a.improvedWhenInOrder > a.improvedWhenOut, 'migliora quando il figlio produce');
  assert.ok(a.contrast > 0);
});
