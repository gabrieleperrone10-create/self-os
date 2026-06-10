-- Fix per 010_admin_read_all.sql: la policy "admin_reads_all_profiles"
-- conteneva una subquery su profiles DENTRO una policy su profiles stessa.
-- Postgres rileva questo come ricorsione infinita (42P17) e fa fallire
-- QUALSIASI select su profiles — e a cascata su checkins/scans/patterns/
-- decisions/ai_usage, le cui policy admin fanno a loro volta subquery su
-- profiles. Tutto il codice è fail-open, quindi l'effetto era "dashboard
-- e scan results vuoti" senza errori visibili, per TUTTI gli utenti.
--
-- Fix standard Supabase/Postgres: spostare il check "role = 'admin'" in una
-- funzione SECURITY DEFINER. Eseguendo come proprietario della tabella,
-- bypassa RLS su profiles e non ri-triggera le policy -> niente ricorsione.

DROP POLICY IF EXISTS "admin_reads_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_reads_all_checkins" ON checkins;
DROP POLICY IF EXISTS "admin_reads_all_scans" ON scans;
DROP POLICY IF EXISTS "admin_reads_all_patterns" ON patterns;
DROP POLICY IF EXISTS "admin_reads_all_decisions" ON decisions;
DROP POLICY IF EXISTS "admin_reads_all_ai_usage" ON ai_usage;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "admin_reads_all_profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_checkins" ON checkins
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_scans" ON scans
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_patterns" ON patterns
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_decisions" ON decisions
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_ai_usage" ON ai_usage
  FOR SELECT USING (is_admin());
