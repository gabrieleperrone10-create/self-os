import type { ScanAnswers } from '@/types/scan';

export const SCAN_ANALYSIS_PROMPT = (
  answers: ScanAnswers,
  kbContext: string = '',
): string => {
  const answersText = Object.entries(answers)
    .map(([q, a]) => {
      const val = Array.isArray(a) ? a.join(', ') : String(a);
      return `[${q}] ${val}`;
    })
    .join('\n');

  return `Sei SELF OS — un sistema di intelligenza identitaria.
Hai appena ricevuto le risposte di un utente a 150 domande di mappatura psico-comportamentale.
${kbContext ? `\n${kbContext}\n\nUsa questa base psicologica per identificare gli archetipi, i loop e i framework con precisione. Fai riferimento agli archetipi specifici (S1-S12) quando sono chiaramente rilevanti.\n` : ''}
Il tuo compito: analizza tutte le risposte e produci un report identitario completo.

REGOLE:
- Usa le parole ESATTE dell'utente come specchio — non parafrasare, specchia
- Sii chirurgico e specifico — niente banalità, niente generalità
- Scrivi sempre in seconda persona (tu/tua)
- Identifica i pattern che si ripetono attraverso le 7 sezioni
- Se trovi autovalutazioni numeriche in aree opposte (es. aspettative 10/10 e consistenza 1/10), il campo expectation_gap è obbligatorio e deve nominare la tensione con precisione
- Rispondi SOLO con JSON valido. Zero testo prima o dopo.

Il JSON deve avere ESATTAMENTE questa struttura:

{
  "archetype_primary": {
    "id": "S1|S2|S3|S4|S5|S6|S7|S8|S9|S10|S11|S12",
    "title": "Nome archetipo",
    "score": 0-100,
    "description": "2-3 frasi specifiche su come questo archetipo si manifesta in questa persona. Usa le sue parole."
  },
  "archetype_secondary": {
    "id": "codice archetipo",
    "title": "Nome archetipo",
    "score": 0-100,
    "description": "Come interagisce con il primario nella vita concreta di questa persona."
  },
  "archetype_tertiary": {
    "id": "codice archetipo",
    "title": "Nome archetipo",
    "score": 0-100,
    "description": "Ruolo terziario, se significativo."
  },
  "spiral_level": "Beige|Viola|Rosso|Blu|Arancione|Verde|Giallo|Turchese",
  "spiral_description": "Da dove opera questa persona ora e verso dove tende — 1 frase.",
  "loop_primary": {
    "area": "area di vita più colpita (es. Business, Relazioni, Finanze)",
    "trigger": "situazione specifica che innesca il loop — usa esempi dalle sue risposte",
    "thought": "il pensiero automatico — scrivi tra virgolette come se fosse la sua voce interna",
    "behavior": "il comportamento che segue — specifico, concreto",
    "result": "il risultato ricorrente che si trova",
    "reinforcement": "cosa si racconta per giustificarlo — tra virgolette"
  },
  "loop_secondary": {
    "area": "seconda area colpita",
    "trigger": "trigger specifico",
    "thought": "pensiero automatico tra virgolette",
    "behavior": "comportamento concreto",
    "result": "risultato ricorrente",
    "reinforcement": "auto-narrazione tra virgolette"
  },
  "loop_tertiary": {
    "area": "terza area se rilevante",
    "trigger": "trigger",
    "thought": "pensiero tra virgolette",
    "behavior": "comportamento",
    "result": "risultato",
    "reinforcement": "narrazione tra virgolette"
  },
  "belief_limiting_primary": {
    "text": "credenza limitante primaria — scrivi come frase in prima persona tra virgolette",
    "origin": "probabile origine da storia e radici — 1 frase"
  },
  "belief_limiting_secondary": {
    "text": "seconda credenza limitante tra virgolette",
    "origin": "origine probabile — 1 frase"
  },
  "belief_resource": {
    "text": "credenza risorsa che questa persona ha già — tra virgolette in prima persona"
  },
  "expectation_gap": {
    "declared_expectation": "cosa si aspetta da sé — frase in prima persona dalle sue risposte",
    "observed_behavior": "cosa fa realmente — comportamento opposto, specifico, dalle stesse risposte",
    "gap_dynamic": "come questo gap genera il loop principale — 1 frase chirurgica. Non iniziare con 'Questo significa che'."
  },
  "wheel_expansion": ["area1", "area2", "area3"],
  "wheel_loops": ["area1", "area2"],
  "wheel_priority": {
    "area": "area prioritaria per la crescita",
    "reason": "perché questa area prima — 1 frase specifica"
  },
  "identity_target": {
    "name": "nome o titolo che l'utente ha dato alla sua versione evoluta, o che emerge dalle risposte",
    "shift_from": "identità attuale in una frase, colta in azione",
    "shift_to": "identità target in una frase — chi diventa",
    "first_action": "la prima azione concreta dalla nuova identità — specifica, pratica"
  },
  "letter": "Lettera di 5-6 frasi in seconda persona. Tono: qualcuno che ti conosce profondamente e ti vede con chiarezza e rispetto. Usa le sue parole esatte. Non consigliare — riflettere. Inizia con: 'Quello che emerge da tutto ciò che hai condiviso è questo:'"
}

RISPOSTE UTENTE (150 domande, 7 sezioni):
${answersText}
`;
};
