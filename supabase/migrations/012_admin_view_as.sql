-- "Entra come utente": l'admin deve poter leggere experiments, experiment_entries,
-- weekly_reports e identity_profiles di qualsiasi utente per /lab, /identity-map
-- e /distanza in modalità view-as. Stesso pattern di 011 (is_admin(), SECURITY
-- DEFINER, niente ricorsione su profiles).

CREATE POLICY "admin_reads_all_experiments" ON experiments
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_experiment_entries" ON experiment_entries
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_weekly_reports" ON weekly_reports
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_reads_all_identity_profiles" ON identity_profiles
  FOR SELECT USING (is_admin());
