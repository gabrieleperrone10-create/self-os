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
  chiusura:           'Incompletamento — per scelta o per fuga',
};

export const DAILY_INSIGHT_PROMPT = (
  checkin: Checkin,
  recentCheckins: Checkin[] = [],
  kbContext: string = '',
): string => {
  const isMorning = checkin.type === 'morning';
  const labelMap = isMorning ? MORNING_LABELS : EVENING_LABELS;

  const answersText = Object.entries(checkin.answers)
    .map(([k, v]) => `${labelMap[k] ?? k}: ${v}`)
    .join('\n');

  // Extract recurring themes from recent checkins of the same type
  const recurringKey = isMorning ? 'ostacolo' : 'pattern_recognition';
  const recentThemes = recentCheckins
    .map(c => c.answers?.[recurringKey] ? `[${c.date}] ${String(c.answers[recurringKey])}` : null)
    .filter(Boolean)
    .join('\n');

  return `Sei SELF OS — sistema di intelligenza identitaria.
Un utente ha appena completato il check-in ${isMorning ? 'mattutino' : 'serale'}.
${kbContext ? `\n${kbContext}\n\nUsa questa base psicologica come lente invisibile — non citare mai i framework.\n` : ''}
Stato interno: ${checkin.state_score}/10
${answersText}
${recentThemes ? `\nCHECK-IN PRECEDENTI — ${isMorning ? 'ostacoli dichiarati' : 'pattern riconosciuti'}:\n${recentThemes}\n\nREGOLA RIPETIZIONE: Se l'utente nomina lo stesso ostacolo o pattern (anche con parole diverse) per 2+ check-in consecutivi, DEVI nominarlo esplicitamente come ricorrente — non come scoperta nuova, come conferma. La ripetizione è il dato più importante: non lasciarla passare. Se il linguaggio si fa più astratto nel tempo (es. da "il funnel" a "l'esecuzione"), segnalalo: l'utente si sta allontanando dal compito, non avvicinando.\n` : ''}
CALIBRA IL REGISTRO: Leggi il livello di investimento dell'input.
- Input breve, monosillabico o frettoloso → rispondi asciutto, max 1-2 frasi. NON elaborare metafore.
- Input ricco e articolato → puoi permetterti più profondità.

Genera una riflessione di 2-3 righe in seconda persona.
NON dare consigli. NON essere generico. NON usare frasi come "è interessante che" o "noto che".
Sii chirurgico: usa le parole esatte dell'utente come specchio.
${isMorning
  ? 'Lega lo stato corporeo all\'intenzione dichiarata. Se l\'intenzione è già apparsa in check-in precedenti, specchia la frequenza — non il contenuto. Finisci con una domanda aperta che NON inizia con "Cosa" e NON può essere risposta con sì o no.'
  : 'Lega il pattern riconosciuto alla chiusura. Se questo pattern è già stato nominato prima, non trattarlo come novità: rispecchia la sua persistenza. Finisci con una domanda aperta che NON può essere risposta con sì o no.'}
`.trim();
};
