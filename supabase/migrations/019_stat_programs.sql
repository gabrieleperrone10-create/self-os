-- SELF OS — Modulo STAT: programma del periodo
--
-- La formula da applicare la decide il MOTORE (lib/stats/engine.ts), non il
-- modello: l'AI si limita a istanziarne i passi sui dati reali dell'utente.
-- Qui si persiste il risultato, così la scheda non ricostruisce (e non ripaga)
-- una generazione a ogni apertura di pagina.
--
-- Vedi .agents/plan-stat-module.md §4 e §5.3.

CREATE TABLE stat_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_id       UUID REFERENCES stat_definitions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  period_start  DATE NOT NULL,
  -- La condizione su cui il programma è stato scritto: se cambia, il programma
  -- è scaduto anche se il periodo è lo stesso.
  condition     TEXT NOT NULL,
  -- Diagnosi di famiglia, quando la stat è un VFP con figli (null altrimenti).
  diagnosis     TEXT,

  program       JSONB NOT NULL,   -- { lettura, passi[], nota }
  -- Write-up dell'utente: cosa ha effettivamente fatto. Il pezzo che nella tech
  -- originale scriveva lo staff a mano.
  user_writeup  TEXT,
  outcome       TEXT CHECK (outcome IN ('compiuta', 'parziale', 'saltata')),

  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (stat_id, period_start)
);

CREATE INDEX idx_stat_programs_user ON stat_programs(user_id, period_start);

ALTER TABLE stat_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON stat_programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_reads_all_stat_programs" ON stat_programs FOR SELECT USING (is_admin());
