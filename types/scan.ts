export type QuestionType = 'SCALA' | 'SCELTA' | 'MULTI' | 'FRASE' | 'TESTO' | 'ACCORDO' | 'RANK';

export interface ScanQuestion {
  id: string;
  n: number;
  section: number;
  text: string;
  type: QuestionType;
  options?: string[];
  max?: number; // SCALA default 10, ACCORDO = 5
  placeholder?: string;
  subtext?: string;
}

export interface ScanSection {
  n: number;
  title: string;
  subtitle: string;
  questions: ScanQuestion[];
}

export type ScanAnswers = Record<string, string | number | string[]>;

export interface ScanReport {
  archetype_primary: { id: string; title: string; score: number; description: string };
  archetype_secondary: { id: string; title: string; score: number; description: string };
  archetype_tertiary?: { id: string; title: string; score: number; description: string };
  spiral_level: string;
  spiral_description?: string;
  loop_primary: { area: string; trigger: string; thought: string; behavior: string; result: string; reinforcement: string };
  loop_secondary: { area: string; trigger: string; thought: string; behavior: string; result: string; reinforcement: string };
  loop_tertiary?: { area: string; trigger: string; thought: string; behavior: string; result: string; reinforcement: string };
  belief_limiting_primary: { text: string; origin: string };
  belief_limiting_secondary: { text: string; origin: string };
  belief_resource: { text: string };
  // Generato dal prompt, letto da monthly-letter e weekly-report
  expectation_gap?: { declared_expectation: string; observed_behavior: string; gap_dynamic: string };
  wheel_expansion: string[];
  wheel_loops: string[];
  wheel_priority: { area: string; reason: string };
  identity_target: { name: string; shift_from: string; shift_to: string; first_action: string };
  letter: string;
}
