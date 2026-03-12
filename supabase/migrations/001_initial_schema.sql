-- SELF OS — Initial Schema
-- Run this in Supabase SQL Editor after creating the project

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id                   UUID REFERENCES auth.users PRIMARY KEY,
  email                TEXT,
  full_name            TEXT,
  role                 TEXT DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
  coach_id             UUID REFERENCES profiles(id),
  plan                 TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'coach')),
  stripe_customer_id   TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Initial scan
CREATE TABLE scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answers      JSONB NOT NULL,
  analysis     JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('morning', 'evening')),
  state_score INTEGER CHECK (state_score BETWEEN 1 AND 10),
  answers     JSONB NOT NULL,
  ai_insight  TEXT,
  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Patterns identified over time
CREATE TABLE patterns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('shadow', 'expansion', 'belief', 'state')),
  title       TEXT NOT NULL,
  description TEXT,
  frequency   INTEGER DEFAULT 1,
  first_seen  DATE DEFAULT CURRENT_DATE,
  last_seen   DATE DEFAULT CURRENT_DATE,
  is_active   BOOLEAN DEFAULT true,
  metadata    JSONB
);

-- Decisional mirror entries
CREATE TABLE decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description  TEXT NOT NULL,
  state_score  INTEGER CHECK (state_score BETWEEN 1 AND 10),
  origin       TEXT CHECK (origin IN ('fear', 'vision', 'unclear')),
  ai_mirror    TEXT,
  outcome      TEXT,
  outcome_date DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Coach-client relationship
CREATE TABLE coach_clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID REFERENCES profiles(id) NOT NULL,
  client_id  UUID REFERENCES profiles(id) NOT NULL,
  status     TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_id, client_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_scans_user_id        ON scans(user_id);
CREATE INDEX idx_checkins_user_id     ON checkins(user_id);
CREATE INDEX idx_checkins_date        ON checkins(user_id, date);
CREATE INDEX idx_patterns_user_id     ON patterns(user_id, is_active);
CREATE INDEX idx_decisions_user_id    ON decisions(user_id);
CREATE INDEX idx_coach_clients_coach  ON coach_clients(coach_id);
CREATE INDEX idx_coach_clients_client ON coach_clients(client_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage only their own
CREATE POLICY "profiles_own_data" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Scans: user owns their data
CREATE POLICY "users_own_data" ON scans
  FOR ALL USING (auth.uid() = user_id);

-- Checkins: user owns their data
CREATE POLICY "users_own_data" ON checkins
  FOR ALL USING (auth.uid() = user_id);

-- Patterns: user owns their data
CREATE POLICY "users_own_data" ON patterns
  FOR ALL USING (auth.uid() = user_id);

-- Decisions: user owns their data
CREATE POLICY "users_own_data" ON decisions
  FOR ALL USING (auth.uid() = user_id);

-- Coach sees clients' scans
CREATE POLICY "coach_sees_client_scans" ON scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid() AND client_id = scans.user_id AND status = 'active'
    )
  );

-- Coach sees clients' checkins
CREATE POLICY "coach_sees_client_checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid() AND client_id = checkins.user_id AND status = 'active'
    )
  );

-- Coach sees clients' patterns
CREATE POLICY "coach_sees_client_patterns" ON patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid() AND client_id = patterns.user_id AND status = 'active'
    )
  );

-- Coach manages their own coach_clients entries
CREATE POLICY "coach_manages_clients" ON coach_clients
  FOR ALL USING (auth.uid() = coach_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
