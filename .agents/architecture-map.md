# SELF OS — Mappa delle Intersezioni

> Documento vivo. Ogni volta che si tocca un file condiviso, si introduce una
> nuova dipendenza incrociata, o si risolve un bug causato da un'intersezione
> non vista, **questo documento va aggiornato nella stessa sessione**.
> Obiettivo: prima di modificare un file, sapere subito chi altro lo usa —
> per intervenire mirati ed evitare di rompere cose "laterali".

---

## 1. Come leggere questa mappa

Per ogni "punto condiviso" sotto trovi: **cosa è**, **chi lo usa**, **perché è
un punto di rischio** (cosa succede se lo cambi senza guardare gli altri).

Quando stai per modificare uno di questi file, prima fai:
```bash
grep -rl "<nome_file_o_simbolo>" app lib components store --include="*.ts" --include="*.tsx"
```
e controlla ogni risultato prima di procedere.

---

## 2. Punti di intersezione critici (toccarli con cura)

### 2.1 `types/index.ts`
**È:** tutti i tipi globali condivisi (Signal, Profile, Scan, Checkin, Pattern,
Decision, CoachClient, WeeklyReport, MonthlyLetter, ScanAnalysis, ecc.)

**Usato da:** praticamente ogni route API e ogni pagina (45+ file). Vedi lista
completa con:
```bash
grep -rl "from '@/types" app lib components store --include="*.tsx" --include="*.ts"
```

**Rischio noto:** quando due feature sono in sviluppo in parallelo (es.
`segnali` e `lab/experiments`), entrambe aggiungono tipi a questo file →
commit intrecciati. **È già successo** (sessione 2026-06-07): `Experiment`,
`ExperimentEntry`, `ExperimentGeneration` e i tipi `segnali` (`Signal`) erano
mescolati nello stesso diff non committato.

**Regola:** se stai lavorando su una feature isolata (non ancora in produzione),
aggiungi i suoi tipi ma **committa solo quelli della tua feature** — usa
`git add -p` o edit chirurgici, non `git add -A`.

### 2.2 `components/shared/sidebar.tsx`
**È:** la navigazione principale (`mainNav` desktop + `mobileBottomNav`
mobile), entrambe array hardcoded di voci `{ href, label, icon }`.

**Rischio noto:** stesso problema di 2.1 — due feature in sviluppo parallelo
aggiungono entrambe la propria voce di nav nello stesso file. **È già
successo**: la voce `/lab` (icona `FlaskConical`) era mescolata con `/segnali`
(icona `Zap`) nello stesso diff.

**Stato attuale (verificare se ancora vero prima di assumere):**
- `mainNav`: Dashboard, Check-in, Identity Map, Mirror, Segnali, Lettere
- `mobileBottomNav`: Home, Check-in, Mappa, Mirror, Segnali
- `/lab` **non è presente** in nessuna delle due — la feature lab esiste nel
  codice (`app/(app)/lab/`) ma non è ancora collegata alla navigazione
  (probabilmente perché non ancora pronta per produzione).

**Regola:** prima di aggiungere una voce, leggi l'intero file — non fare diff
parziali al buio.

### 2.3 `lib/anthropic/client.ts`
**È:** il client Anthropic condiviso (wrapper su `@anthropic-ai/sdk`).

**Usato da:** 12 route API `app/api/ai/**` + `app/api/patterns/analyze`.
Ogni chiamata AI passa da qui — se cambi firma/modello/error handling qui,
impatti TUTTE le feature AI del prodotto in un colpo solo.

### 2.4 `lib/knowledge-base/fetch.ts`
**È:** recupero del contesto psicologico (`knowledge_base` table) iniettato
nei prompt AI.

**Usato da:** analyze-scan, daily-insight, mirror, monthly-letter,
outcome-reflection, weekly-report, patterns/analyze (7 route).

**Rischio:** è un punto di iniezione di contesto condiviso fra prompt molto
diversi — un cambiamento nel formato del contenuto restituito da qui rompe
silenziosamente più prompt insieme (nessun errore TS, solo qualità peggiore
delle risposte AI).

### 2.5 `lib/utils/checkin.ts`
**È:** funzioni `streak`, `averageScore`, `getCheckinType`.

**Usato da:** dashboard, checkin, identity-map, coach (sia lista che dettaglio
cliente).

**Rischio:** è logica di derivazione dati condivisa fra utente finale e vista
coach — un bug qui appare in 4 punti diversi del prodotto contemporaneamente.

### 2.6 `lib/utils/momentum.ts` + `components/shared/momentum-card.tsx` + `lib/anthropic/prompts/momentum-insight.ts`
**È:** un trio strettamente accoppiato — calcolo momentum → card UI → prompt
AI che lo descrive. Modificare la shape dei dati in uno richiede aggiornare
tutti e tre.

### 2.7 `lib/utils/features.ts` (`canAccess`, `requiresPro`)
**È:** gating dei piani (`free`/`pro`/`coach`) per feature.

**Usato da:** identity-map, mirror (al momento). **Nota:** `mirror`,
`identity_map`, `pattern_analysis` sono marcati `// open during beta` — quando
finisce la beta, qui va stretto il gate, e questo cambierà cosa è visibile a
chi.

---

## 3. Tabelle Supabase — chi le tocca

| Tabella             | File che la usano (`.from(...)`) | Note |
|---------------------|----:|------|
| `profiles`          | 18 | tabella più condivisa — auth, plan, coach_id, RLS al centro di tutto |
| `checkins`          | 15 | check-in mattina/sera, streak, pattern recognition |
| `scans`             | 13 | initial scan + risultati + email scan-complete |
| `decisions`         | 11 | mirror + outcome-reflection |
| `patterns`          | 10 | pattern recognition settimanale, identity-map |
| `experiments`       |  8 | feature `lab` (non in produzione/non in nav) |
| `signals`           |  5 | feature `segnali` |
| `experiment_entries`|  5 | feature `lab` |
| `coach_clients`     |  5 | coach layer |
| `weekly_reports`    |  2 | report settimanale AI |
| `monthly_letters`   |  2 | lettera mensile AI |
| `knowledge_base`    |  1 | fetch condiviso, vedi 2.4 |

**Per ricontrollare velocemente:**
```bash
grep -rhoE "\.from\('[a-z_]+'\)" app lib --include="*.ts" --include="*.tsx" | sort | uniq -c | sort -rn
```

---

## 4. Migrazioni — collisioni di numerazione note

Le migrazioni in `supabase/migrations/` hanno **numeri duplicati** perché
sviluppate in branch/sessioni parallele senza coordinamento:

- `002_lab.sql` **e** `002_weekly_reports_monthly_letters.sql`
- `003_knowledge_base.sql` **e** `003_signals.sql`

**Perché è un rischio:** se un domani si introduce un tool di migration
ordinato per nome/numero (es. Supabase CLI collegato), l'ordine di
applicazione fra coppie con lo stesso prefisso è ambiguo/alfabetico, non
cronologico-reale. Finché si applicano le migration manualmente via SQL
Editor (come fatto finora), non causa danni — ma **da tenere d'occhio** se si
passa a un flusso automatizzato.

**Se aggiungi una nuova migrazione:** controlla l'ultimo numero realmente
applicato al DB live (non solo il file più alto nella cartella, perché
potrebbero essercene di non applicate), e usa il numero successivo libero.

---

## 5. Pattern ricorrenti (così non li reinventi diversi ogni volta)

### 5.1 Struttura di una route AI (`app/api/ai/<nome>/route.ts`)
1. `createClient()` da `lib/supabase/server`
2. `supabase.auth.getUser()` → 401 se non autenticato
3. fetch dati rilevanti dal DB (+ eventualmente `knowledge-base/fetch`)
4. costruzione prompt da `lib/anthropic/prompts/<nome>.ts` (mai inline)
5. chiamata a `lib/anthropic/client`
6. parsing/validazione output, salvataggio su DB
7. try/catch con `console.error('[<contesto>]', err)` + risposta JSON di errore

### 5.2 Prompt AI (`lib/anthropic/prompts/*.ts`)
Sempre una funzione che prende dati tipizzati e ritorna una stringa.
Mai chiamate ad Anthropic da qui — solo costruzione testo.

### 5.3 Pagine "cattura" (`segnali`, `checkin`, `mirror`)
`'use client'`, stato locale per submit + error + submitting, fetch verso
route API dedicata, niente chiamate dirette ad Anthropic dal client (regola
del CLAUDE.md, sempre rispettata finora).

---

## 6. Feature "in volo" — stato di integrazione

| Feature | Cartelle | In nav? | Tabelle DB | Note |
|---|---|---|---|---|
| Segnali | `app/(app)/segnali`, `app/api/signals`, `app/api/ai/analyze-signal` | ✅ sì | `signals` | In produzione (deploy `141f19e`, 2026-06-08) |
| Lab/Experiments | `app/(app)/lab`, `app/api/experiments`, `app/api/ai/generate-experiment` | ❌ no | `experiments`, `experiment_entries` | Codice presente ma non linkato in sidebar — verificare se è WIP o dimenticanza prima di toccare |

---

## 7. Procedura quando capita un errore

1. Identifica il file che genera l'errore.
2. Cerca questo file (o i suoi simboli esportati) in questa mappa — è un
   "punto di intersezione" noto? Se sì, leggi la sezione corrispondente
   PRIMA di modificare.
3. Se non è in mappa ma scopri che è condiviso da ≥3 file non ovviamente
   collegati, **aggiungilo qui** (nuova sotto-sezione in §2 o riga in §3).
4. Dopo il fix, se hai scoperto una nuova intersezione o risolto una
   collisione, aggiorna questo documento nello stesso commit/sessione —
   non rimandare, altrimenti il documento marcisce e perde valore.
