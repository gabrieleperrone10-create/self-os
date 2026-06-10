-- Preferenza promemoria email (cron mattina/sera).
-- I cron leggono il profilo con select('*'): finché questa colonna non
-- esiste, il default è "promemoria attivi" (fail-open).

ALTER TABLE profiles ADD COLUMN email_reminders BOOLEAN NOT NULL DEFAULT true;
