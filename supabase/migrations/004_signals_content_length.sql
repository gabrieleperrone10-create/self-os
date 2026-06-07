-- SELF OS — Segnali: aumenta il limite di contenuto da 300 a 1000 caratteri

ALTER TABLE signals DROP CONSTRAINT signals_content_check;
ALTER TABLE signals ADD CONSTRAINT signals_content_check CHECK (char_length(content) <= 1000);
