// Va importato PRIMA di qualunque modulo che legge process.env a import-time
// (es. lib/anthropic/client crea il singleton appena importato).
// Gli import ES sono hoisted: un dotenv.config() inline in run.ts
// verrebbe eseguito DOPO la creazione del client.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
