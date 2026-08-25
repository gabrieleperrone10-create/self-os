// La copy di famiglia non deve mai contraddire la propria diagnosi.

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFamilyCopy } from './family-copy';
import type { FamilyReadout } from './family';

function fakeFamily(diagnosis: FamilyReadout['diagnosis'], culpritLabel: string | null): FamilyReadout {
  const culprit = culpritLabel
    ? ({
        id: 'c', label: culpritLabel, role: 'quality',
        readout: { condition: { condition: 'emergency' } },
        inOrder: false, missingLatest: false, conditionByParentIndex: [],
      } as unknown as FamilyReadout['culprit'])
    : null;
  return {
    parent: { condition: { condition: 'emergency' } } as unknown as FamilyReadout['parent'],
    parentPeriods: [],
    children: culprit ? [culprit] : [],
    diagnosis,
    culprit,
    associations: [],
  };
}

test('method_failure: non dice mai di aumentare il volume', () => {
  // Il bug trovato provando la famiglia dal vivo: la diagnosi diceva "il lavoro c'è,
  // il metodo no" e il passo dopo, innestato dalla formula generica di Emergency,
  // diceva "aumenta il volume dell'azione base". Si contraddicevano.
  const copy = buildFamilyCopy(fakeFamily('method_failure', 'Carico medio'));
  const testo = [copy.title, copy.body, ...copy.steps].join(' ').toLowerCase();
  assert.ok(!testo.includes('aumenta il volume'), 'contraddirebbe la diagnosi');
  assert.ok(!testo.includes('fanne di più'), 'contraddirebbe la diagnosi');
  assert.ok(testo.includes('cambia il modo'));
});

test('support_failure: non dice di aggiungere lavoro', () => {
  const copy = buildFamilyCopy(fakeFamily('support_failure', 'Aderenza'));
  const testo = [copy.title, copy.body, ...copy.steps].join(' ').toLowerCase();
  assert.ok(!testo.includes('aumenta il volume'));
  assert.ok(testo.includes('non aggiungere lavoro'));
});

test('ogni diagnosi con un colpevole rimanda alla pagina del figlio', () => {
  for (const d of ['consistent_down', 'method_failure', 'support_failure'] as const) {
    const copy = buildFamilyCopy(fakeFamily(d, 'Carico medio'));
    assert.ok(
      copy.steps.some((s) => s.includes('Apri “Carico medio”')),
      `${d}: la formula vive sulla pagina del figlio, va linkata`,
    );
    assert.ok(copy.steps.every((s) => typeof s === 'string' && s.length > 0), `${d}: nessun passo vuoto`);
  }
});

test('unmanned_post: nessuna formula, e lo dichiara', () => {
  const copy = buildFamilyCopy(fakeFamily('unmanned_post', null));
  assert.match(copy.title, /non presidiato/);
  assert.ok(copy.note?.includes('Nessuna formula'));
});
