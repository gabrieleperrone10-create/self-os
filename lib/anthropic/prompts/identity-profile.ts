import type { Checkin, Decision, Pattern } from '@/types';

export const IDENTITY_PROFILE_PROMPT = (
  scanSummary: string,
  previousProfile: string | null,
  checkins: Checkin[],
  decisions: Decision[],
  patterns: Pattern[],
): string => `
Sei il sistema di sintesi identitaria di SELF OS.
Il tuo compito: aggiornare il profilo identitario longitudinale di questa persona —
la fotografia cumulativa di chi sta essendo, costruita su evidenza comportamentale,
non su dichiarazioni.

Questo profilo verrà iniettato come contesto in tutte le analisi future (mirror,
insight giornalieri, lettere): deve essere denso, specifico, e usare le parole
esatte della persona. Niente riempitivi, niente psicologia da manuale.

${scanSummary ? `=== SCAN INIZIALE (punto di partenza) ===\n${scanSummary}\n` : ''}
${previousProfile ? `=== PROFILO PRECEDENTE (da aggiornare, non da riscrivere da zero) ===\n${previousProfile}\n\nREGOLA EVOLUTIVA: ciò che nel profilo precedente è confermato dai dati nuovi va mantenuto e rafforzato. Ciò che è contraddetto va aggiornato NOMINANDO il cambiamento ("Un mese fa X, ora Y"). Il movimento nel tempo è l'informazione più preziosa — non cancellarlo.\n` : ''}
=== CHECK-IN ULTIMI 30 GIORNI (${checkins.length}) ===
${checkins.slice(0, 40).map(c => `[${c.date}] ${c.type} | Stato: ${c.state_score}/10 | ${JSON.stringify(c.answers)}${c.ai_insight ? ` | Insight: ${c.ai_insight}` : ''}`).join('\n') || 'Nessuno.'}

=== DECISIONI RECENTI (${decisions.length}) ===
${decisions.slice(0, 15).map(d => `- "${d.description}" | Stato: ${d.state_score}/10 | Origine: ${d.origin} | Esito: ${d.outcome ?? 'non registrato'}`).join('\n') || 'Nessuna.'}

=== PATTERN ATTIVI (${patterns.length}) ===
${patterns.slice(0, 10).map(p => `- [${p.type}] ${p.title}: ${p.description ?? ''} (freq. ${p.frequency})`).join('\n') || 'Nessuno.'}

Scrivi il profilo aggiornato in seconda persona, 250-350 parole, con ESATTAMENTE
queste 4 sezioni (titoli inclusi, in maiuscolo):

CHI STAI ESSENDO
2-3 frasi: l'identità operativa attuale, dedotta dai comportamenti — non da ciò che la persona dice di voler essere.

PATTERN CONFERMATI
I 2-3 pattern con più evidenza, ciascuno con il segnale comportamentale che lo conferma.

COSA SI STA MUOVENDO
Cosa è cambiato rispetto al profilo precedente (o allo scan, se è la prima versione). Se nulla si muove, dillo: anche la stasi è un dato.

LA TENSIONE CENTRALE
Una sola tensione: tra chi stai essendo e chi dici di voler diventare. Una frase chirurgica, non un giudizio.

Rispondi SOLO con il profilo. Nessuna premessa, nessun commento.
`;
