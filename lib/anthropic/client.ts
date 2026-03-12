import Anthropic from '@anthropic-ai/sdk';

// Singleton — used only in API routes (server-side)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
});

export const AI_MODEL = 'claude-sonnet-4-20250514';
