// Casi sintetici per la valutazione dei prompt SELF OS.
// Ogni caso: input realistico + criteri specifici che un buon output
// DEVE soddisfare (passati al judge insieme alle rubriche generali).

import type { Checkin, Decision } from '@/types';
import type { MirrorAnswers } from '@/lib/anthropic/prompts/mirror';
import type { ScanAnswers } from '@/types/scan';

let idCounter = 0;
const uid = () => `eval-${++idCounter}`;

export function makeCheckin(partial: Partial<Checkin> & Pick<Checkin, 'type' | 'state_score' | 'answers'>): Checkin {
  return {
    id: uid(),
    user_id: 'eval-user',
    ai_insight: null,
    date: partial.date ?? '2026-06-10',
    created_at: '2026-06-10T08:00:00Z',
    ...partial,
  } as Checkin;
}

export function makeDecision(partial: Partial<Decision> & Pick<Decision, 'description' | 'state_score' | 'origin'>): Decision {
  return {
    id: uid(),
    user_id: 'eval-user',
    ai_mirror: null,
    outcome: null,
    outcome_date: null,
    created_at: partial.created_at ?? '2026-05-01T10:00:00Z',
    ...partial,
  } as Decision;
}

// ============ MIRROR ============

export interface MirrorCase {
  name: string;
  answers: MirrorAnswers;
  pastDecisions: Decision[];
  criteria: string[];
}

export const mirrorCases: MirrorCase[] = [
  {
    name: 'inversione-nobilitata',
    answers: {
      decisione: 'Voglio lanciare un nuovo progetto di consulenza in parallelo a quello attuale',
      body_score: 4,
      fear_under: 'Che il progetto attuale non decolli mai davvero e io resti fermo',
      hidden_cost: 'Tempo tolto al progetto principale che è già in ritardo',
      evolved_self: 'La mia versione evoluta crea sempre nuove opportunità e non si ferma mai',
      clarity_score: 5,
    },
    pastDecisions: [
      makeDecision({ description: 'Aprire il canale YouTube mentre finivo il corso', state_score: 4, origin: 'fear', outcome: 'Canale abbandonato dopo 3 video, corso finito con 4 mesi di ritardo' }),
      makeDecision({ description: 'Iniziare il podcast prima di lanciare il sito', state_score: 5, origin: 'fear', outcome: 'Podcast fermo a 2 episodi' }),
      makeDecision({ description: 'Nuova nicchia di mercato da esplorare', state_score: 4, origin: 'unclear', created_at: '2026-04-15T10:00:00Z' }),
    ],
    criteria: [
      "Deve rilevare l'inversione: 'creare sempre nuove opportunità' è la stessa struttura di 'non completo le cose', rivestita di missione",
      'Deve collegare la decisione attuale al pattern delle decisioni passate (aprire fronti nuovi senza chiudere i vecchi)',
      'NON deve dare consigli né dire cosa fare',
      'La domanda finale deve aprire, non chiudere',
    ],
  },
  {
    name: 'visione-pulita',
    answers: {
      decisione: 'Chiudere il contratto con il cliente che mi paga di più ma mi tratta male',
      body_score: 8,
      fear_under: 'Perdere il 40% del fatturato e dover dire a mia moglie che ho rinunciato a soldi sicuri',
      hidden_cost: 'Ogni lunedì mattina mi sveglio con il nodo allo stomaco',
      evolved_self: 'Avrebbe già chiuso sei mesi fa e usato quello spazio per i clienti giusti',
      clarity_score: 8,
    },
    pastDecisions: [
      makeDecision({ description: 'Alzare i prezzi del 30%', state_score: 7, origin: 'vision', outcome: 'Nessun cliente perso, fatturato cresciuto' }),
    ],
    criteria: [
      'Deve riconoscere che corpo (8) e chiarezza (8) sono coerenti — non inventare conflitti che non ci sono',
      "Deve usare le parole esatte dell'utente (es. 'nodo allo stomaco', 'soldi sicuri')",
      'NON deve dare consigli',
    ],
  },
];

// ============ DAILY INSIGHT ============

export interface DailyInsightCase {
  name: string;
  checkin: Checkin;
  recentCheckins: Checkin[];
  criteria: string[];
}

export const dailyInsightCases: DailyInsightCase[] = [
  {
    name: 'ostacolo-ricorrente-che-si-astrae',
    checkin: makeCheckin({
      type: 'morning',
      state_score: 5,
      answers: {
        corpo: 'Petto, leggera oppressione',
        fonte: 'Ho dormito male pensando al lavoro',
        intenzione: 'Quella che esegue senza rimuginare',
        ostacolo: "Devo sistemare l'esecuzione generale del progetto",
      },
      date: '2026-06-10',
    }),
    recentCheckins: [
      makeCheckin({ type: 'morning', state_score: 6, answers: { ostacolo: 'Finire la pagina di vendita del funnel' }, date: '2026-06-08' }),
      makeCheckin({ type: 'morning', state_score: 5, answers: { ostacolo: 'Il funnel, sempre quello' }, date: '2026-06-09' }),
    ],
    criteria: [
      "Deve nominare la ricorrenza: stesso ostacolo da 3 check-in (il funnel/l'esecuzione)",
      "Deve segnalare che il linguaggio si sta astraendo (da 'la pagina di vendita del funnel' a 'esecuzione generale') — allontanamento dal compito",
      'Massimo 3 frasi, niente consigli',
    ],
  },
  {
    name: 'rottura-di-pattern-con-condizioni',
    checkin: makeCheckin({
      type: 'evening',
      state_score: 7,
      answers: {
        momento: 'Alle 9 di mattina, quando ho aperto la mail difficile invece di "preparare il contesto" per un\'ora',
        pattern_recognition: 'Sì, l\'ho riconosciuto e ho scelto diversamente',
        condizioni: 'L\'avevo deciso la sera prima e l\'avevo scritto sul post-it. E avevo dormito 8 ore, cosa rara',
        decision_origin: 'Visione chiara di dove vado',
        chiusura: 'Ho lasciato aperto il report, ma l\'ho scelto: domani mattina ha la priorità',
      },
    }),
    recentCheckins: [
      makeCheckin({ type: 'evening', state_score: 5, answers: { pattern_recognition: 'Sì, l\'ho riconosciuto ma ci sono caduto lo stesso' }, date: '2026-06-08' }),
      makeCheckin({ type: 'evening', state_score: 4, answers: { pattern_recognition: 'L\'ho riconosciuto solo dopo — a posteriori' }, date: '2026-06-09' }),
    ],
    criteria: [
      'Deve trattare la rottura di pattern come il dato centrale — non come episodio minore né come pretesto per cercare una tensione nascosta',
      "Deve ancorare le condizioni nominate (deciso la sera prima / scritto / 8 ore di sonno) — non parlare genericamente di 'forza di volontà' o 'progresso'",
      'VIETATO tono congratulatorio o motivazionale (niente "ottimo", "bravo", "grande passo")',
      'La domanda finale deve puntare alla replicabilità delle condizioni, non a come si sente',
      'NON deve trattare questo input positivo e concreto come schermatura né inventare crepe',
    ],
  },
  {
    name: 'giornata-funzionale-vs-schermatura',
    checkin: makeCheckin({
      type: 'evening',
      state_score: 8,
      answers: {
        momento: 'La chiamata con il cliente alle 15: ho detto no alla richiesta fuori scope, con calma, senza giustificarmi per dieci minuti come al solito',
        pattern_recognition: 'No, non ho riconosciuto nessun pattern oggi',
        decision_origin: 'Visione chiara di dove vado',
        chiusura: 'Il preventivo nuovo. Scelto: prima volevo rileggere i numeri con la testa fresca',
      },
    }),
    recentCheckins: [],
    criteria: [
      'Input positivo ma CONCRETO (fatti specifici: la chiamata alle 15, il no senza giustificarsi) → NON deve trattarlo come schermatura né cercare la crepa a ogni costo',
      "Deve rispecchiare cosa ha funzionato usando le parole esatte dell'utente (es. 'senza giustificarmi')",
      'Niente consigli, niente celebrazione — rispecchio chirurgico dello stesso registro usato per i blocchi',
      'La domanda finale deve aprire (non sì/no)',
    ],
  },
  {
    name: 'input-monosillabico',
    checkin: makeCheckin({
      type: 'evening',
      state_score: 4,
      answers: { momento: 'boh', pattern_recognition: 'nessuno', decision_origin: 'paura', chiusura: 'fuga' },
    }),
    recentCheckins: [],
    criteria: [
      "Input frettoloso → risposta asciutta, max 1-2 frasi, NESSUNA metafora elaborata",
      "Non deve punire né psicoanalizzare l'utente per la brevità",
    ],
  },
];

// ============ SCAN ANALYSIS ============

export interface ScanCase {
  name: string;
  answers: ScanAnswers;
  criteria: string[];
}

export const scanCases: ScanCase[] = [
  {
    name: 'gap-aspettative-esecuzione',
    answers: {
      vita_3_parole: 'piena, frammentata, in attesa',
      cambio_rimandato: 'Smettere di accettare ogni progetto che arriva. Lo so da due anni.',
      situazione_ripetuta: 'Parto fortissimo, primo mese impeccabile, poi qualcosa di nuovo cattura la mia attenzione e il progetto muore al 70%',
      sabotaggio: 'Quando sto per finire trovo un difetto fondamentale che richiede di ricominciare',
      persone_come_me: 'Le persone come me non possono permettersi di dire di no',
      abbastanza: 'Quando avrò un sistema che genera entrate senza di me',
      chi_rimane: 'Non lo so. È la domanda che evito da sempre.',
      versione_futura_pensa: 'Che sto sprecando il potenziale aspettando il momento perfetto',
      aspettative_su_di_se: 10,
      consistenza_reale: 2,
      energia_mattina: 7,
      completamento_progetti: 3,
    },
    criteria: [
      'expectation_gap DEVE essere presente: aspettative 10/10 vs consistenza 2/10 è il dato strutturale dominante',
      "La lettera deve usare le parole esatte: 'in attesa', 'muore al 70%', 'momento perfetto'",
      "Il loop primario deve catturare la struttura: partenza forte → distrazione nuova → abbandono al 70%",
      "NOTA: il campo identity_target.first_action è BY DESIGN un'azione concreta — non considerarlo violazione della regola niente-consigli",
      'JSON valido conforme allo schema (verificato automaticamente)',
    ],
  },
];
