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
- `mainNav`: Dashboard, Check-in, Identity Map, Distanza, Mirror, Lab,
  Segnali, Lettere — più "Scan iniziale" sempre visibile, "Clienti"
  (`/coach`) per ruolo `coach`/`admin`, "Admin" (`/admin`, icona `Shield`)
  solo per `admin` (aggiunto sessione 2026-06-10 sera, vedi §2.9)

**Gap trovato e fixato 2026-06-11:** quando è stata aggiunta la voce
"Clienti" per `role === 'admin'`, il gate di accesso in
`app/(app)/coach/page.tsx` (`if (profile?.role !== 'coach' && profile?.plan
!== 'coach') redirect('/settings')`) non è stato aggiornato — un admin che
clicca "Clienti" veniva rediretto a `/settings` senza accorgersene. Fix:
aggiunto `&& profile?.role !== 'admin'` alla condizione. Per un admin senza
righe in `coach_clients` come coach, `/coach` mostra ora correttamente lo
stato vuoto ("Nessun cliente attivo ancora") + il proprio invite link — è
atteso, non un bug residuo. **Pattern da ricontrollare:** ogni volta che si
aggiunge `role === 'admin'` a una condizione di visibilità in
`sidebar.tsx`, controllare se la pagina di destinazione ha un proprio gate
che va allineato allo stesso modo (`/coach/[clientId]` non ha gate di ruolo,
si basa solo sull'esistenza della riga `coach_clients` + RLS, quindi per un
admin senza relazioni resterebbe `notFound()` — accettabile finché l'admin
usa `/admin/users/[id]` per il dettaglio).
- `mobileBottomNav`: Home, Check-in, Mirror, Lab, Segnali — `/admin` non è
  presente qui (raggiungibile solo da desktop o overlay mobile via hamburger)

**Regola:** prima di aggiungere una voce, leggi l'intero file — non fare diff
parziali al buio.

### 2.3 `lib/anthropic/client.ts`
**È:** il client Anthropic condiviso (wrapper su `@anthropic-ai/sdk`).

**Usato da:** 12 route API `app/api/ai/**` + `app/api/patterns/analyze`.
Ogni chiamata AI passa da qui — se cambi firma/modello/error handling qui,
impatti TUTTE le feature AI del prodotto in un colpo solo.

**Routing modelli (sessione 2026-07-12):**
- `AI_MODEL = 'claude-sonnet-5'` — TUTTE le chiamate con AI_MODEL passano
  `thinking: NO_THINKING` (Sonnet 5 attiva l'adaptive thinking se `thinking`
  è omesso → consumerebbe max_tokens e sposterebbe il testo fuori da
  `content[0]`). Se aggiungi una nuova route su AI_MODEL, includi
  `thinking: NO_THINKING`.
- `createDeepMessage()` — Fable 5 (`DEEP_MODEL`) con fallback automatico su
  Opus 4.8 per refusal/errore. Usata da `lib/ai/identity-profile.ts` e
  `generateMonthlyLetter` in `lib/ai/reports.ts`. Con Fable 5 il thinking è
  sempre attivo: MAI passare `thinking`, e il testo va estratto con
  `firstText(message)` (il content può aprirsi con blocchi thinking).
  Le route che la ospitano hanno `maxDuration = 300` (daily-insight per
  l'after(), monthly-letter, cron/morning) — non riportarle a 60.
- Tokenizer Sonnet 5 ~+30% token a parità di testo: `analyze-scan` è a
  `max_tokens: 6000` per questo. Occhio ai max_tokens stretti altrove.

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

### 2.7-bis Nuovi punti condivisi (sessione 2026-06-10)
- **`lib/anthropic/parsers.ts` + `lib/anthropic/schemas.ts`**: parsing/validazione
  output AI per TUTTE le route con output JSON (5). Gli schemi usano
  `satisfies z.ZodType<T>` contro le interfacce esistenti: se cambi un tipo di
  output, lo schema va aggiornato nello stesso commit (TS te lo impone).
- **`lib/anthropic/client.ts` → `cachedKbSystem()`**: usata da 7 route. Il
  contesto per-utente va nel 3° argomento, MAI concatenato al kbContext
  (romperebbe la condivisione della prompt cache tra utenti).
- **`lib/ai/usage.ts`**: quota + tracking in TUTTE le route AI (12). Fail-open
  by design — non trasformarlo in fail-closed senza pensarci.
- **`lib/ai/identity-profile.ts`**: profilo longitudinale iniettato in mirror,
  daily-insight, weekly-report, monthly-letter; refresh via `after()` in
  daily-insight. Tabella `identity_profiles` (migrazione 007).
- **`lib/ai/biometrics-insight.ts`**: insight biometrico persistito e versionato
  (tabella `biometric_insights`, migrazione 015). Stesso pattern di identity-profile:
  `generate` + `fetchLatest` + `maybeRefresh` (staleness 7gg, fail-open). Refresh via
  un SECONDO `after()` in daily-insight (esce subito con count=0 per chi non ha
  biometrici). La pagina `/biometrics` (Server Component, niente `after()`) legge
  l'ultima versione e la mostra sempre; il bottone è "rigenera" (route POST →
  `generateBiometricsInsight`). Convergenza check-in↔corpo (stato sera N → corpo
  notte N→N+1) costruita nella lib e iniettata nel prompt.
- **`evals/`**: importa i VERI builder e schemi di produzione — se cambi la firma
  di un prompt valutato (mirror, daily-insight, scan-analysis), `evals/run.ts`
  smette di compilare: aggiornalo nello stesso commit.

### 2.7-ter Rotture di pattern (sessione 2026-07-12)
**È:** la catena "pattern funzionali" — la stringa option del check-in serale
è il contratto che tiene insieme quattro punti:

1. `app/(app)/checkin/page.tsx` — option `'Sì, l'ho riconosciuto e ho scelto
   diversamente'` (`PATTERN_BREAK_ANSWER`) + domanda condizionale `condizioni`
   (condition-mining, appare solo dopo la rottura).
2. `lib/utils/checkin.ts` — `isPatternBreak()`/`countPatternBreaks()`
   (matching su `PATTERN_BREAK_MARKER = 'ho scelto diversamente'`).
3. `lib/anthropic/prompts/daily-insight.ts` — regola ROTTURA DI PATTERN +
   label `condizioni` (stesso marker).
4. `lib/anthropic/prompts/weekly-report.ts` — conteggio rotture + condizioni
   abilitanti nel prompt (importa `isPatternBreak` da lib/utils/checkin).

**Consumatori UI:** dashboard (card "Scelte diverse", 30gg).
**KB:** migrazione `016_kb_functional_patterns.sql` (2 meccanismi categoria
`mechanism`: consolidamento identitario, condizioni abilitanti) — fluisce in
daily/mirror/weekly/monthly via `fetch.ts` senza altri cambi.

**Rischio:** se riformuli l'option nel check-in, il marker smette di
matchare in TUTTI gli altri punti — cambia le quattro occorrenze insieme
(o meglio: non riformulare l'option).

### 2.8 Coppie prompt + route (`lib/anthropic/prompts/*.ts` ↔ `app/api/ai/*/route.ts`)
**È:** ogni prompt esporta una funzione con una firma precisa (numero/ordine
parametri); la route corrispondente la chiama con quegli argomenti esatti. Le
due metà vivono in file diversi e **TypeScript le valida solo se ENTRAMBE
sono nello stesso commit**.

**È GIÀ SUCCESSO (incidente 2026-06-09/10 — produzione rotta per ~24h):**
una sessione parallela aveva modifiche non committate sia a
`daily-insight.ts` (nuova firma a 3 argomenti, aggiunta `recentCheckins`) sia
a `app/api/ai/daily-insight/route.ts` (chiamata aggiornata a 3 argomenti).
Il commit `e8215821` (fix maxDuration, fatto via `git add` dei soli file
`route.ts`) ha incluso per errore le modifiche non correlate a `route.ts` ma
NON quelle a `daily-insight.ts`. `npx tsc --noEmit -p .` in locale risultava
pulito (vedeva entrambi i file, committed o no) → falso senso di sicurezza.
`HEAD` restava incoerente: route con firma nuova (3 arg), prompt con firma
vecchia (2 arg). Risultato: **3 deploy Vercel falliti di fila**
(`e8215821`, `cccb4b9`, `3d7456b`), produzione bloccata sull'ultimo deploy
READY (`232a87e`) per ~24h, finché non è stato notato e fixato committando
anche `daily-insight.ts` (`4fef73d`).

**Regola:**
- Prima di un commit/push che tocca `app/api/ai/**`, fai `git status` e
  controlla se il `lib/anthropic/prompts/<nome>.ts` corrispondente ha diff
  non committati alla FIRMA della funzione export — se sì, includilo o lascia
  fuori ANCHE la modifica alla route che dipende da quella firma.
- `npx tsc --noEmit -p .` pulito sul working tree NON garantisce che `HEAD`
  sia coerente, se ci sono file non committati di sessioni parallele.
- **Dopo ogni push a `main`, controlla lo stato del deploy** (Vercel
  `list_deployments`/build logs) — un push "verde" in locale non significa
  build verde su Vercel.

### 2.9 Admin RLS (`010_admin_read_all.sql` + `011_fix_admin_rls_recursion.sql`) + `/admin/**`
**È:** policy `admin_reads_all_<tabella>` (FOR SELECT, `is_admin()`) su
profiles/checkins/scans/patterns/decisions/ai_usage — stesso pattern di
`coach_sees_client_*` ma senza vincolo `coach_clients`/`status = 'active'`:
un admin vede tutto in sola lettura.

**⚠ INCIDENTE 2026-06-11 (lettura dati rotta per tutti gli utenti):** la 010
originale usava `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
AND p.role = 'admin')` come policy SU `profiles` stessa. Postgres rileva
questo come **ricorsione infinita** (42P17) — non solo per l'admin: la
policy viene valutata per OGNI SELECT su `profiles` (e a cascata su
checkins/scans/patterns/decisions/ai_usage, le cui policy admin fanno
subquery su `profiles`), per QUALSIASI utente. Il codice è fail-open ovunque
→ effetto osservato: dashboard e risultati scan "vuoti" per l'utente normale,
senza errori visibili, subito dopo aver applicato 010 + impostato il proprio
ruolo `admin`.

**Fix (011):** funzione `is_admin()` `SECURITY DEFINER SET search_path =
public` che fa la stessa query ma bypassa RLS su `profiles` (esegue come
proprietario tabella) → nessuna ricorsione. Le 6 policy sono state droppate
e ricreate con `USING (is_admin())`.

**Lezione generale:** mai mettere una subquery sulla STESSA tabella dentro
una policy RLS, anche se "sembra" terminare per altre policy permissive —
Postgres valuta tutte le policy permissive della subquery, non solo quella
che farebbe terminare la valutazione. Usare sempre una funzione
`SECURITY DEFINER` per check di ruolo self-referenziali.

**Usato da:** `app/(app)/admin/layout.tsx` (gate `role === 'admin'`,
redirect a `/dashboard` altrimenti), `app/(app)/admin/page.tsx` (overview:
signup, attivazione/scan, engagement 7gg, utenti a rischio, uso AI
aggregato per route + top utenti), `app/(app)/admin/users/page.tsx`
(tabella di tutti gli utenti con stato attivo/a rischio/non attivato),
`app/(app)/admin/users/[id]/page.tsx` (dettaglio singolo utente — stessa
struttura di `/coach/[clientId]`, senza note coach, con sezione uso AI).

**⚠ Se la migrazione 010 non è applicata al DB live:** `/admin` non crasha,
ma mostra dati incompleti/fuorvianti — l'admin vede SOLO la propria riga
(via `profiles_own_data`), quindi "1 utente totale" anche se ce ne sono
molti di più. Prima di fidarsi dei numeri in `/admin`, verifica che 010 sia
applicata E che `profiles.role = 'admin'` sia impostato sul proprio utente
(comando in fondo alla migrazione).

**Gap scoperto in questa sessione (non risolto per i coach):** la tabella
`decisions` non ha mai avuto una policy `coach_sees_client_decisions`
(manca dalla 001) — `/coach/[clientId]` interroga `decisions` ma RLS la
filtra a vuoto per il coach. `admin_reads_all_decisions` (010) risolve
questo SOLO per l'admin. Se in futuro la sezione "Decisioni recenti" del
coach detail risulta sempre vuota, è questo il motivo.

**Nuove classi mobile** (`app/globals.css`, vedi §5.5): `.admin-metrics-grid`
(4→2 col) e `.admin-detail-grid` (2→1 col) — stesso pattern di
`.identity-charts-grid`/`.letters-layout`. NON riusare `.identity-charts-grid`
per altri layout: ha base `grid-template-columns: 1fr 320px`, specifica per
il grafico+radar di identity-map.

### 2.10 `lib/supabase/view-context.ts` — "Entra come utente" (admin view-as, sola lettura)
**È:** `getViewContext(supabase)` — helper centrale che sostituisce `auth.getUser()`
nelle pagine SSR. Legge il profilo reale; se `role === 'admin'` e il cookie httpOnly
`impersonate_user_id` (`IMPERSONATE_COOKIE`) punta a un altro utente esistente,
ritorna `viewUserId`/`viewProfile` di QUELL'utente con `isImpersonating: true`.
Altrimenti contesto normale (`viewUserId === realUserId`, `viewProfile` = proprio
profilo completo).

**Usato da (SSR — sostituisce `auth.getUser()` e spesso anche la query `profiles`
dedicata, via `viewProfile`):** `app/(app)/layout.tsx`, `app/(scan)/layout.tsx`,
`app/(app)/dashboard/page.tsx`, `app/(app)/identity-map/page.tsx`,
`app/(app)/distanza/page.tsx`, `app/(app)/mirror/page.tsx`, `app/(app)/lab/page.tsx`,
`app/(app)/lab/[id]/page.tsx`, `app/(scan)/scan/results/page.tsx`,
`app/(app)/settings/page.tsx`, `app/api/ai/weekly-report/route.ts` (unica route API
aggiornata finora).

**Componenti correlati:**
- `app/api/admin/impersonate/route.ts` — POST imposta il cookie httpOnly
  `impersonate_user_id` (12h, solo `role === 'admin'`), DELETE lo rimuove. Il cookie
  vive nel browser dell'admin: ogni `fetch()` CSR verso `/api/...` lo porta con sé.
- `components/shared/view-as-context.tsx` — `ViewAsProvider`/`useViewAs()`, popolato in
  `(app)/layout.tsx` da `viewContext`. Usato dai client component annidati che prima
  facevano il proprio `auth.getUser()`: `sidebar.tsx` (nasconde "Clienti"/"Admin"
  durante impersonazione), `mirror/mirror-client.tsx`, `mirror/decision-journal.tsx`.
- `components/shared/view-as-bar.tsx` — banner sticky in alto (impersonando) /
  picker flottante bottom-right ricercabile (non impersonando, solo admin).
  Renderizzato sia in `(app)/layout.tsx` che in `(scan)/layout.tsx`.
- Migrazione `012_admin_view_as.sql` — estende `is_admin()` (da 011, vedi §2.9) con
  policy `admin_reads_all_*` su `experiments`, `experiment_entries`,
  `weekly_reports`, `identity_profiles` (mancanti in 011, necessarie per
  lab/identity-map/distanza). ⚠ da applicare al DB live.

**Pattern "sola lettura" durante impersonazione (`isImpersonating`):** ogni azione di
scrittura va nascosta/disabilitata in UI, NON basta limitare l'accesso ai dati — le
RLS admin permettono comunque scrivere sulle righe dell'utente impersonato se la UI
non viene nascosta. Già fatto: `<VoiceCheckinCard disabled>`,
`<PatternAnalyzeButton disabled>`, `<WeeklyReportCard readOnly>` (+ POST
`/api/ai/weekly-report` → 403 se `isImpersonating`), wizard Mirror nascosto +
`<DecisionJournal readOnly>`, CTA lab (`+ Nuovo esperimento`, `Segna la giornata`,
`Genera review`) nascoste/sostituite, `<SettingsActions>`/`<DataSection>` nascosti in
settings, ramo distruttivo "scan vecchio formato → delete+redirect" disattivato in
`/scan/results` durante impersonazione.

**Rischio noto:** ogni NUOVA pagina SSR sotto `(app)` o `(scan)` che fa una propria
`.eq('user_id', user.id)` / `auth.getUser()` mostrerà all'admin in impersonazione i
SUOI dati invece di quelli dell'utente scelto — usa sempre `getViewContext` +
`viewUserId`/`viewProfile`. Se la pagina ha azioni di scrittura, nascondile con
`isImpersonating` (server) o `useViewAs()` (client).

**Fuori scope (non impersonation-aware, restano legate al REAL user):** `/checkin`,
`/segnali`, `/letters` (CSR + proprie route API con `auth.getUser()`), `/coach`,
`/coach/[clientId]`, `/admin/**` (nascosti dalla sidebar durante impersonazione, ma
raggiungibili via URL diretto — mostrano sempre i dati dell'admin reale), `/scan`
(compilazione), `/lab/new`, `/onboarding`.

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

Le migrazioni in `supabase/migrations/` hanno (avuto) **numeri duplicati**
perché sviluppate in branch/sessioni parallele senza coordinamento:

- ~~`002_lab.sql` e `002_weekly_reports_monthly_letters.sql`~~ — **risolto**
  (sessione 2026-06-09): `002_lab.sql` rinominato `005_lab.sql` via `git mv`,
  committato in `232a87e`, schema applicato al DB live.
- `003_knowledge_base.sql` **e** `003_signals.sql` — **non risolto**, stesso
  rischio di sotto.
- `004_signals_content_length.sql` esiste già.
- **2026-06-10:** aggiunte `006_ai_usage.sql` e `007_identity_profiles.sql` —
  ⚠ **da applicare al DB live via SQL Editor** (il codice è fail-open finché
  non lo sono). Prossimo numero libero: **008**.

**Risolto il 2026-06-10:** il file `supabase/migrations/002_lab.sql`
non tracciato (duplicato identico di `005_lab.sql`, residuo di un checkout
precedente al rename) è stato verificato con `diff` ed eliminato.

**Perché è un rischio:** se un domani si introduce un tool di migration
ordinato per nome/numero (es. Supabase CLI collegato), l'ordine di
applicazione fra coppie con lo stesso prefisso è ambiguo/alfabetico, non
cronologico-reale. Finché si applicano le migration manualmente via SQL
Editor (come fatto finora), non causa danni — ma **da tenere d'occhio** se si
passa a un flusso automatizzato.

**Se aggiungi una nuova migrazione:** controlla l'ultimo numero realmente
applicato al DB live (non solo il file più alto nella cartella, perché
potrebbero essercene di non applicate), e usa il numero successivo libero
(→ **006** al momento di scrivere).

**2026-06-10 (sera):** aggiunta `010_admin_read_all.sql` (policy RLS
read-all `role='admin'` per il pannello `/admin`, vedi §2.9). ⚠ **da
applicare al DB live via SQL Editor**, insieme allo `UPDATE profiles SET
role = 'admin' WHERE email = '...'` commentato in fondo al file.

**2026-06-11:** aggiunta `011_fix_admin_rls_recursion.sql` — fix urgente per
ricorsione infinita introdotta da 010 (vedi §2.9, incidente). **Da applicare
al DB live SUBITO dopo 010** (o subito, se 010 è già applicata — è proprio
questo il caso del DB live).

**2026-06-15:** aggiunta `012_admin_view_as.sql` — policy `admin_reads_all_*`
su `experiments`/`experiment_entries`/`weekly_reports`/`identity_profiles`
per "Entra come utente" (vedi §2.10). ⚠ **da applicare al DB live via SQL
Editor**, insieme a 008/009 ancora pendenti (vedi memoria). Prossimo numero
libero: **013**.

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

### 5.4 `maxDuration = 60` su tutte le route AI
Convenzione introdotta il 2026-06-09 (commit `e8215821`): ogni file
`app/api/ai/*/route.ts` inizia con `export const maxDuration = 60;` (riga 1,
seguita da riga vuota). Previene il "socket connection closed unexpectedly"
causato dal timeout di default delle Vercel Functions sulle chiamate Claude
più lunghe (es. Opus su `generate-experiment`). **Quando crei una nuova route
AI, copia questa riga per prima cosa.**

**Eccezione (2026-07-12):** le route che toccano il modello deep (Fable 5)
stanno a `maxDuration = 300`: `daily-insight` (identity-profile via after()),
`monthly-letter`, `cron/morning`. Vedi §2.3.

### 5.5 Classi CSS mobile condivise (`app/globals.css`)
Pass di responsive design del 2026-06-09: dato che la maggior parte dei
componenti usa `style={{...}}` inline (non className/Tailwind), gli override
mobile vivono come classi dedicate in `app/globals.css`, applicate via
`className` accanto allo `style` inline esistente, con override in
`@media (max-width: 768px)`:

- `.heatmap-scroll` / `.heatmap-inner` — heatmap identity-map scrollabile
  orizzontalmente invece di comprimersi (min-width 480px)
- `.identity-charts-grid` — grid `1fr 320px` → 1 colonna su mobile
  (identity-map/charts.tsx, contiene line chart + radar 4 dimensioni)
- `.letters-layout` — grid `200px 1fr` → 1 colonna su mobile (letters/page.tsx)
- `.mirror-fear-card` / `.mirror-fear-stats` — card paura/visione si stacca
  verticalmente su mobile (mirror-client.tsx)
- `.archetype-primary-card` — card archetipo primario si stacca verticalmente
  su mobile (scan/results/results-client.tsx)
- `.kbd-hint` — nasconde lo shortcut `⌘↵` su mobile (segnali/page.tsx)
- `.page-title-responsive` — h1 con font-size ridotto su mobile
- `.checkin-grid` — **definita ma NON ancora usata** (dead code) — pensata
  per dashboard/page.tsx ma non applicata; o usarla o rimuoverla
- `.admin-metrics-grid` — griglia 4 metriche admin/users/[id], 4→2 col su
  mobile
- `.admin-detail-grid` — decisioni/pattern affiancati admin/users/[id],
  2→1 col su mobile
- regole globali in `@media (max-width: 768px)`: `.app-main h1` (1.6rem),
  `.app-main textarea` (min-height 100px), `.app-main .btn-full-mobile`
  (width 100%)

**Regola:** se aggiungi un nuovo layout a griglia/flex con dimensioni fisse
in uno `style` inline e deve essere mobile-friendly, segui questo pattern
(classe dedicata + override in questo media query) invece di inventarne uno
nuovo.

---

## 6. Feature "in volo" — stato di integrazione

| Feature | Cartelle | In nav? | Tabelle DB | Note |
|---|---|---|---|---|
| Segnali | `app/(app)/segnali`, `app/api/signals`, `app/api/ai/analyze-signal` | ✅ sì | `signals` | In produzione (deploy `141f19e`, 2026-06-08) |
| Lab/Experiments | `app/(app)/lab`, `app/api/experiments`, `app/api/ai/generate-experiment` | ✅ sì | `experiments`, `experiment_entries` | In produzione (deploy `232a87e`, 2026-06-09). Voce `/lab` in `mainNav` e in `mobileBottomNav` (al posto di `/identity-map`, che resta solo nel sidebar desktop) |
| Admin panel | `app/(app)/admin/**`, `supabase/migrations/010_admin_read_all.sql` | ✅ sì (solo `role='admin'`) | profiles, checkins, scans, patterns, decisions, ai_usage (read-all via RLS, vedi §2.9) | Overview prodotto + tabella utenti + dettaglio per utente. Richiede 010 applicata al DB live + `role='admin'` sul proprio profilo (sessione 2026-06-10 sera) |
| Entra come utente (admin view-as) | `lib/supabase/view-context.ts`, `app/api/admin/impersonate`, `components/shared/view-as-*`, `supabase/migrations/012_admin_view_as.sql` | ✅ sì (banner/picker, solo `role='admin'`) | estende RLS admin (011) con 012 — nessuna nuova tabella | Sola lettura, vedi §2.10. Copre dashboard/identity-map/distanza/mirror/lab/scan-results/settings; fuori scope checkin/segnali/letters/coach/admin/scan |

**Stato deploy produzione (verificare prima di assumere "deployato" = "live"):**
dopo `232a87e` i 3 commit successivi (`e8215821` maxDuration,
`cccb4b9`/`3d7456b` mobile responsive) hanno **fallito la build su Vercel**
(vedi §2.8) — produzione è rimasta su `232a87e` per ~24h. Fix in `4fef73d`
(2026-06-10). Se devi rispondere "è deployato?", non fidarti solo di
`git log origin/main` — controlla `list_deployments`/build status.

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
