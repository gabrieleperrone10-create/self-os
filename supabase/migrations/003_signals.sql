-- SELF OS — Segnali
-- Catture spontanee: momenti, realizzazioni, pattern osservati fuori dagli orari schedulati

CREATE TABLE signals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content      TEXT NOT NULL CHECK (char_length(content) <= 300),
  state_score  INTEGER NOT NULL CHECK (state_score BETWEEN 1 AND 10),
  ai_analysis  TEXT,             -- Haiku: collega a pattern o identifica nuovo
  pattern_id   UUID REFERENCES patterns(id), -- se collegato a pattern esistente
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_user ON signals(user_id, created_at DESC);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON signals FOR ALL USING (auth.uid() = user_id);
