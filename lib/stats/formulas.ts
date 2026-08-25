// Formule delle condizioni, riscritte in chiave personale (piano §1.1, §4).
// Passi in sequenza esatta — invertirli è l'errore che la dottrina originale
// considera fatale, ed è la parte da preservare intatta anche riscrivendo il
// registro da organizzativo a personale.
//
// Questo è il fallback deterministico sempre disponibile (§5.3): l'AI della F3
// istanzia questi stessi passi sui dati reali, ma se l'AI non risponde la scheda
// mostra comunque questi passi generici — il modulo non si rompe mai.

import type { Condition } from './engine';

export interface FormulaCopy {
  name: string;
  /** Passi in sequenza esatta — l'ordine è parte della formula, non stile. */
  steps: readonly string[];
}

export const FORMULAS: Record<Condition, FormulaCopy> = {
  non_existence: {
    name: 'Non-Existence',
    steps: [
      'Riprendi il contatto: cosa ti ha fatto smettere di misurarla o farla?',
      'Chiarisci a te stesso perché questa cosa conta, in una frase.',
      'Fai la prossima unità più piccola possibile — non la settimana intera, solo la prossima.',
      'Registrala. Il dato è più importante del risultato, in questa fase.',
    ],
  },
  danger: {
    name: 'Danger',
    steps: [
      'Fermati e gestisci di persona la causa — non delegarla a "farò meglio la prossima volta".',
      'Trova la causa specifica di questo calo, non una spiegazione generica.',
      "Prendi un'azione correttiva oggi, non alla prossima settimana.",
      'Cambia qualcosa nel modo in cui organizzi questa attività, così il calo non si ripeta uguale.',
    ],
  },
  emergency: {
    name: 'Emergency',
    steps: [
      'Aumenta il volume dell’azione base — fanne di più, prima di cambiare metodo.',
      'Cambia qualcosa nel modo in cui la fai, se il volume da solo non basta.',
      'Taglia il superfluo che ti distrae da questa priorità questa settimana.',
      'Ripristina la disciplina minima non negoziabile su questa attività.',
    ],
  },
  normal: {
    name: 'Normal',
    steps: [
      'Non cambiare niente: quello che stai facendo sta funzionando.',
      "Se migliora, scopri cosa l'ha migliorata e continua a farlo — senza abbandonare il resto.",
      'Se peggiora anche di poco, scopri subito perché e rimedia prima che diventi un calo.',
    ],
  },
  affluence: {
    name: 'Affluence',
    steps: [
      'Economizza: non espandere tutto insieme solo perché va bene ora.',
      'Consolida quello che ha già funzionato prima di aggiungere altro.',
      'Investi il surplus in ciò che rende ripetibile questo risultato, non in una tantum.',
      "Scopri cosa ha causato questa affluence e rafforzalo deliberatamente.",
    ],
  },
  power: {
    name: 'Power',
    steps: [
      'Non disconnetterti da ciò che ti ha portato qui — non cambiare metodo adesso.',
      'Scrivi, in poche righe, come si fa: le condizioni che hanno reso possibile questo livello.',
      'Rendilo ripetibile: è un altopiano da cui non vuoi scendere, non un picco da ammirare.',
    ],
  },
};
