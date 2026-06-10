// ─────────────────────────────────────────────────────────────────────────────
// HAIKU 4.5 — Compression
// No analysis — only lossless compression of the signal.
// ─────────────────────────────────────────────────────────────────────────────

export function compressAggregatePrompt(data: unknown): string {
  return `You are a data compression assistant for an identity coaching system.
Convert this raw JSON into a dense narrative that preserves EVERY psychologically relevant signal.
Do NOT analyze or interpret — only compress. A researcher will analyze later.

Rules:
- Keep all exact dates
- Keep all numerical scores (state_score, frequency)
- Keep exact user words and phrases verbatim (in quotes)
- Describe observable behavioral patterns (repetitions, gaps, trends)
- Summarize AI-generated insights faithfully
- Group by: scans, checkins (morning/evening separately), patterns, decisions
- Max 1800 words. Dense, no filler.

RAW DATA:
${JSON.stringify(data, null, 2)}`
}

export function compressPersonalPrompt(data: unknown): string {
  return `You are a data compression assistant for an identity coaching system.
Convert this personal user data into a dense chronological narrative that preserves EVERY detail.
Do NOT analyze — only compress. A researcher will analyze later.

Rules:
- Preserve exact dates in chronological order
- Keep all state_score values with date and type (morning/evening)
- Quote exact user words/phrases verbatim
- Include AI-generated insights verbatim — they are evidence
- Note gaps: missing checkins, null outcomes, unanswered questions
- Max 2000 words. Dense, chronological, no filler.

PERSONAL DATA:
${JSON.stringify(data, null, 2)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// OPUS 4.8 — Deep Analysis
// Receives compressed summaries + delta context from previous run.
// ─────────────────────────────────────────────────────────────────────────────

export function aggregateAnalysisPrompt(compressed: string, deltaContext: string): string {
  return `Sei il Research Agent di SELF OS — sistema di intelligenza identitaria.

Ricevi una sintesi compressa dei dati aggregati (anonimizzati) + il contesto dell'analisi precedente.
Analizza i pattern psicologici profondi. Non riformulare i dati — interpretarli.
Se i dati sono pochi, estrai ogni segnale e indica dove i dati futuri saranno più rivelatori.

CONTESTO DELTA (cosa è cambiato dall'ultima analisi):
${deltaContext}

DATI COMPRESSI:
${compressed}

---

Produci un'analisi in markdown. Cita dati reali, usa parole esatte dalle risposte.

## Delta dall'Ultima Analisi
Cosa si è mosso significativamente? Cosa è peggiorato, migliorato, rimasto uguale?
Se è la prima analisi, scrivi: "Baseline — nessun confronto disponibile."

## Pattern Psicologici Dominanti
Temi frequenti. Parole/concetti che si ripetono. Strutture profonde.

## Qualità delle Analisi AI Prodotte
Le analisi generate (shadow_pattern, core_wound, expansion_zone, next_edge) erano chirurgiche o generiche?
Dove l'AI ha colpito nel segno? Dove ha mancato? Esempi specifici.

## Stato Interno: Tendenze e Anomalie
Distribuzione state_score. Trend mattina/sera. Picchi/crolli. Correlazioni.

## Pattern Decisionali
Distribuzione paura vs visione. In quali stati si decide come? Decisioni mai chiuse.

## Gap del Sistema
Cosa i dati NON catturano che sarebbe rilevante? Quali pattern sfuggono alle categorie attuali?

## Ipotesi di Ricerca
3-5 ipotesi verificabili. Formato: "Se X allora Y" — con metrica di verifica.

## Segnali Deboli
Osservazioni non ancora significative ma da monitorare.`
}

export function personalAnalysisPrompt(compressed: string, deltaContext: string): string {
  return `Sei il Research Agent di SELF OS — analisi profonda del percorso personale del fondatore.

I suoi dati sono il banco di test primario. Analisi per uso interno R&D.
Usa le sue parole esatte come specchio. Sii preciso, non gentile.

CONTESTO DELTA (cosa è cambiato dall'ultima analisi):
${deltaContext}

DATI COMPRESSI (cronologici):
${compressed}

---

## Delta dall'Ultima Analisi
Cosa è cambiato nel suo percorso dall'ultima analisi? Nuovi pattern emersi, vecchi risolti o approfonditi?
Se è la prima analisi, scrivi: "Baseline — nessun confronto disponibile."

## Mappa del Viaggio
Timeline dall'inizio ad oggi. Momenti di svolta osservati nei dati, non dichiarati.

## Pattern Strutturali
I pattern ricorrenti nei *comportamenti* (non quelli dichiarati).
Come si manifestano nel tempo? Si intensificano, attenuano, trasformano?

## Andamento Stato Interno
Media mattina vs sera. Trend. Giorni di collasso/picco.
Correlazioni: stato → tipo di risposta, stato → tipo di decisione.

## Qualità degli Insight AI Ricevuti
Ogni insight generato: era chirurgico o generico? Usava le sue parole?
Quale ha avuto potenziale impatto maggiore? Quale ha mancato e perché?

## Pattern Decisionale
Come decide? In quali stati prende decisioni da paura vs visione?
Decisioni mai chiuse: cosa rivelano?

## Ciò Che Il Sistema Non Vede
Cosa manca per una mappa completa? Quali domande andrebbero aggiunte per questo profilo?

## Next Edge Reale
Basandoti solo sui comportamenti osservati (non su ciò che ha dichiarato), qual è la vera frontiera adesso?`
}

// ─────────────────────────────────────────────────────────────────────────────
// SONNET 4.6 — R&D Proposals
// Split into static (cached) + dynamic (not cached).
// Static includes current prompt source — large, invariant between runs.
// ─────────────────────────────────────────────────────────────────────────────

export function rdProposalsStaticContext(currentPrompts: Record<string, string>): string {
  return `Sei il Chief Research Officer di SELF OS — sistema di intelligenza identitaria.

Trasforma analisi psicologiche in proposte concrete e implementabili.

REGOLE:
- Ogni proposta cita l'evidenza specifica dal dato che la giustifica
- Modifiche ai prompt: includi il testo esatto da cambiare (diff o riscrittura)
- Priority: HIGH / MEDIUM / LOW
- Effort: SMALL (< 1h) / MEDIUM (< 1 giorno) / LARGE (> 1 giorno)
- When: classifica ogni proposta con UNO di questi tre valori e motiva la scelta:
    SUBITO       — l'evidenza è chiara adesso, implementare migliora già il prossimo check-in, nessuna dipendenza bloccante
    PIÙ AVANTI   — valida ma dipende da più utenti, più dati, o da un'altra proposta implementata prima; specifica la condizione che sblocca (es. "quando ci sono 10+ utenti", "dopo aver implementato 1.1")
    MONITORARE   — segnale debole o non ancora abbastanza chiaro; tieni d'occhio nelle prossime analisi senza agire ora
- Dati insufficienti per una sezione → scrivi "Dati insufficienti — monitorare" e vai avanti
- Solo proposte basate su pattern osservati, non su teoria

PROMPT ATTUALI DEL SISTEMA (sorgente TypeScript):
${JSON.stringify(currentPrompts, null, 2)}`
}

export function rdProposalsDynamicInput(
  aggAnalysis: string,
  perAnalysis: string,
  approvedProposals: string[]
): string {
  const approvedSection = approvedProposals.length > 0
    ? `PROPOSTE APPROVATE DA IMPLEMENTARE (dall'ultima analisi):\n${approvedProposals.join('\n')}\n\nPer ognuna: conferma se i dati attuali supportano ancora l'implementazione, o se il contesto è cambiato.\n\n---\n\n`
    : ''

  return `${approvedSection}ANALISI AGGREGATA (cross-utente):
${aggAnalysis || 'Non disponibile (utenti insufficienti per analisi aggregata).'}

---

ANALISI PERSONALE (fondatore):
${perAnalysis}

---

Produci il documento proposte R&D:

## 1. Impatto Proposte Precedenti
Se esistono proposte approvate, valuta: i dati attuali mostrano un effetto misurabile dopo l'implementazione?
Metriche prima vs dopo. Se non ci sono proposte precedenti: "Prima analisi — sezione non applicabile."

## 2. Miglioramenti ai Prompt Esistenti
Per ogni prompt da migliorare:
**Problema** (evidenza dal dato) | **Proposta** (testo esatto) | **Perché funziona meglio** | Priority | Effort

## 3. Nuove Domande da Aggiungere
Domande mancanti (scan / check-in mattina / sera / mirror):
Testo esatto | Blocco psicologico | Cosa cattura che ora manca | Dove inserirla

## 4. Feature di Analisi da Sviluppare
Funzionalità analitiche nuove con dati già disponibili:
Descrizione | Valore psicologico | Implementazione tecnica | Priority | Effort

## 5. Alert Automatici da Implementare
Pattern che dovrebbero triggerare un intervento:
Trigger | Tipo di intervento | Come implementarlo

## 6. Esperimenti da Avviare
Ipotesi | Metodo | Metrica di successo | Durata stimata`
}
