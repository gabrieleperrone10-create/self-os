-- SELF OS — Modulo STAT
-- Statistica applicata all'identità: condizione (2 punti) + tendenza (N punti)
-- per ogni area di vita. Vedi .agents/plan-stat-module.md per il motore
-- (lib/stats/) e il razionale completo.
--
-- F1: solo stat manuali. `stat_readings` non esiste — la lettura si calcola
-- a richiesta da stat_entries (lib/stats/data.ts), niente cache da tenere
-- allineata finché il volume di dati resta quello di un tracker personale.

CREATE TABLE stat_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  key         TEXT NOT NULL,              -- slug, usato nell'URL /stat/[key]
  label       TEXT NOT NULL,
  area        TEXT NOT NULL CHECK (area IN ('corpo', 'dieta', 'lavoro', 'relazioni', 'mente', 'soldi')),
  unit        TEXT,
  definition  TEXT,                       -- "cosa conta" — scritta dall'utente, antidoto al gonfiaggio del numero (piano §3.2)

  direction   TEXT NOT NULL DEFAULT 'up' CHECK (direction IN ('up', 'down')),
  mode        TEXT NOT NULL DEFAULT 'grow' CHECK (mode IN ('grow', 'maintain')),
  period      TEXT NOT NULL DEFAULT 'week' CHECK (period IN ('day', 'week')),
  target      NUMERIC,                    -- soglia dichiarata, usata solo se mode = 'maintain'

  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, key)
);

CREATE TABLE stat_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_id       UUID REFERENCES stat_definitions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  period_start  DATE NOT NULL,
  value         NUMERIC NOT NULL,
  estimated     BOOLEAN NOT NULL DEFAULT false,  -- inserimento retroattivo a memoria (piano §3.2) — usato per la tendenza, mai enfatizzato come dato certo
  note          TEXT,

  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (stat_id, period_start)
);

CREATE INDEX idx_stat_definitions_user   ON stat_definitions(user_id, active);
CREATE INDEX idx_stat_entries_stat_time  ON stat_entries(stat_id, period_start);
CREATE INDEX idx_stat_entries_user       ON stat_entries(user_id, period_start);

ALTER TABLE stat_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_entries     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON stat_definitions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON stat_entries      FOR ALL USING (auth.uid() = user_id);

-- Admin "Entra come utente" (sola lettura, stesso pattern di 012_admin_view_as.sql, is_admin() da 011)
CREATE POLICY "admin_reads_all_stat_definitions" ON stat_definitions FOR SELECT USING (is_admin());
CREATE POLICY "admin_reads_all_stat_entries"     ON stat_entries     FOR SELECT USING (is_admin());
