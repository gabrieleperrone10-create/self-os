-- SELF OS — Lab Module
-- Experiments: pattern transformation through specific behavioral experiments

CREATE TABLE experiments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_id                  UUID REFERENCES patterns(id),  -- null for free-form

  -- The pattern being worked on
  pattern_title               TEXT NOT NULL,
  pattern_description         TEXT,

  -- Loop mapping (always filled by AI)
  triggers                    TEXT[] NOT NULL,
  emotion_sensation           TEXT NOT NULL,
  automatic_action            TEXT NOT NULL,
  identity_confirmation       TEXT NOT NULL,

  -- Intervention
  body_discharge_name         TEXT NOT NULL,
  body_discharge_instruction  TEXT NOT NULL,
  body_discharge_duration     TEXT NOT NULL,
  different_action            TEXT NOT NULL,
  different_action_when       TEXT NOT NULL,

  ai_rationale                TEXT,

  -- Status
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'stuck')),
  resolution  TEXT CHECK (resolution IN ('integrated', 'behavioral_shift', 'no_change')),

  -- Timeline
  started_at    DATE DEFAULT CURRENT_DATE,
  duration_days INTEGER DEFAULT 7,
  ends_at       DATE,

  -- AI review (generated after duration_days)
  last_review     TEXT,
  last_review_at  TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE experiment_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id  UUID REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_id     UUID REFERENCES checkins(id),  -- optional link to checkin

  emerged   BOOLEAN NOT NULL,
  response  TEXT CHECK (response IN (
    'acted_differently',  -- saw it, chose differently
    'noticed_during',     -- fell into it, noticed in real time
    'noticed_after',      -- fell into it, noticed after
    'automatic'           -- fell into it, didn't see it
  )),
  note TEXT,

  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (experiment_id, date)
);

-- Indexes
CREATE INDEX idx_experiments_user_status ON experiments(user_id, status);
CREATE INDEX idx_experiment_entries_exp  ON experiment_entries(experiment_id, date);
CREATE INDEX idx_experiment_entries_user ON experiment_entries(user_id, date);

-- RLS
ALTER TABLE experiments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON experiments       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON experiment_entries FOR ALL USING (auth.uid() = user_id);
