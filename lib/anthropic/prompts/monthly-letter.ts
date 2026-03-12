import type { Checkin, Decision, Pattern, Scan } from '@/types';

const MONTH_NAMES_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export const MONTHLY_LETTER_PROMPT = (
  checkins: Checkin[],
  decisions: Decision[],
  patterns: Pattern[],
  scan: Scan | null,
  month: number,
  year: number,
  kbContext: string = '',
): string => {
  const monthName = MONTH_NAMES_IT[month - 1];

  const avgScore = checkins.length > 0
    ? (checkins.reduce((s, c) => s + (c.state_score ?? 0), 0) / checkins.length).toFixed(1)
    : 'n/d';

  const visionDecisions = decisions.filter(d => d.origin === 'vision').length;
  const fearDecisions = decisions.filter(d => d.origin === 'fear').length;

  const patternList = patterns
    .map(p => `- ${p.title} (${p.type})`)
    .join('\n');

  const shadowPattern = scan?.analysis?.shadow_pattern?.title ?? 'non definito';
  const expansionZone = scan?.analysis?.expansion_zone?.title ?? 'non definita';

  return `Sei il Sistema Operativo Identitario — SELF OS.
Scrivi la lettera mensile personale per ${monthName} ${year}.
${kbContext ? `\n${kbContext}\n\nUsa l'intera base psicologica — archetipi, loop, IFS, processo di trasformazione — per scrivere una lettera che vada in profondità. Non limitarti a riassumere i dati: rifletti l'identità.\n` : ''}
DATI DEL MESE:
- Check-in: ${checkins.length}
- Stato medio: ${avgScore}/10
- Decisioni: ${decisions.length} (${visionDecisions} visione, ${fearDecisions} paura)
- Pattern emersi: ${patterns.length}

PATTERN RILEVATI:
${patternList || 'Nessuno.'}

PROFILO IDENTITARIO (dallo Scan iniziale):
- Pattern Ombra: ${shadowPattern}
- Zona di Espansione: ${expansionZone}

Scrivi una lettera personale in seconda persona, in italiano, di 4-5 paragrafi.
Inizia con: "Caro [tu stesso]," — usa solo "tu".
Tono: intimo, profondo, onesto come uno specchio fedele.
Paragrafo 1: com'è stato questo mese — stato, presenza, energia.
Paragrafo 2: cosa dicono le tue decisioni di chi sei adesso.
Paragrafo 3: i pattern che emergono e si ripetono.
Paragrafo 4: la tensione tra il tuo pattern ombra e la tua zona di espansione questo mese.
Paragrafo 5 (breve): una frase finale — non un consiglio, ma uno specchio.
NON dare consigli. Solo rifletti. Usa le parole esatte dei dati.`;
};
