// Testo della lettura di famiglia (piano §7 / F7). Deterministico, senza AI —
// come copy.ts, è anche il fallback quando la route AI non risponde (§5.3).
//
// Regola di registro: la diagnosi nomina sempre un LIVELLO strutturale, mai una
// colpa. È il correttivo esplicito al modo in cui il "why finding" della Data
// Series è degenerato nella pratica — trovare chi è responsabile del calo. Da
// soli con se stessi quella deriva diventa "non ho disciplina", che non è una
// diagnosi e non è nemmeno vera nella metà dei casi: quando gli allenamenti ci
// sono tutti, la disciplina è precisamente ciò che i dati scagionano.

import type { Association, Diagnosis, FamilyReadout, StatRole } from './family';
import { CONDITION_LABEL } from './copy';

export const ROLE_LABEL: Record<StatRole, string> = {
  quantity: 'Quantità — l’hai fatto?',
  quality: 'Metodo — come l’hai fatto?',
  support: 'Condizione abilitante',
};

/** Versione corta per contesti stretti (riga nella board), dove la domanda non ci sta. */
export const ROLE_LABEL_SHORT: Record<StatRole, string> = {
  quantity: 'Quantità',
  quality: 'Metodo',
  support: 'Supporto',
};

const ROLE_SUGGESTION: Record<StatRole, string> = {
  quantity: 'quanto lavoro hai effettivamente fatto',
  quality: 'come lo stai facendo (progressione, tecnica, intensità)',
  support: 'le condizioni abilitanti: nutrizione, sonno, recupero',
};

export interface FamilyCopy {
  title: string;
  body: string;
  steps: readonly string[];
  /** Nota di metodo sulla lettura, quando serve dichiarare un limite. */
  note: string | null;
}

export function buildFamilyCopy(family: FamilyReadout): FamilyCopy {
  const culprit = family.culprit;
  const culpritCondition = culprit?.readout?.condition?.condition ?? null;
  const diagnosis: Diagnosis = family.diagnosis;

  // I passi della formula NON si innestano qui. Le formule in formulas.ts sono
  // scritte per una stat di produzione, e su un livello di qualità si ribaltano:
  // su una diagnosi "il lavoro c'è, il metodo no" il primo passo di Emergency
  // ("aumenta il volume dell'azione base") contraddice la diagnosi stessa.
  // La formula vive sulla pagina del figlio, che è l'unica fonte: qui si dice
  // SU QUALE livello intervenire e perché, e si rimanda là.
  const openCulprit = culprit
    ? `Apri “${culprit.label}” per la formula di ${CONDITION_LABEL[culpritCondition!]} e i passi in sequenza.`
    : null;

  if (diagnosis === 'insufficient') {
    return {
      title: 'Non abbastanza per una lettura di famiglia',
      body: 'Servono più periodi registrati sul risultato e su almeno un livello di produzione.',
      steps: [],
      note: null,
    };
  }

  if (diagnosis === 'consistent_down' && culprit) {
    return {
      title: `Il problema è a monte: ${culprit.label}`,
      body:
        'Il risultato non si muove perché il lavoro di base non c’è. Su lavoro non fatto ' +
        'non ha senso valutare il metodo: prima torna la produzione, poi si giudica come la fai.',
      steps: [
        `Il livello che cede è “${culprit.label}” (${CONDITION_LABEL[culpritCondition!]}): l'intervento va lì, non sul risultato.`,
        'Non cambiare programma finché la quantità non è tornata: cambieresti una variabile che non hai ancora testato.',
        openCulprit!,
      ],
      note: null,
    };
  }

  if (diagnosis === 'method_failure' && culprit) {
    return {
      title: 'Il lavoro c’è, il metodo no',
      body:
        `Hai fatto quello che avevi pianificato e il risultato non si muove: “${culprit.label}” è ` +
        'la parte che cede. La costanza non è il problema — i tuoi stessi dati la scagionano — ' +
        'quindi la leva è il programma, non lo sforzo.',
      steps: [
        `Cambia il modo, non il volume: “${culprit.label}” è in ${CONDITION_LABEL[culpritCondition!]} mentre il lavoro c'è tutto.`,
        'Fare di più della stessa cosa qui non serve: è già stato fatto e il risultato non si è mosso.',
        'Cambia una cosa sola: se ne cambi tre, il prossimo periodo non saprai quale ha funzionato.',
        openCulprit!,
      ],
      note: null,
    };
  }

  if (diagnosis === 'support_failure' && culprit) {
    return {
      title: `Cede una condizione abilitante: ${culprit.label}`,
      body:
        'Lavoro e metodo tengono. È il contorno a non reggere, ed è lì che si perde il risultato — ' +
        'la parte che di solito non viene misurata e per questo sembra innocente.',
      steps: [
        `Riporta “${culprit.label}” in ordine prima di toccare quello che stai già facendo bene.`,
        'Non aggiungere lavoro per compensare: aggiungeresti carico su una condizione che non regge.',
        openCulprit!,
      ],
      note: null,
    };
  }

  if (diagnosis === 'unmanned_post') {
    const missing = missingRoles(family);
    return {
      title: 'Un posto non presidiato',
      body:
        'Il risultato peggiora e tutto quello che misuri è in ordine. Questo non significa che ' +
        'non ci sia una causa: significa che la causa non è nei tuoi dati. Un fattore che conta ' +
        'non è coperto da nessuna stat.',
      steps: missing.length
        ? [
            'Il livello che ti manca del tutto:',
            ...missing.map((r) => `“${ROLE_LABEL[r].split(' — ')[0]}” — ${ROLE_SUGGESTION[r]}.`),
            'Aggiungilo come figlio di questo risultato e dagli un periodo prima di trarre conclusioni.',
          ]
        : [
            'Tutti e tre i livelli sono coperti e in ordine: allora è la definizione di uno di essi a essere troppo larga.',
            'Chiediti quale stat sta misurando “motion” invece di produzione — attività che sembra lavoro senza produrre il risultato.',
          ],
      note: 'Nessuna formula da applicare: applicarne una a caso è esattamente l’errore che questa lettura serve a evitare.',
    };
  }

  if (diagnosis === 'unexplained_gain' && culprit) {
    return {
      title: 'Il risultato non viene da quello che misuri',
      body:
        `Il risultato migliora mentre “${culprit.label}” è in ` +
        `${CONDITION_LABEL[culpritCondition!]}. Delle due l’una: o è un caso, ` +
        'o questa stat non è davvero il motore del risultato.',
      steps: [
        'Non consolidare ancora: non sai cosa ha prodotto il miglioramento.',
        `Verifica se “${culprit.label}” è la stat giusta per questo risultato, o se ne stai trascurando un’altra.`,
      ],
      note: null,
    };
  }

  return {
    title: 'Sai cosa lo produce',
    body: 'Risultato e livelli di produzione concordano: la catena è verificata.',
    steps: [
      'Non cambiare niente su nessuno dei livelli.',
      'Scrivi cosa hai fatto in questo periodo: è il tuo manuale, e serve quando il risultato si fermerà.',
    ],
    note: null,
  };
}

function missingRoles(family: FamilyReadout): StatRole[] {
  const present = new Set(family.children.map((c) => c.role));
  return (['quantity', 'quality', 'support'] as StatRole[]).filter((r) => !present.has(r));
}

/**
 * Frase dell'associazione osservata. Conteggi grezzi e n esplicito: su una manciata
 * di periodi auto-riportati qualunque formulazione più forte di "associazione"
 * sarebbe falsa precisione.
 */
export function associationSentence(a: Association): string | null {
  if (!a.reportable) return null;
  const total = a.periodsInOrder + a.periodsOut;
  const verso = a.contrast > 0 ? '' : ' — nella direzione opposta a quella attesa';
  return (
    `Quando “${a.childLabel}” produceva, il risultato è migliorato ${a.improvedWhenInOrder} volte su ${a.periodsInOrder}; ` +
    `quando non produceva, ${a.improvedWhenOut} su ${a.periodsOut}${verso}. ` +
    `Osservazione su ${total} periodi: associazione, non causa.`
  );
}
