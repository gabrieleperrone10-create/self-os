import type { Checkin, Decision, Pattern } from '@/types';
import { isPatternBreak } from '@/lib/utils/checkin';

export const WEEKLY_REPORT_PROMPT = (
  checkins: Checkin[],
  decisions: Decision[],
  patterns: Pattern[],
  weekStart: string,
  weekEnd: string,
  kbContext: string = '',
): string => {
  const avgScore = checkins.length > 0
    ? (checkins.reduce((s, c) => s + (c.state_score ?? 0), 0) / checkins.length).toFixed(1)
    : 'n/d';

  const visionDecisions = decisions.filter(d => d.origin === 'vision').length;
  const fearDecisions = decisions.filter(d => d.origin === 'fear').length;

  // Rotture di pattern della settimana + condizioni abilitanti nominate
  const breaks = checkins.filter(isPatternBreak);
  const breakConditions = breaks
    .map(c => c.answers?.condizioni ? `- [${c.date}] ${c.answers.condizioni}` : null)
    .filter(Boolean)
    .join('\n');

  const insights = checkins
    .filter(c => c.ai_insight)
    .map(c => `- ${c.ai_insight}`)
    .join('\n');

  const patternList = patterns
    .map(p => `- ${p.title} (${p.type}, rilevato ${p.frequency} volte)`)
    .join('\n');

  return `Sei il Sistema Operativo Identitario — SELF OS.
Scrivi il report settimanale per l'utente. Settimana dal ${weekStart} al ${weekEnd}.
${kbContext ? `\n${kbContext}\n\nUsa il processo di trasformazione in 5 fasi e gli archetipi come sistema di lettura dei dati. Fai emergere la struttura psicologica profonda, non solo le statistiche.\n` : ''}
DATI DELLA SETTIMANA:
- Check-in completati: ${checkins.length}
- Stato medio: ${avgScore}/10
- Decisioni: ${decisions.length} totali (${visionDecisions} da visione, ${fearDecisions} da paura)
- Rotture di pattern (riconosciuto → scelto diversamente): ${breaks.length}
${breakConditions ? `\nCONDIZIONI ABILITANTI NOMINATE DALL'UTENTE:\n${breakConditions}\n` : ''}

INSIGHT DEI CHECK-IN:
${insights || 'Nessun insight registrato questa settimana.'}

PATTERN ATTIVI:
${patternList || 'Nessun pattern rilevato.'}

Scrivi un report in 3 paragrafi, in seconda persona, in italiano.
Paragrafo 1 (max 3 righe): come hai navigato questa settimana — stato, energia, presenza.
Paragrafo 2 (max 3 righe): i pattern che emergono dalle tue decisioni e check-in. Le rotture di pattern hanno lo stesso peso dei loop: se ci sono, nominale come struttura (cosa le ha rese possibili), non come complimento. Se non ci sono, non inventarle.
Paragrafo 3 (max 2 righe): una domanda diretta che ti lasci per la settimana prossima.
NON dare consigli. Solo rifletti i dati e le parole dell'utente.
Stile: diretto, senza fronzoli. Niente titoli o bullets.`;
};
