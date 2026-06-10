-- Admin panel: l'admin (profiles.role = 'admin') deve poter leggere i dati
-- aggregati di tutti gli utenti per /admin (overview, tabella utenti, dettaglio).
-- Stesso pattern di "coach_sees_client_*" (001_initial_schema.sql) ma senza
-- vincolo coach_clients: ogni admin vede tutto in sola lettura.
--
-- ⚠ SUPERSEDUTA da 011_fix_admin_rls_recursion.sql: la subquery su profiles
-- DENTRO una policy su profiles stessa causa "infinite recursion detected
-- in policy for relation profiles" (42P17) — Postgres valuta TUTTE le policy
-- permissive per ogni subquery ricorsiva, non solo quella che farebbe
-- terminare la valutazione. Effetto: ogni SELECT su profiles/checkins/scans/
-- patterns/decisions/ai_usage falliva silenziosamente (fail-open → dati
-- vuoti per TUTTI gli utenti). Eseguire 011 subito dopo questo file.

-- profiles: la subquery su profiles SEMBRAVA sicura — la riga del
-- richiedente (auth.uid() = id) è sempre visibile via "profiles_own_data" —
-- ma non basta a evitare la ricorsione (vedi nota sopra).
CREATE POLICY "admin_reads_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_reads_all_checkins" ON checkins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_reads_all_scans" ON scans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_reads_all_patterns" ON patterns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_reads_all_decisions" ON decisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "admin_reads_all_ai_usage" ON ai_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Promuovi il tuo utente ad admin (esegui a parte, sostituendo l'email):
-- UPDATE profiles SET role = 'admin' WHERE email = 'gabrieleperrone10@gmail.com';
