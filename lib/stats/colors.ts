// Colori delle condizioni — condivisi tra board, dettaglio e grafico.
// Riusa la palette del design system dove il significato calza (Normal = pattern,
// Affluence = gold, Power = identità); Danger riusa il rosso già usato in Lab
// per l'esito peggiore (#B45454); Emergency è l'unico colore nuovo, un ambra
// più smorzato del gold per non confondersi con l'accento del brand.

import type { Condition } from './engine';

export const CONDITION_COLOR: Record<Condition, string> = {
  non_existence: 'var(--text-muted)',
  danger: '#B45454',
  emergency: '#B8925A',
  normal: 'var(--pattern)',
  affluence: 'var(--gold)',
  power: 'var(--identita)',
};
