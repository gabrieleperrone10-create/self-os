-- Tracking uso AI per utente: rate limiting per piano + visibilità costi.
-- Una riga per chiamata Claude, con i token reali riportati dall'API.

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route TEXT NOT NULL,                -- es. 'mirror', 'daily-insight'
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query principale: "quante chiamate ha fatto questo utente oggi?"
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
