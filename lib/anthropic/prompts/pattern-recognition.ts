import type { Checkin } from '@/types';

export const PATTERN_RECOGNITION_PROMPT = (
  checkins: Checkin[],
  kbContext: string = '',
): string => `
Sei il sistema di riconoscimento pattern di SELF OS.
Analizza questi check-in degli ultimi 30 giorni e identifica i pattern ricorrenti.
${kbContext ? `\n${kbContext}\n\nUsa gli archetipi e i framework come sistema di classificazione preciso. I pattern che identifichi devono essere radicati nella struttura psicologica di SELF OS, non generici.\n` : ''}
Cerca con lo STESSO rigore due direzioni opposte:
- Pattern disfunzionali (shadow, belief limitanti, stati ricorrenti): trigger → comportamento → costo.
- Pattern funzionali (expansion): momenti in cui l'utente ha riconosciuto un pattern e ha scelto diversamente, stati alti con cause nominate, decisioni da visione ripetute. Per questi il "trigger" è la CONDIZIONE ABILITANTE: cosa c'era (sonno, decisione presa la sera prima, contesto, persona) quando ha funzionato.

REGOLA ANTI-ANEDDOTO: un pattern funzionale senza condizione abilitante identificata non è un pattern, è un aneddoto — non includerlo. Vale anche al contrario: non gonfiare un episodio singolo a pattern; frequency riflette occorrenze reali nei dati.
REGOLA ANTI-CHEERLEADING: descrivi i pattern expansion con lo stesso tono chirurgico degli shadow. Niente linguaggio motivazionale: struttura, condizioni, replicabilità.

Rispondi SOLO con JSON valido:
{
  "patterns": [
    {
      "type": "shadow | expansion | belief | state",
      "title": "nome del pattern (max 4 parole)",
      "description": "cosa si ripete e quando (2 frasi)",
      "frequency": numero_di_occorrenze,
      "trigger": "cosa sembra attivarlo (per expansion: la condizione abilitante)"
    }
  ],
  "weekly_insight": "una frase sola, chirurgica, su ciò che emerge questa settimana"
}

CHECK-IN:
${checkins.map(c => `[${c.date}] ${c.type} | Stato: ${c.state_score}/10 | ${JSON.stringify(c.answers)}`).join('\n')}
`;
