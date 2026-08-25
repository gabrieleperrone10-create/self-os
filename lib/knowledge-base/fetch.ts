import { createClient } from '@/lib/supabase/server';

export type KBCategory =
  | 'archetype' | 'framework' | 'process' | 'wheel_of_life' | 'glossary'
  | 'mechanism' | 'safety' | 'epistemic' | 'biometrics_framework' | 'stat_conditions';

interface KBEntry {
  title: string;
  content: string;
  category: string;
  archetype_id: string | null;
}

/**
 * Fetches knowledge base entries by category and formats them as a context string
 * for injection into AI prompts.
 */
export async function fetchKBContext(categories: KBCategory[]): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_base')
    .select('title, content, category, archetype_id')
    .in('category', categories)
    .order('category')
    .order('archetype_id', { ascending: true, nullsFirst: false });

  if (error || !data || data.length === 0) {
    return '';
  }

  const entries = data as KBEntry[];

  const sections = entries.map(e =>
    `## ${e.title}\n${e.content}`
  ).join('\n\n---\n\n');

  return `=== BASE PSICOLOGICA SELF OS ===\n\n${sections}\n\n=== FINE BASE PSICOLOGICA ===`;
}

// Il contratto epistemico viaggia con OGNI contesto: è la voce del sistema.

/**
 * Archetypes context (le 12 firme + regola d'uso) — for scan analysis and pattern recognition.
 */
export async function fetchArchetypesContext(): Promise<string> {
  return fetchKBContext(['archetype', 'epistemic']);
}

/**
 * Frameworks + meccanismi evidence-based — for mirror and outcome reflection.
 */
export async function fetchFrameworkContext(): Promise<string> {
  return fetchKBContext(['framework', 'process', 'mechanism', 'epistemic']);
}

/**
 * Contesto per il check-in quotidiano: include il protocollo safety
 * (stati bassi, ruminazione) oltre a framework e meccanismi.
 */
export async function fetchDailyContext(): Promise<string> {
  return fetchKBContext(['framework', 'process', 'mechanism', 'epistemic', 'safety']);
}

/**
 * Contesto minimo per la cattura rapida (Haiku): safety + voce.
 */
export async function fetchSafetyContext(): Promise<string> {
  return fetchKBContext(['safety', 'epistemic']);
}

/**
 * Full context — for monthly letter and weekly report.
 */
export async function fetchFullContext(): Promise<string> {
  return fetchKBContext(['archetype', 'framework', 'process', 'wheel_of_life', 'mechanism', 'epistemic']);
}

/**
 * Contesto biometrico: i tre strati di lettura corpo/mente + i meccanismi
 * generali + contratto epistemico + safety. Per la route biometrics-insight.
 */
export async function fetchBiometricsContext(): Promise<string> {
  return fetchKBContext(['biometrics_framework', 'mechanism', 'epistemic', 'safety']);
}

/**
 * Contesto del modulo STAT: le condizioni con le loro formule, la regola
 * cardinale, il registro. Per la route stat-program.
 */
export async function fetchStatContext(): Promise<string> {
  return fetchKBContext(['stat_conditions', 'epistemic']);
}
