import Anthropic from '@anthropic-ai/sdk';

// Singleton — used only in API routes (server-side)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
});

export const AI_MODEL = 'claude-sonnet-5';

// Sonnet 5 attiva l'adaptive thinking quando `thinking` è omesso (Sonnet 4.6
// no): sulle route interattive — output brevi, max_tokens stretti — va
// disattivato esplicitamente, o il ragionamento consuma il budget di output
// e il primo blocco di content smette di essere il testo.
export const NO_THINKING = { type: 'disabled' } as const;

// Route di sintesi longitudinale (identity-profile, monthly-letter): bassa
// frequenza, alta profondità → Fable 5. Il thinking è sempre attivo e il
// parametro va omesso; effort medio tiene la latenza dentro maxDuration.
export const DEEP_MODEL = 'claude-fable-5';
export const DEEP_FALLBACK_MODEL = 'claude-opus-4-8';

export interface DeepMessageResult {
  message: Anthropic.Message;
  model: string;
}

/**
 * Chiamata "deep" con fallback: Fable 5, e su refusal dei classifier o
 * errore (es. requisiti di data retention non soddisfatti dall'org) ritenta
 * su Opus 4.8 con gli stessi parametri. Ritorna anche il modello effettivo,
 * da usare in recordAiUsage.
 */
export async function createDeepMessage(
  params: Omit<Anthropic.Messages.MessageCreateParamsNonStreaming, 'model' | 'thinking'>,
): Promise<DeepMessageResult> {
  try {
    const message = await anthropic.messages.create({
      ...params,
      model: DEEP_MODEL,
      output_config: { effort: 'medium' },
    });
    if (message.stop_reason !== 'refusal') return { message, model: DEEP_MODEL };
    console.error(`[deep-model] refusal da ${DEEP_MODEL} — fallback su ${DEEP_FALLBACK_MODEL}`);
  } catch (err) {
    console.error(`[deep-model] errore da ${DEEP_MODEL} — fallback su ${DEEP_FALLBACK_MODEL}:`, err);
  }
  const message = await anthropic.messages.create({
    ...params,
    model: DEEP_FALLBACK_MODEL,
  });
  return { message, model: DEEP_FALLBACK_MODEL };
}

/**
 * Primo blocco di testo della risposta. Con Fable 5 il content può aprirsi
 * con blocchi thinking: `content[0]` non è più garantito essere il testo.
 */
export function firstText(message: Anthropic.Message): string {
  const block = message.content.find(b => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('Risposta AI non testuale');
  return block.text;
}

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
