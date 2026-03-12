import { createClient } from '@/lib/supabase/server';

export type KBCategory = 'archetype' | 'framework' | 'process' | 'wheel_of_life' | 'glossary';

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

/**
 * Fetches only the archetypes context (all 12) — for scan analysis and pattern recognition.
 */
export async function fetchArchetypesContext(): Promise<string> {
  return fetchKBContext(['archetype']);
}

/**
 * Fetches frameworks + process context — for mirror and outcome reflection.
 */
export async function fetchFrameworkContext(): Promise<string> {
  return fetchKBContext(['framework', 'process']);
}

/**
 * Fetches full context (all categories) — for monthly letter and weekly report.
 */
export async function fetchFullContext(): Promise<string> {
  return fetchKBContext(['archetype', 'framework', 'process', 'wheel_of_life']);
}
