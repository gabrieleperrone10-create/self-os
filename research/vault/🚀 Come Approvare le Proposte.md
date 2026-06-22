---
type: guide
updated: 2026-06-20
---

# 🚀 Come Approvare e Implementare le Proposte

> Questa è la guida operativa del Research Agent.  
> Il ciclo completo dura meno di 5 minuti — il resto lo fa Claude Code.

---

## Il ciclo ogni domenica

```
domenica 09:00
    ↓
Research Agent gira in automatico (launchd)
    ↓
Analisi Opus 4.8 → Proposte Sonnet 4.6
    ↓
Email arriva a gabrieleperrone10@gmail.com
    ↓
TU: leggi, approva in Obsidian
    ↓
TU: dì a Claude Code di implementare
    ↓
Lunedì: proposte nel codice
```

---

## Step 1 — Leggi le proposte

Le proposte sono in `proposals/YYYY-MM-DD.md`.

Ogni file ha:
- **frontmatter** con `status: proposed`
- **sezioni** divise per prompt o area di intervento
- **rationale** del perché Sonnet propone quella modifica
- **diff** testuale (da → a)

---

## Step 2 — Approva in Obsidian

Apri il file `proposals/YYYY-MM-DD.md` e cambia il frontmatter:

```yaml
---
date: 2026-06-22
type: rd-proposal
status: proposed    ← cambia questo
model: claude-sonnet-4-6
---
```

↓

```yaml
---
date: 2026-06-22
type: rd-proposal
status: approved    ← in questo
model: claude-sonnet-4-6
---
```

> Se vuoi approvare solo alcune sezioni, puoi spostare le sezioni approvate in un file separato e cambiare quello.

---

## Step 3 — Implementa con Claude Code

Nella chat di Claude Code, scrivi:

```
implementa le proposte approvate del 2026-06-22
```

Claude legge automaticamente `research/vault/proposals/2026-06-22.md`, applica i diff ai file in `lib/anthropic/prompts/`, e commette le modifiche.

---

## Step 4 — Misura l'impatto

Al prossimo run domenicale, il Research Agent:
- Confronta le metriche con il run precedente
- Valuta se le proposte implementate hanno migliorato qualcosa
- Include il confronto nell'analisi Opus

---

## Struttura del Vault

```
research/vault/
├── 📊 Dashboard.md              ← punto d'ingresso, link a tutto
├── 🚀 Come Approvare.md         ← questa guida
├── findings/
│   ├── personal/                ← analisi percorso Gabriele (Opus)
│   └── aggregate/               ← analisi pattern utenti (Opus, solo 10+ utenti)
├── proposals/
│   └── YYYY-MM-DD.md            ← proposte R&D (Sonnet), cambia status per approvare
└── memory/
    └── state.json               ← stato persistente tra un run e l'altro
```

---

## Automazione (launchd)

Il Research Agent gira ogni **domenica alle 09:00** tramite launchd macOS.

Per verificare che il plist sia caricato:
```bash
launchctl list | grep selfos
```

Per forzare un run manuale:
```bash
cd ~/Desktop/self-os && npm run research
```

Log degli ultimi run:
```bash
tail -100 ~/Desktop/self-os/research/logs/weekly.log
```

---

## Note

- L'analisi personale è sempre attiva (sei solo tu come utente attivo)
- L'analisi aggregata si attiva con 10+ utenti (attualmente saltata)
- Le proposte usano Sonnet 4.6 con caching dei prompt correnti — run successivi nello stesso giorno sono molto più veloci
- Se l'email non arriva: controlla `research/logs/weekly-error.log`
