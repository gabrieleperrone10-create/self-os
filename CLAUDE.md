# SELF OS — Sistema Operativo Identitario
## Istruzioni Master per Claude Code

---

## CHI SEI IN QUESTO PROGETTO

Sei il senior developer e architect di SELF OS.
Non costruisci features — costruisci un sistema che cambia l'identità delle persone nel tempo.
Ogni decisione tecnica deve servire l'esperienza psicologica, non il contrario.
Quando sei in dubbio tra due approcci, scegli quello che produce più impatto trasformativo sull'utente.

---

## COS'È SELF OS

SELF OS è il primo sistema operativo per l'identità umana.

Non è un journal. Non è un habit tracker. Non è un'app di meditazione.

È un sistema che mappa CHI SEI attraverso 4 livelli psicologici nel tempo:
1. **Stato** — come ti senti adesso (il filtro percettivo)
2. **Pattern** — cosa si ripete automaticamente nei tuoi comportamenti
3. **Credenze** — le storie invisibili che governano le tue decisioni
4. **Identità Profonda** — chi credi di essere a un livello inconscio

Il prodotto non dice all'utente cosa fare.
Gli mostra chi sta essendo mentre lo fa.

---

## STACK TECNICO — NON DEVIARE DA QUESTO

```
Framework:     Next.js 14 (App Router, TypeScript)
Styling:       Tailwind CSS + shadcn/ui
Database:      Supabase (PostgreSQL)
Auth:          Supabase Auth
Realtime:      Supabase Realtime
AI:            Anthropic Claude API (claude-sonnet-4-20250514)
Pagamenti:     Stripe
Deploy:        Vercel
State:         Zustand (client), React Query (server state)
Forms:         React Hook Form + Zod
Email:         Resend
```

---

## STRUTTURA DEL PROGETTO

```
self-os/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/
│   │   ├── layout.tsx          # Layout principale con sidebar
│   │   ├── scan/               # Initial scan — primo accesso
│   │   ├── dashboard/          # Home con stato e summary
│   │   ├── checkin/            # Daily check-in mattina/sera
│   │   ├── mirror/             # Mirror decisionale
│   │   ├── identity-map/       # Visualizzazione pattern nel tempo
│   │   └── coach/              # Layer B2B per coach (route protetta)
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze-scan/   # Analisi initial scan
│   │   │   ├── daily-insight/  # Insight giornaliero
│   │   │   └── mirror/         # Pattern matching decisioni
│   │   ├── checkin/
│   │   ├── patterns/
│   │   └── webhooks/
│   │       └── stripe/
├── components/
│   ├── ui/                     # shadcn components
│   ├── scan/                   # Componenti initial scan
│   ├── checkin/                # Componenti check-in
│   ├── mirror/                 # Componenti mirror
│   ├── identity-map/           # Visualizzazioni e grafici
│   └── shared/                 # Header, sidebar, ecc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── anthropic/
│   │   ├── client.ts
│   │   ├── prompts/            # Tutti i prompt separati per modulo
│   │   │   ├── scan-analysis.ts
│   │   │   ├── pattern-recognition.ts
│   │   │   └── mirror.ts
│   │   └── parsers.ts          # Parsing risposte AI
│   ├── stripe/
│   └── utils/
├── hooks/                      # Custom React hooks
├── store/                      # Zustand stores
├── types/                      # TypeScript types globali
└── supabase/
    ├── migrations/             # Schema DB
    └── seed.ts
```

---

## DATABASE SCHEMA — COSTRUISCI ESATTAMENTE QUESTO

```sql
-- Utenti (estende auth.users di Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'coach' | 'admin'
  coach_id UUID REFERENCES profiles(id),
  plan TEXT DEFAULT 'free', -- 'free' | 'pro' | 'coach'
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan iniziale
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- { question_id: answer }
  analysis JSONB, -- output AI: shadow_pattern, core_wound, expansion_zone, next_edge, letter
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-in giornalieri
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'morning' | 'evening'
  state_score INTEGER CHECK (state_score BETWEEN 1 AND 10),
  answers JSONB NOT NULL,
  ai_insight TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern identificati nel tempo
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'shadow' | 'expansion' | 'belief' | 'state'
  title TEXT NOT NULL,
  description TEXT,
  frequency INTEGER DEFAULT 1,
  first_seen DATE DEFAULT CURRENT_DATE,
  last_seen DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB
);

-- Decisioni nel Mirror
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  state_score INTEGER CHECK (state_score BETWEEN 1 AND 10),
  origin TEXT, -- 'fear' | 'vision' | 'unclear'
  ai_mirror TEXT, -- risposta mirror AI
  outcome TEXT, -- compilato dopo dalla persona
  outcome_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relazione coach-cliente
CREATE TABLE coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active', -- 'active' | 'paused' | 'ended'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies — SEMPRE abilitate
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Utente vede solo i propri dati
CREATE POLICY "users_own_data" ON scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON decisions FOR ALL USING (auth.uid() = user_id);

-- Coach vede i dati dei propri clienti
CREATE POLICY "coach_sees_clients" ON scans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_id = auth.uid() AND client_id = scans.user_id
  ));
```

---

## I 5 MODULI — COME FUNZIONANO

### MODULO 1: INITIAL SCAN
**Percorso:** `/scan`
**Trigger:** primo accesso dopo signup

L'utente risponde a 8 domande divise in 4 blocchi psicologici.
Una domanda alla volta. Schermo scuro. Nessuna barra di progresso.
Alla fine: schermo vuoto 3 secondi → "Sei pronto a vedere?" → risultati.

**UX critica:**
- Nessun back button visibile (rimuove l'ansia da performance)
- Auto-save ogni risposta in localStorage (non perdere dati)
- Transizioni lente e rituali (500ms minimum)
- Alla fine: lettera personalizzata generata da Claude

**Le 8 domande:**
```
BLOCCO 1 — STATO ATTUALE
Q1: "Descrivi la tua vita attuale in 3 parole. Le prime che ti vengono, senza filtrare."
Q2: "C'è qualcosa che sai di dover cambiare da più di un anno ma non hai ancora cambiato. Cos'è?"

BLOCCO 2 — PATTERN RICORRENTI
Q3: "Descrivi una situazione che si è ripetuta almeno 3 volte — contesti diversi, stesso risultato."
Q4: "Quando stai per raggiungere qualcosa di importante, cosa succede di solito?"

BLOCCO 3 — CREDENZE FONDANTI
Q5: "Completa questa frase senza pensarci: 'Le persone come me non possono...'"
Q6: "Cosa dovrebbe succedere perché tu ti senta finalmente abbastanza?"

BLOCCO 4 — IDENTITÀ PROFONDA
Q7: "Se rimuovessi tutto — lavoro, ruolo, risultati, relazioni — chi rimane?"
Q8: "La persona che vuoi diventare — cosa pensa di te attuale?"
```

---

### MODULO 2: DAILY CHECK-IN
**Percorso:** `/checkin`
**Trigger:** notifica mattina (8:00) e sera (21:00)

**Mattina — 3 domande:**
1. Stato interno adesso (slider 1-10)
2. "Da quale versione di te vuoi operare oggi?"
3. "Cosa stai evitando che sai andrebbe fatto?"

**Sera — 3 domande:**
1. Stato interno adesso (slider 1-10)
2. "La decisione più importante di oggi veniva da visione o da paura?"
3. "Quale pattern hai riconosciuto in te oggi?"

Dopo ogni check-in: Claude genera un insight di 2-3 righe basato sulla risposta.
Non un consiglio. Una riflessione chirurgica.

---

### MODULO 3: IDENTITY MAP
**Percorso:** `/identity-map`

Visualizzazione dei dati dell'utente nel tempo. Usa Recharts.

**Grafici:**
- Linea: stato interno ultimi 30 giorni (mattina vs sera)
- Radar: 4 dimensioni identitarie (stato, pattern, credenze, identità)
- Heatmap: giorni di check-in completati (tipo GitHub contributions)
- Cards: pattern attivi identificati dall'AI nel tempo

**Sezione Pattern:**
Claude analizza gli ultimi 30 check-in e identifica pattern ricorrenti.
Li mostra come cards con: titolo, frequenza, prima volta rilevato, ultima volta.

---

### MODULO 4: MIRROR DECISIONALE
**Percorso:** `/mirror`

**Flusso:**
1. L'utente descrive la decisione che deve prendere (textarea)
2. Seleziona lo stato attuale (slider 1-10)
3. Seleziona: viene da PAURA o VISIONE? (due pulsanti grandi)
4. Claude recupera decisioni simili passate dal DB e fa pattern matching
5. Risposta Mirror: "Le ultime volte che hai deciso in questo stato..."
6. Domanda finale: "Cosa farebbe la versione più evoluta di te?"

**Regola critica:** Il Mirror non consiglia mai. Riflette sempre.

---

### MODULO 5: COACH LAYER
**Percorso:** `/coach` (solo per ruolo 'coach')

Dashboard con lista clienti.
Per ogni cliente: ultimo scan, stato medio ultimi 7 giorni, pattern attivi, decisioni recenti.
Il coach può aggiungere note private per ogni cliente.
Il cliente NON vede le note del coach.

---

## DESIGN SYSTEM — REGOLE ASSOLUTE

```
PALETTE:
  background:    #0A0806  (quasi nero caldo)
  surface:       #120F0A  (card background)
  border:        #1E1812  (bordi sottili)
  text-primary:  #F5F0E8  (bianco caldo)
  text-secondary:#A89880  (grigio dorato)
  text-muted:    #4A4035  (testo disabilitato)
  gold:          #C9A96E  (accent principale)
  
  COLORI BLOCCHI:
  stato:         #C9A96E  (oro)
  pattern:       #8B9E7A  (verde salvia)
  credenze:      #7A8B9E  (blu grigio)
  identità:      #9E7A8B  (viola muto)

TIPOGRAFIA:
  display:       Georgia, 'Times New Roman', serif
  body:          Georgia, serif
  mono:          'Courier New', monospace
  
  NON usare mai: Inter, Roboto, Arial, system-ui

SPACING:
  Generoso. Mai affollato.
  Padding minimo card: 1.5rem
  Gap tra sezioni: 3-4rem

ANIMAZIONI:
  Transizioni: 0.4-0.8s ease
  Nessuna animazione aggressiva
  Fade + translateY per gli ingressi
  Mai far sentire il software veloce o frenetico

REGOLE UI:
  - Dark mode only. Non esiste light mode.
  - Bordi sottilissimi (1px), mai spessi
  - Bottoni: outline style di default, fill solo su hover
  - Nessun border-radius > 4px (estetica precisa, non playful)
  - Icone: Lucide React, size 16-18px
```

---

## PROMPT AI — COME CHIAMARE CLAUDE

### Analisi Initial Scan
```typescript
// lib/anthropic/prompts/scan-analysis.ts

export const SCAN_ANALYSIS_PROMPT = (answers: Record<string, string>) => `
Sei SELF OS — un sistema di intelligenza identitaria.
Hai ricevuto le risposte di un utente al suo scan iniziale.

Il tuo compito è identificare i pattern psicologici profondi che emergono dalle risposte.
Non essere generico. Sii chirurgico, specifico, e usa le parole esatte dell'utente come specchio.

Rispondi SOLO con un JSON valido. Nessun testo prima o dopo.

{
  "shadow_pattern": {
    "title": "titolo breve (max 5 parole)",
    "description": "2-3 frasi in seconda persona. Inizia con: 'Tendi a...'"
  },
  "core_wound": {
    "title": "titolo breve (max 5 parole)", 
    "description": "2-3 frasi in seconda persona. Inizia con: 'Operi dalla convinzione inconscia che...'"
  },
  "expansion_zone": {
    "title": "titolo breve (max 5 parole)",
    "description": "2-3 frasi in seconda persona. Inizia con: 'Sei nel tuo genio quando...'"
  },
  "next_edge": {
    "title": "titolo breve (max 5 parole)",
    "description": "2-3 frasi in seconda persona. Inizia con: 'La tua crescita richiede che tu...'"
  },
  "letter": "Un paragrafo di 4-5 frasi in seconda persona. Tono: lettera da qualcuno che ti conosce profondamente. Usa le parole esatte dell'utente. Inizia con: 'Quello che emerge da ciò che hai condiviso è questo:'"
}

RISPOSTE UTENTE:
${Object.entries(answers).map(([q, a]) => `Domanda: ${q}\nRisposta: ${a}`).join('\n\n')}
`;
```

### Mirror Decisionale
```typescript
// lib/anthropic/prompts/mirror.ts

export const MIRROR_PROMPT = (
  decision: string,
  stateScore: number,
  origin: 'fear' | 'vision',
  pastDecisions: Decision[]
) => `
Sei il Mirror di SELF OS.
Il tuo ruolo è riflettere, non consigliare.
Non dici mai cosa fare. Mostri sempre chi sta essendo l'utente mentre decide.

Decisione attuale: ${decision}
Stato interno: ${stateScore}/10
L'utente sente che viene da: ${origin === 'fear' ? 'PAURA' : 'VISIONE'}

Decisioni passate simili:
${pastDecisions.map(d => `- "${d.description}" | Stato: ${d.state_score}/10 | Origine: ${d.origin} | Esito: ${d.outcome || 'non registrato'}`).join('\n')}

Rispondi in 3-4 frasi. 
Prima frase: pattern che emerge dal confronto con il passato.
Seconda frase: cosa rivela lo stato attuale (${stateScore}/10) su questa decisione.
Terza frase: domanda che apre, non che chiude.
NON dare consigli. NON dire cosa fare. Solo specchio.
`;
```

### Pattern Recognition (chiamata settimanale)
```typescript
// lib/anthropic/prompts/pattern-recognition.ts

export const PATTERN_RECOGNITION_PROMPT = (checkins: Checkin[]) => `
Sei il sistema di riconoscimento pattern di SELF OS.
Analizza questi check-in degli ultimi 30 giorni e identifica i pattern ricorrenti.

Rispondi SOLO con JSON valido:
{
  "patterns": [
    {
      "type": "shadow | expansion | belief | state",
      "title": "nome del pattern (max 4 parole)",
      "description": "cosa si ripete e quando (2 frasi)",
      "frequency": numero_di_occorrenze,
      "trigger": "cosa sembra attivarlo"
    }
  ],
  "weekly_insight": "una frase sola, chirurgica, su ciò che emerge questa settimana"
}

CHECK-IN:
${checkins.map(c => `[${c.date}] ${c.type} | Stato: ${c.state_score}/10 | ${JSON.stringify(c.answers)}`).join('\n')}
`;
```

---

## VARIABILI D'AMBIENTE NECESSARIE

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ORDINE DI COSTRUZIONE — SEGUI QUESTA SEQUENZA

```
FASE 1 — Fondamenta (Giorno 1)
  ✓ Setup Next.js + TypeScript + Tailwind + shadcn/ui
  ✓ Supabase: progetto, schema DB, RLS policies
  ✓ Auth: signup, login, middleware protezione route
  ✓ Layout principale con sidebar
  ✓ Design system: variabili CSS, font, colori

FASE 2 — Core Experience (Giorno 2-3)
  ✓ Initial Scan: flow completo 8 domande
  ✓ API route: /api/ai/analyze-scan (chiamata Claude)
  ✓ Results page: lettera + 4 card identitarie
  ✓ Salvataggio scan su Supabase

FASE 3 — Daily Rhythm (Giorno 4-5)
  ✓ Daily Check-in: morning + evening
  ✓ API route: /api/ai/daily-insight
  ✓ Dashboard: summary stato + ultimo insight
  ✓ Streak counter check-in

FASE 4 — Profondità (Giorno 6-7)
  ✓ Identity Map: grafici Recharts
  ✓ Pattern recognition settimanale
  ✓ Mirror decisionale completo
  ✓ API route: /api/ai/mirror

FASE 5 — Business (Giorno 8-9)
  ✓ Stripe: piani free/pro/coach
  ✓ Coach layer: dashboard clienti
  ✓ Gate features per piano
  ✓ Email onboarding (Resend)

FASE 6 — Deploy
  ✓ Vercel deploy
  ✓ Supabase produzione
  ✓ Variabili d'ambiente produzione
  ✓ Test end-to-end
```

---

## REGOLE DI COMPORTAMENTO PER CLAUDE CODE

1. **Non inventare lo stack** — usa solo ciò che è definito qui sopra
2. **Non semplificare l'UX** — ogni scorciatoia tecnica che degrada l'esperienza psicologica è sbagliata
3. **TypeScript strict** — niente `any`, niente shortcuts
4. **Ogni chiamata AI è in una API route** — mai chiamare Anthropic dal client
5. **RLS sempre attivo** — nessuna tabella senza Row Level Security
6. **Error handling completo** — ogni chiamata AI ha fallback visivo
7. **Mobile first** — tutto funziona su telefono prima che su desktop
8. **Un componente = una responsabilità** — niente componenti da 300 righe
9. **I prompt AI sono separati** — sempre in `/lib/anthropic/prompts/`
10. **Commenta il perché, non il cosa** — il codice dice cosa fa, i commenti dicono perché

---

## COMANDI PER INIZIARE

```bash
# 1. Crea il progetto
npx create-next-app@latest self-os --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Installa dipendenze
cd self-os
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install stripe @stripe/stripe-js
npm install zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts
npm install lucide-react
npm install resend
npm install class-variance-authority clsx tailwind-merge

# 3. Installa shadcn/ui
npx shadcn@latest init

# 4. Aggiungi componenti shadcn necessari
npx shadcn@latest add button input textarea card badge slider tabs

# 5. Inizializza Supabase
npx supabase init
```

---

*SELF OS — construito per chi ha smesso di cercare strategie migliori e ha iniziato a chiedersi chi sta essendo.*
