export const VOICE_ANALYSIS_PROMPT = (transcript: string): string => `
Hai ricevuto un messaggio vocale trascritto.
Estrai in JSON valido. Nessun testo prima o dopo.

{
  "state_score": numero da 1 a 10 basato sul tono e contenuto emotivo,
  "keywords": ["array", "di", "parole", "chiave", "emotive"],
  "pattern": "pattern psicologico rilevato in una frase (null se non emerge nulla di chiaro)",
  "insight": "2 frasi di riflessione chirurgica in seconda persona. Usa le parole esatte dette dall'utente come specchio. Non dare consigli."
}

Regole:
- state_score: 1 = distress totale, 10 = piena espansione. Basati su tono, parole, contesto.
- keywords: massimo 5, le parole più cariche emotivamente dette dall'utente.
- pattern: null se non emerge nulla di chiaro.
- insight: usa "tu" e le parole esatte dell'utente. Inizia la seconda frase con una domanda aperta.

TRASCRIZIONE:
"${transcript}"
`;
