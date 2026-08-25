// Catalogo di stat proposte per area — piano §3.2. Evita la pagina bianca in
// onboarding: l'utente parte da qui o scrive una stat propria. `mode` e
// `direction` sono precompilati ma restano modificabili in creazione.

import type { Direction, Mode } from './engine';

export type Area = 'corpo' | 'dieta' | 'lavoro' | 'relazioni' | 'mente' | 'soldi';

export const AREAS: readonly { value: Area; label: string }[] = [
  { value: 'corpo', label: 'Corpo' },
  { value: 'dieta', label: 'Dieta' },
  { value: 'lavoro', label: 'Lavoro' },
  { value: 'relazioni', label: 'Relazioni' },
  { value: 'mente', label: 'Mente' },
  { value: 'soldi', label: 'Soldi' },
];

export interface StatPreset {
  key: string;
  label: string;
  area: Area;
  unit: string | null;
  direction: Direction;
  mode: Mode;
  period: 'day' | 'week';
  definitionHint: string;
}

export const STAT_PRESETS: readonly StatPreset[] = [
  { key: 'allenamenti', label: 'Allenamenti', area: 'corpo', unit: null, direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Cosa conta come un allenamento? (durata minima, tipo)' },
  { key: 'ore-sonno', label: 'Ore di sonno', area: 'corpo', unit: 'ore/notte', direction: 'up', mode: 'maintain', period: 'day', definitionHint: 'Media ore dormite per notte, questa settimana' },
  { key: 'peso', label: 'Peso', area: 'corpo', unit: 'kg', direction: 'down', mode: 'maintain', period: 'week', definitionHint: 'Peso rilevato nelle stesse condizioni (es. mattina a digiuno)' },
  { key: 'pasti-in-target', label: 'Pasti in target', area: 'dieta', unit: null, direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Cosa rende un pasto "in target"?' },
  { key: 'giorni-senza-sgarro', label: 'Giorni senza sgarro', area: 'dieta', unit: null, direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Cosa conta come sgarro per te, di preciso?' },
  { key: 'alcolici', label: 'Alcolici', area: 'dieta', unit: 'unità', direction: 'down', mode: 'maintain', period: 'week', definitionHint: 'Unità alcoliche standard consumate' },
  { key: 'deep-work', label: 'Ore di deep work', area: 'lavoro', unit: 'ore', direction: 'up', mode: 'grow', period: 'week', definitionHint: 'Cosa qualifica come deep work (niente notifiche, blocco di almeno X minuti)?' },
  { key: 'unita-prodotte', label: 'Unità prodotte', area: 'lavoro', unit: null, direction: 'up', mode: 'grow', period: 'week', definitionHint: 'Cosa conta come una unità (spedito, scritto, venduto)?' },
  { key: 'entrate', label: 'Entrate', area: 'soldi', unit: '€', direction: 'up', mode: 'grow', period: 'week', definitionHint: 'Entrate nette, esclusi movimenti tra conti propri' },
  { key: 'risparmio', label: 'Risparmio', area: 'soldi', unit: '€', direction: 'up', mode: 'grow', period: 'week', definitionHint: 'Quanto accantonato, non speso' },
  { key: 'spese-discrezionali', label: 'Spese discrezionali', area: 'soldi', unit: '€', direction: 'down', mode: 'maintain', period: 'week', definitionHint: 'Spese fuori dalle voci fisse/necessarie' },
  { key: 'conversazioni-significative', label: 'Conversazioni significative', area: 'relazioni', unit: null, direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Cosa rende una conversazione "significativa" per te?' },
  { key: 'tempo-di-qualita', label: 'Tempo di qualità', area: 'relazioni', unit: 'ore', direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Tempo con attenzione piena, non in parallelo ad altro' },
  { key: 'sessioni-pratica', label: 'Sessioni di pratica', area: 'mente', unit: null, direction: 'up', mode: 'maintain', period: 'week', definitionHint: 'Meditazione, journaling, o la tua pratica specifica' },
  { key: 'rotture-pattern', label: 'Rotture di pattern viste', area: 'mente', unit: null, direction: 'up', mode: 'grow', period: 'week', definitionHint: 'Volte in cui hai visto un pattern automatico e scelto diversamente' },
];

export const MAX_ACTIVE_STATS = 5;
