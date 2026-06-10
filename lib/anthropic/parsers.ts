import { z } from 'zod';

/**
 * Estrae il blocco JSON dalla risposta grezza di Claude.
 * Gestisce sia i code fence (```json ... ```) sia testo spurio
 * prima/dopo l'oggetto.
 */
export function extractJson(raw: string): string {
  const unfenced = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  if (unfenced.startsWith('{')) return unfenced;

  // Fallback: primo '{' → ultimo '}' — copre preamboli tipo "Ecco il JSON:"
  const match = unfenced.match(/\{[\s\S]*\}/);
  return match ? match[0] : unfenced;
}

/**
 * Parsa e valida l'output JSON di Claude contro uno schema Zod.
 * Errori descrittivi con contesto: distinguono "non è JSON" da
 * "JSON valido ma struttura sbagliata" — fondamentale nei log Vercel.
 */
export function parseAIJson<T>(
  raw: string,
  schema: z.ZodType<T>,
  context: string,
): T {
  const jsonText = extractJson(raw);

  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `[${context}] output AI non è JSON valido. Inizio risposta: ${raw.slice(0, 200)}`,
    );
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`[${context}] output AI non conforme allo schema: ${issues}`);
  }

  return result.data;
}
