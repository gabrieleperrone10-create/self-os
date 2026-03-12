-- ================================================================
-- SELF OS — Demo Seed
-- Persona: Marco Ferretti, 34 anni, SaaS founder
-- Archetipo: Il Performer Compulsivo
-- 90 giorni: Dicembre 2025 → Marzo 2026
-- Login: demo@selfos.app / Demo1234!
-- ================================================================

DO $$
DECLARE
  uid UUID := 'dec0de00-0000-4000-8000-000000000001';
BEGIN

-- ─── 1. Auth User ───────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  uid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@selfos.app',
  crypt('Demo1234!', gen_salt('bf')),
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '90 days', NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Marco Ferretti"}',
  false, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- ─── 2. Profile ─────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role, plan, onboarding_completed, created_at, updated_at)
VALUES (uid, 'demo@selfos.app', 'Marco Ferretti', 'user', 'pro', true, NOW() - INTERVAL '90 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Initial Scan ────────────────────────────────────────────
INSERT INTO public.scans (user_id, answers, analysis, completed_at)
VALUES (
  uid,
  '{
    "q1": "Intrappolato, ambizioso, esausto",
    "q2": "Smettere di controllare ogni singolo dettaglio della startup. Lo so da due anni.",
    "q3": "Ogni volta che il progetto va bene, io creo un problema. Ogni. Volta. In tre contesti diversi.",
    "q4": "Mi fermo. Trovo un motivo per cui non ero davvero pronto. Rimando.",
    "q5": "Le persone come me non possono permettersi di rallentare.",
    "q6": "Quando il prodotto raggiungerà 1000 utenti attivi. O forse quando il team funzionerà senza di me.",
    "q7": "Un uomo che ha bisogno di dimostrare qualcosa. Non so ancora a chi.",
    "q8": "Mi direbbe: stai ancora chiedendo il permesso di esistere."
  }',
  '{
    "shadow_pattern": {
      "title": "Il Performer Compulsivo",
      "description": "Tendi a misurare il tuo valore esclusivamente attraverso i risultati prodotti. Quando non produci, non ti senti degno di occupare spazio. Il lavoro non è ciò che fai — è ciò che sei, e questa equazione ti sta consumando."
    },
    "core_wound": {
      "title": "Non sono mai abbastanza",
      "description": "Operi dalla convinzione inconscia che senza risultati eccezionali non meriti rispetto né amore. Questa ferita si maschera da ambizione, ma in realtà è terrore. Il terrore che se ti fermi, qualcuno scopra che sotto i risultati non c''è nulla."
    },
    "expansion_zone": {
      "title": "Leader Presente",
      "description": "Sei nel tuo genio quando smetti di fare e inizi a essere. Le tue idee migliori non arrivano quando spingi — arrivano quando sei presente. Il tuo team ti segue non quando sei performativo, ma quando sei reale."
    },
    "next_edge": {
      "title": "Riposarsi senza colpa",
      "description": "La tua crescita richiede che tu impari a fermarti senza interpretarlo come fallimento. Il riposo non è assenza di produttività — è la condizione in cui la tua parte più intelligente lavora. Finché non lo integri, continuerai il ciclo."
    },
    "letter": "Quello che emerge da ciò che hai condiviso è questo: sei un uomo che ha costruito un''identità completa attorno al fare, e ora non sa più chi è quando si ferma. Hai riconosciuto il pattern — ''ogni volta che va bene, creo un problema'' — con una chiarezza rara. Questa lucidità è già una forma di coraggio. La domanda che ti lasci non è ''come smetto di sabotarmi'', ma ''cosa succederebbe se permettessi al successo di restare?''."
  }',
  NOW() - INTERVAL '89 days'
);

END $$;
