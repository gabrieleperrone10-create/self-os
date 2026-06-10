-- Profilo identitario longitudinale: sintesi AI cumulativa del percorso.
-- Una riga per versione — la storia delle versioni è la "distanza tra chi
-- eri e chi sei" che il prodotto promette di rendere misurabile.

CREATE TABLE identity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  profile_text TEXT NOT NULL,
  -- quanti dati hanno alimentato questa versione: {checkins, decisions, patterns}
  source_counts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, version)
);

CREATE INDEX idx_identity_profiles_user ON identity_profiles(user_id, version DESC);

ALTER TABLE identity_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON identity_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile" ON identity_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Il coach vede i profili dei propri clienti (come per scans)
CREATE POLICY "coach_sees_client_profiles" ON identity_profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_id = auth.uid() AND client_id = identity_profiles.user_id
  ));
