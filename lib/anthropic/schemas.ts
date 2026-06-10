import { z } from 'zod';
import type { ScanReport } from '@/types/scan';
import type { PatternRecognitionResult, ExperimentGeneration } from '@/types';
import type { MirrorAnalysis } from '@/lib/anthropic/prompts/mirror';
import type { VoiceAnalysis } from '@/lib/anthropic/prompts/voice-analysis';

// Gli schemi validano l'output AI a runtime; `satisfies z.ZodType<T>`
// garantisce a compile time che schema e interfaccia non divergano mai.
// I numeri usano coerce: i modelli a volte restituiscono "7" invece di 7.
// I campi opzionali accettano null: i modelli usano null e undefined
// in modo intercambiabile.

/** Campo opzionale tollerante: undefined e null → undefined */
const opt = <S extends z.ZodTypeAny>(schema: S) =>
  schema.nullish().transform(v => (v ?? undefined) as z.output<S> | undefined);

const archetypeSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.coerce.number(),
  description: z.string(),
});

const loopSchema = z.object({
  area: z.string(),
  trigger: z.string(),
  thought: z.string(),
  behavior: z.string(),
  result: z.string(),
  reinforcement: z.string(),
});

// looseObject: i campi extra che il prompt aggiungerà in futuro vengono
// preservati nel JSONB salvato, non scartati silenziosamente.
export const scanReportSchema = z.looseObject({
  archetype_primary: archetypeSchema,
  archetype_secondary: archetypeSchema,
  archetype_tertiary: opt(archetypeSchema),
  spiral_level: z.string(),
  spiral_description: opt(z.string()),
  loop_primary: loopSchema,
  loop_secondary: loopSchema,
  loop_tertiary: opt(loopSchema),
  belief_limiting_primary: z.object({ text: z.string(), origin: z.string() }),
  belief_limiting_secondary: z.object({ text: z.string(), origin: z.string() }),
  belief_resource: z.object({ text: z.string() }),
  expectation_gap: opt(z.object({
    declared_expectation: z.string(),
    observed_behavior: z.string(),
    gap_dynamic: z.string(),
  })),
  wheel_expansion: z.array(z.string()),
  wheel_loops: z.array(z.string()),
  wheel_priority: z.object({ area: z.string(), reason: z.string() }),
  identity_target: z.object({
    name: z.string(),
    shift_from: z.string(),
    shift_to: z.string(),
    first_action: z.string(),
  }),
  letter: z.string(),
}) satisfies z.ZodType<ScanReport>;

export const mirrorAnalysisSchema = z.looseObject({
  paura_percent: z.coerce.number(),
  visione_percent: z.coerce.number(),
  da_dove: z.string(),
  versione_evoluta: z.string(),
  domanda_finale: z.string(),
}) satisfies z.ZodType<MirrorAnalysis>;

export const voiceAnalysisSchema = z.looseObject({
  state_score: z.coerce.number(),
  keywords: z.array(z.string()),
  pattern: z.string().nullish().transform(v => v ?? null),
  insight: z.string(),
}) satisfies z.ZodType<VoiceAnalysis>;

export const patternRecognitionSchema = z.looseObject({
  patterns: z.array(z.object({
    type: z.enum(['shadow', 'expansion', 'belief', 'state']),
    title: z.string(),
    description: z.string(),
    frequency: z.coerce.number(),
    trigger: z.string(),
  })),
  weekly_insight: z.string(),
}) satisfies z.ZodType<PatternRecognitionResult>;

export const experimentGenerationSchema = z.looseObject({
  loop_map: z.object({
    triggers: z.array(z.string()),
    emotion_sensation: z.string(),
    automatic_action: z.string(),
    identity_confirmation: z.string(),
  }),
  intervention: z.object({
    body_discharge: z.object({
      name: z.string(),
      instruction: z.string(),
      duration: z.string(),
    }),
    different_action: z.object({
      instruction: z.string(),
      when: z.string(),
    }),
  }),
  meta: z.object({
    pattern_title: z.string(),
    ai_rationale: z.string(),
    duration_days: z.coerce.number(),
  }),
}) satisfies z.ZodType<ExperimentGeneration>;
