-- ============================================================
-- 013 - Calendario + Biometrici
-- ============================================================

-- Connessione calendario (ICS per ora; extensible a OAuth/Spike)
CREATE TABLE calendar_connections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ics_url     TEXT NOT NULL,
  label       TEXT DEFAULT 'Google Calendar',
  last_sync   TIMESTAMPTZ,
  event_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Evenii importati dal calendario
CREATE TABLE calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  location    TEXT,
  description TEXT,
  attendees   JSONB DEFAULT '[]',
  all_day     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, external_id)
);

-- Campioni biometrici (Apple Health via Health Auto Export)
CREATE TABLE biometric_samples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source      TEXT NOT NULL DEFAULT 'apple_health',
  metric      TEXT NOT NULL,
  value       NUMERIC NOT NULL,
  unit        TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, source, metric, recorded_at)
);

-- Token per ingest Health Auto Export (chiamata senza sessione, da iPhone)
CREATE TABLE biometric_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ingest_token UUID DEFAULT gen_random_uuid() NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_cal_events_user_time   ON calendar_events(user_id, start_at);
CREATE INDEX idx_bio_samples_user_time  ON biometric_samples(user_id, recorded_at);
CREATE INDEX idx_bio_conn_token         ON biometric_connections(ingest_token);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE calendar_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_samples      ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_connections  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON calendar_connections  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON calendar_events        FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON biometric_samples      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data" ON biometric_connections  FOR ALL USING (user_id = auth.uid());

-- Il coach vede eventi e biometrici dei clienti
CREATE POLICY "coach_sees_client_calendar" ON calendar_events
  FOR SELECT USING (
    user_id IN (
      SELECT client_id FROM coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "coach_sees_client_biometrics" ON biometric_samples
  FOR SELECT USING (
    user_id IN (
      SELECT client_id FROM coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );
