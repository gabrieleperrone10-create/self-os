import Anthropic from '@anthropic-ai/sdk';

// Singleton — used only in API routes (server-side)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
});

export const AI_MODEL = 'claude-sonnet-4-6';

/**
 * Contesto knowledge base come blocco system con prompt caching.
 * Il contenuto è identico per tutti gli utenti → la cache (TTL 5 min,
 * rinnovata a ogni hit) viene condivisa tra le chiamate, tagliando
 * costi e latenza sulle route che iniettano la base psicologica.
 * `instruction` è l'indicazione d'uso specifica del prompt chiamante.
 */
export function cachedKbSystem(
  kbContext: string,
  instruction: string,
  userSpecificContext?: string,
): Anthropic.Messages.TextBlockParam[] | undefined {
  const blocks: Anthropic.Messages.TextBlockParam[] = [];
  if (kbContext) {
    blocks.push({
      type: 'text',
      text: `${kbContext}\n\n${instruction}`,
      cache_control: { type: 'ephemeral' },
    });
  }
  // Il contesto per-utente va DOPO il blocco cachato: la cache copre solo
  // il prefisso fino a cache_control, così resta condivisa tra utenti.
  if (userSpecificContext) {
    blocks.push({ type: 'text', text: userSpecificContext });
  }
  return blocks.length > 0 ? blocks : undefined;
}
