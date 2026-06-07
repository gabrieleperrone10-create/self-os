import type { Pattern, Signal } from '@/types';

export const SIGNAL_ANALYSIS_PROMPT = (
  signal: { content: string; state_score: number },
  activePatterns: Pick<Pattern, 'title' | 'type' | 'frequency'>[],
  recentSignals: Pick<Signal, 'content' | 'created_at'>[],
): string => {
  const patternsText = activePatterns.length > 0
    ? `PATTERN ATTIVI:\n${activePatterns.map(p => `- ${p.title} (${p.type}, ${p.frequency}x)`).join('\n')}`
    : '';

  const recentText = recentSignals.length > 0
    ? `SEGNALI RECENTI:\n${recentSignals.slice(0, 5).map(s =>
        `- "${s.content}" [${new Date(s.created_at).toLocaleDateString('it-IT')}]`
      ).join('\n')}`
    : '';

  return `Sei SELF OS — sistema di intelligenza identitaria.
Un utente ha appena catturato un segnale spontaneo fuori dagli orari di check-in.

SEGNALE: "${signal.content}"
STATO AL MOMENTO: ${signal.state_score}/10

${patternsText}
${recentText}

Rispondi con 1-2 frasi in seconda persona. Regole:
- Se il segnale si collega a un pattern già identificato, nominalo esplicitamente.
- Se si ripete rispetto a segnali recenti, segnala la frequenza ("è la terza volta...").
- Se è nuovo e non si collega a niente, identificalo come segnale da monitorare.
- NON dare consigli. Solo specchio del dato.
- Tono: preciso, clinico, senza parole di conforto o incoraggiamento.
- Inizia sempre con ciò che il segnale rivela, non con "Noto che" o "È interessante".`.trim();
};
