import type { Checkin } from '@/types';

// Human-readable labels for answer keys
const MORNING_LABELS: Record<string, string> = {
  corpo:      'Dove senti lo stato nel corpo',
  fonte:      'Da dove viene lo stato',
  intenzione: 'Chi vuole essere oggi',
  ostacolo:   'Cosa pesa se non fatto',
};

const EVENING_LABELS: Record<string, string> = {
  momento:            'Momento più autentico della giornata',
  pattern_recognition:'Pattern riconosciuto oggi',
  decision_origin:    'Origine della decisione più importante',
  chiusura:           'Cosa lascia qui prima di dormire',
};

export const DAILY_INSIGHT_PROMPT = (
  checkin: Checkin,
  kbContext: string = '',
): string => {
  const isMorning = checkin.type === 'morning';
  const labelMap = isMorning ? MORNING_LABELS : EVENING_LABELS;

  const answersText = Object.entries(checkin.answers)
    .map(([k, v]) => `${labelMap[k] ?? k}: ${v}`)
    .join('\n');

  return `Sei SELF OS — sistema di intelligenza identitaria.
Un utente ha appena completato il check-in ${isMorning ? 'mattutino' : 'serale'}.
${kbContext ? `\n${kbContext}\n\nUsa questa base psicologica come lente invisibile — non citare mai i framework.\n` : ''}
Stato interno: ${checkin.state_score}/10
${answersText}

Genera una riflessione di 2-3 righe in seconda persona.
NON dare consigli. NON essere generico. NON usare frasi come "è interessante che" o "noto che".
Sii chirurgico: usa le parole esatte dell'utente come specchio.
${isMorning
  ? 'Lega lo stato corporeo all\'intenzione dichiarata. Finisci con una domanda che invita a notare, non ad agire.'
  : 'Lega il pattern riconosciuto alla chiusura. Finisci con una domanda che porta consapevolezza nel sonno.'}
`.trim();
};
