# SELF OS — Research Vault

> Ultimo aggiornamento: 2026-07-05

---

## Metriche Sistema

| Metrica | Valore |
|---------|--------|
| Utenti totali | 9 |
| Check-in totali | 55 |
| Stato medio mattina | 7.2 |
| Stato medio sera | 7.2 |
| Pattern attivi | 17 |
| Decisioni registrate | 5 |
| Analisi aggregata attiva | Sì |

---

## Findings Aggregati
- [[findings/aggregate/2026-07-05]]
- [[findings/aggregate/2026-06-05]]

## Findings Personali
- [[findings/personal/2026-07-05]]
- [[findings/personal/2026-06-22]]
- [[findings/personal/2026-06-05]]

## Proposte R&D
- [[proposals/2026-07-05]]
- [[proposals/2026-06-22]]
- [[proposals/2026-06-05]]

---

## Workflow (cosa fai tu, cosa fa il sistema)

**Automatico — `npm run research`:**
1. Export tutti i dati da Supabase → JSON locale
2. Haiku comprime i JSON in narrativa densa
3. Opus analizza i pattern (personale sempre, aggregato solo con 10+ utenti)
4. Sonnet produce proposte con diff ai prompt
5. Stato salvato per confronto al prossimo run

**Manuale — tu in Obsidian:**
1. Leggi findings: aggregate → personal
2. Leggi proposals: valuta ogni sezione
3. Sulle sezioni che approvi → cambia frontmatter `status: proposed` → `status: approved`
4. Di' a Claude Code: *"implementa le proposte approvate di oggi"*
5. Claude legge il file, applica i diff ai prompt in `lib/anthropic/prompts/`
6. Al run successivo, l'agente misura l'impatto

```bash
npm run research          # tutto: export + analisi
npm run research:export   # solo export dati
npm run research:agent    # solo analisi (dati già presenti)
```
