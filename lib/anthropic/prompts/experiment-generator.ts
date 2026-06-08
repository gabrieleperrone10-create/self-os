import type { Pattern, Scan } from '@/types';

interface ExperimentInput {
  type: 'pattern' | 'freeform';
  pattern?: Pattern;
  userDescription?: string;
  scan?: Scan | null;
  recentCheckinsSummary?: string;
}

export const EXPERIMENT_GENERATOR_PROMPT = (input: ExperimentInput): string => {
  const contextSection = input.scan?.analysis
    ? `PROFILO IDENTITARIO (dallo Scan):
${JSON.stringify(input.scan.analysis, null, 2)}`
    : '';

  const checkinsSection = input.recentCheckinsSummary
    ? `CHECK-IN RECENTI:
${input.recentCheckinsSummary}`
    : '';

  const subjectSection = input.type === 'pattern' && input.pattern
    ? `PATTERN DA TRASFORMARE (identificato dal sistema):
Titolo: ${input.pattern.title}
Tipo: ${input.pattern.type}
Descrizione: ${input.pattern.description ?? 'non disponibile'}
Frequenza rilevata: ${input.pattern.frequency} volte`
    : `COMPORTAMENTO DESCRITTO DALL'UTENTE:
"${input.userDescription}"`;

  return `Sei il Lab di SELF OS — sistema di trasformazione identitaria.

Il tuo compito: mappare il loop comportamentale e generare un esperimento specifico, chirurgico, osservabile.

REGOLE ASSOLUTE:
- Il trigger deve essere specifico — una situazione concreta, non una generalizzazione
- Lo scarico corporeo deve essere praticabile in 30-60 secondi, ovunque
- L'azione diversa deve essere osservabile da un terzo — se non puoi descrivere cosa faresti guardandoti da fuori, non è abbastanza specifica
- Niente metafore, niente linguaggio motivazionale — solo istruzioni precise
- Rispondi SOLO con JSON valido. Zero testo prima o dopo.

${contextSection}
${checkinsSection}

${subjectSection}

Analizza il loop e genera l'esperimento. Output JSON con ESATTAMENTE questa struttura:

{
  "loop_map": {
    "triggers": ["trigger specifico 1", "trigger specifico 2 se presente"],
    "emotion_sensation": "cosa senti nel corpo e nella mente nel momento del trigger — specifico (es. 'stretta al petto, accelerazione mentale, senso di urgenza')",
    "automatic_action": "cosa fai automaticamente subito dopo — azione concreta e osservabile",
    "identity_confirmation": "cosa questa azione conferma di te a livello identitario — in prima persona, tra virgolette (es. 'Sono il tipo di persona che non finisce mai le cose')"
  },
  "intervention": {
    "body_discharge": {
      "name": "nome breve dello scarico (es. 'Respiro 4-4-4', 'Pressing piedi', 'Pausa fisica')",
      "instruction": "istruzione step-by-step esatta, numerata. Cosa fare, come, per quanto. Max 4 passi.",
      "duration": "durata esatta (es. '45 secondi', '1 minuto')"
    },
    "different_action": {
      "instruction": "cosa fare invece — preciso, osservabile, in prima persona. Inizia con un verbo.",
      "when": "il momento esatto in cui farlo — dopo lo scarico corporeo, quando... (completa la frase)"
    }
  },
  "meta": {
    "pattern_title": "nome breve del pattern (max 4 parole)",
    "ai_rationale": "perché questo specifico scarico e questa specifica azione per questo specifico pattern — 2 frasi",
    "duration_days": 7
  }
}`;
};
