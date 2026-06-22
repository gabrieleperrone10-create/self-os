-- ================================================================
-- 015 — Insight biometrico persistente e versionato
-- Stessa filosofia di identity_profiles (007): una riga per versione.
-- La storia delle versioni e la traiettoria del recupero nel tempo.
-- L insight smette di essere un bottone effimero e diventa parte del
-- sistema: si rigenera ogni 7+ giorni e si mostra sempre.
-- ================================================================

CREATE TABLE biometric_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  -- Oggetto BiometricsInsight completo: stato_nervoso, lettura, correlazioni
  insight JSONB NOT NULL,
  -- Snapshot del contesto che ha alimentato la versione
  hrv_baseline NUMERIC,
  data_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, version)
);

CREATE INDEX idx_biometric_insights_user ON biometric_insights(user_id, version DESC);

ALTER TABLE biometric_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_bio_insight" ON biometric_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_bio_insight" ON biometric_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Il coach vede gli insight dei propri clienti (come per scans e profili)
CREATE POLICY "coach_sees_client_bio_insight" ON biometric_insights
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_id = auth.uid() AND client_id = biometric_insights.user_id
  ));
