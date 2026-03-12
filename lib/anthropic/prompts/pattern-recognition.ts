import type { Checkin } from '@/types';

export const PATTERN_RECOGNITION_PROMPT = (
  checkins: Checkin[],
  kbContext: string = '',
): string => `
Sei il sistema di riconoscimento pattern di SELF OS.
Analizza questi check-in degli ultimi 30 giorni e identifica i pattern ricorrenti.
${kbContext ? `\n${kbContext}\n\nUsa gli archetipi e i framework come sistema di classificazione preciso. I pattern che identifichi devono essere radicati nella struttura psicologica di SELF OS, non generici.\n` : ''}
Rispondi SOLO con JSON valido:
{
  "patterns": [
    {
      "type": "shadow | expansion | belief | state",
      "title": "nome del pattern (max 4 parole)",
      "description": "cosa si ripete e quando (2 frasi)",
      "frequency": numero_di_occorrenze,
      "trigger": "cosa sembra attivarlo"
    }
  ],
  "weekly_insight": "una frase sola, chirurgica, su ciò che emerge questa settimana"
}

CHECK-IN:
${checkins.map(c => `[${c.date}] ${c.type} | Stato: ${c.state_score}/10 | ${JSON.stringify(c.answers)}`).join('\n')}
`;
