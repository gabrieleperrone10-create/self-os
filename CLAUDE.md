# SELF OS — Sistema Operativo Identitario
## Istruzioni per Claude Code

---

## CHI SEI IN QUESTO PROGETTO

Sei il senior developer e architect di SELF OS.
Non costruisci features — costruisci un sistema che cambia l'identità delle persone nel tempo.
Ogni decisione tecnica deve servire l'esperienza psicologica, non il contrario.
In dubbio tra due approcci, scegli quello con più impatto trasformativo sull'utente.

**Prima di toccare file condivisi, leggi `.agents/architecture-map.md`** — è la mappa
delle intersezioni tra moduli, va aggiornata nella stessa sessione in cui scopri
una nuova intersezione o risolvi un bug causato da una.

---

## COS'È SELF OS

Il primo sistema operativo per l'identità umana. Non un journal, non un habit tracker.
Mappa CHI SEI su 4 livelli (stato, pattern, credenze, identità profonda) attraverso
comportamenti reali nel tempo. Il prodotto non dice cosa fare: mostra la tua identità
mentre agisci. Vedi `PRODUCT.md` per posizionamento, utenti e anti-references.

---

## STACK REALE — NON DEVIARE

```
Framework:     Next.js 16 (App Router, TypeScript strict)
               ⚠ middleware.ts è deprecato → usare proxy.ts con funzione proxy()
Styling:       Tailwind CSS v4 (CSS vars in :root, @theme inline) + shadcn/ui
Database:      Supabase (PostgreSQL + RLS sempre attivo)
Auth:          Supabase Auth (@supabase/ssr)
AI:            Anthropic Claude — AI_MODEL in lib/anthropic/client.ts
               (claude-sonnet-4-6; Opus per generate-experiment, Haiku per analyze-signal)
Pagamenti:     Stripe (piani free/pro/coach)
Email:         Resend
Deploy:        Vercel
State:         Zustand (client), React Query (server state)
Forms:         React Hook Form + Zod
Grafici:       Recharts (SEMPRE in Client Components separati: page.tsx server + charts.tsx client)
```

---

## MODULI IN PRODUZIONE

| Modulo | Percorso | Note |
|---|---|---|
| Initial Scan | `/scan` (route group senza sidebar) | **150 domande** in 7 sezioni (`lib/scan-questions.ts`), risultati con archetipi/loop/credenze |
| Daily Check-in | `/checkin` | mattina/sera + insight AI; anche check-in vocale (voice-analyze) |
| Dashboard | `/dashboard` | metriche, streak, momentum, alert di rientro 7+ giorni |
| Identity Map | `/identity-map` | Recharts + heatmap + pattern cards + weekly report |
| Mirror | `/mirror` | decisionale, 6 campi, pattern matching su decisioni passate |
| Segnali | `/segnali` | cattura rapida con analisi Haiku |
| Lab | `/lab` | esperimenti comportamentali 7 giorni (generazione Opus) |
| Lettere | `/letters` | lettera mensile AI |
| Coach | `/coach` | dashboard clienti (ruolo coach), note private, invite link |
| Distanza | `/distanza` | profilo identitario v-prec vs v-corrente + metriche derivate |
| Settings | `/settings` | account, piano (Stripe portal), promemoria email, export/delete GDPR |

API AI: `analyze-scan`, `daily-insight`, `mirror`, `analyze-signal`, `voice-analyze`,
`generate-experiment`, `momentum-insight`, `monthly-letter`, `outcome-reflection`,
`weekly-report`, `identity-profile`, `patterns/analyze`.
API account: `account/export`, `account/delete`, `account/preferences`.
Cron (vercel.json, auth CRON_SECRET): `cron/morning` (06 UTC — reminder + lettera
mensile il giorno 1), `cron/evening` (19 UTC — reminder + nudge esiti + weekly
report la domenica). Generazione condivisa in `lib/ai/reports.ts` — route e lib
vanno committate INSIEME (§2.8).

---

## CONVENZIONI AI — OBBLIGATORIE

Ogni route AI segue questo schema (vedi una esistente prima di crearne una nuova):

1. `export const maxDuration = 60;` come **prima riga** del file
2. Auth: `supabase.auth.getUser()` → 401
3. Quota: `checkAiQuota` → 429 con `quotaExceededBody` (`lib/ai/usage.ts`)
4. Prompt SEMPRE da `lib/anthropic/prompts/<nome>.ts` — mai inline
5. Knowledge base via `cachedKbSystem(kbContext, istruzione, contestoPerUtente?)`
   (`lib/anthropic/client.ts`): blocco system con prompt caching. Il contesto
   per-utente (gap, profilo identitario) va nel terzo argomento, MAI concatenato
   al kbContext (ucciderebbe la cache condivisa)
6. Output JSON: `parseAIJson(raw, schema, contesto)` con schema Zod da
   `lib/anthropic/schemas.ts` — MAI `JSON.parse(...) as X`. Gli schemi usano
   `satisfies z.ZodType<T>` (drift impossibile) e `looseObject` (i campi extra
   futuri si preservano nel JSONB)
7. Tracking: `void recordAiUsage(supabase, user.id, '<route>', MODEL, message.usage)`
8. try/catch con `console.error('[<contesto>]', err)` + JSON di errore

**Profilo identitario longitudinale** (`lib/ai/identity-profile.ts`): sintesi AI
versionata del percorso (tabella `identity_profiles`), si rigenera ogni 7+ giorni
via `after()` post daily-insight, iniettata come contesto per-utente in mirror,
daily-insight, weekly-report, monthly-letter. Tutto fail-open.

**⚠ LEZIONE INCIDENTE 2026-06-09 (produzione rotta 24h):** prompt e route che lo
chiama vivono in file diversi — TypeScript li valida solo se ENTRAMBI sono nello
stesso commit. Mai committare una metà. `tsc --noEmit` pulito sul working tree NON
garantisce che HEAD compili. La CI (`.github/workflows/ci.yml`) ora verifica HEAD.
Dopo ogni push a main, controlla lo stato del deploy Vercel.

---

## EVAL DEI PROMPT

I prompt sono il prodotto. Prima di modificarne uno, esegui la baseline; dopo, confronta:

```bash
npm run evals                # tutti (mirror, daily-insight, scan)
npm run evals -- mirror      # uno solo
```

`evals/run.ts` usa i veri builder + schemi Zod di produzione, poi un LLM-judge
severo (specificità, chirurgicità, aderenza regole, non-genericità; pass = media ≥7,
schema Zod = fail rigido). Nuovo prompt importante → aggiungi casi in `evals/cases.ts`.

---

## DATABASE

Schema in `supabase/migrations/` (applicate a mano via SQL Editor — controlla
l'ultimo numero realmente applicato al DB live prima di crearne una nuova; ci sono
duplicati storici 003). Tabelle: profiles, scans, checkins, patterns, decisions,
coach_clients, weekly_reports, monthly_letters, knowledge_base, signals,
experiments, experiment_entries, ai_usage, identity_profiles.

Regole: RLS su ogni tabella, `users_own_data` + policy coach dove serve.
Trigger `handle_new_user` richiede `SET search_path = public`.

---

## DESIGN SYSTEM — REGOLE ASSOLUTE

```
PALETTE (CSS vars in app/globals.css):
  background #0A0806 | surface #120F0A | border #1E1812
  text-primary #F5F0E8 | text-secondary #A89880 | text-muted #4A4035
  gold #C9A96E | pattern #8B9E7A | credenze #7A8B9E | identità #9E7A8B

TIPOGRAFIA: Georgia serif ovunque. MAI Inter/Roboto/Arial/system-ui.
ANIMAZIONI: 0.4-0.8s ease, fade + translateY. Mai frenetico. Reduced-motion obbligatorio.
UI: dark only, bordi 1px, border-radius ≤ 4px, bottoni outline (fill su hover),
    Lucide 16-18px, spacing generoso (card ≥ 1.5rem, sezioni 3-4rem).
MOBILE: molti componenti usano style inline → gli override mobile vivono come
    classi dedicate in app/globals.css sotto @media (max-width: 768px).
    Segui quel pattern, non inventarne altri (vedi architecture-map §5.5).
```

---

## REGOLE DI COMPORTAMENTO

1. **TypeScript strict** — niente `any`, niente shortcuts
2. **Ogni chiamata AI in una API route** — mai Anthropic dal client
3. **RLS sempre attivo** — nessuna tabella senza Row Level Security
4. **Error handling completo** — ogni chiamata AI ha fallback visivo
5. **Mobile first** — tutto funziona su telefono prima che su desktop
6. **Un componente = una responsabilità** — niente componenti da 300 righe
7. **Commit chirurgici per feature** — mai `git add -A` con sessioni parallele in volo
8. **Commenta il perché, non il cosa**
9. **Non semplificare l'UX** — ogni scorciatoia che degrada l'esperienza psicologica è sbagliata
10. **Auth/App layouts**: `export const dynamic = 'force-dynamic'` dove serve

---

## VARIABILI D'AMBIENTE

```env
NEXT_PUBLIC_SUPABASE_URL= / NEXT_PUBLIC_SUPABASE_ANON_KEY= / SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET= / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## COMANDI

```bash
npm run dev          # sviluppo
npm run build        # build di produzione (la CI lo esegue su ogni push)
npx tsc --noEmit -p .# typecheck
npm run evals        # eval harness dei prompt
npm run research     # research agent (export dati + analisi prompt-evolution)
```

---

*SELF OS — costruito per chi ha smesso di cercare strategie migliori e ha iniziato a chiedersi chi è mentre agisce.*
