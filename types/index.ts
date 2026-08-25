// SELF OS — Global TypeScript Types

export type UserRole = 'user' | 'coach' | 'admin';
export type UserPlan = 'free' | 'pro' | 'coach';
export type CheckinType = 'morning' | 'evening';
export type PatternType = 'shadow' | 'expansion' | 'belief' | 'state';
export type DecisionOrigin = 'fear' | 'vision' | 'unclear';
export type CoachClientStatus = 'active' | 'paused' | 'ended';
export type ExperimentStatus = 'active' | 'paused' | 'completed' | 'stuck';
export type ExperimentResolution = 'integrated' | 'behavioral_shift' | 'no_change';
export type ExperimentResponse = 'acted_differently' | 'noticed_during' | 'noticed_after' | 'automatic';
export type StatArea = 'corpo' | 'dieta' | 'lavoro' | 'relazioni' | 'mente' | 'soldi';
export type StatDirection = 'up' | 'down';
export type StatMode = 'grow' | 'maintain';
export type StatPeriod = 'day' | 'week' | 'month';
export type StatRole = 'quantity' | 'quality' | 'support';
export type StatAggregation = 'sum' | 'mean' | 'last';

export interface Signal {
  id: string;
  user_id: string;
  content: string;
  state_score: number;
  ai_analysis: string | null;
  pattern_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  coach_id: string | null;
  plan: UserPlan;
  stripe_customer_id: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScanAnalysis {
  shadow_pattern: {
    title: string;
    description: string;
  };
  core_wound: {
    title: string;
    description: string;
  };
  expansion_zone: {
    title: string;
    description: string;
  };
  next_edge: {
    title: string;
    description: string;
  };
  letter: string;
}

export interface Scan {
  id: string;
  user_id: string;
  answers: Record<string, string>;
  analysis: ScanAnalysis | null;
  completed_at: string;
}

export interface CheckinAnswers {
  q1?: string;
  q2?: string;
  q3?: string;
  [key: string]: string | undefined;
}

export interface Checkin {
  id: string;
  user_id: string;
  type: CheckinType;
  state_score: number;
  answers: CheckinAnswers;
  ai_insight: string | null;
  date: string;
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  type: PatternType;
  title: string;
  description: string | null;
  frequency: number;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

export interface Decision {
  id: string;
  user_id: string;
  description: string;
  state_score: number;
  origin: DecisionOrigin | null;
  ai_mirror: string | null;
  outcome: string | null;
  outcome_date: string | null;
  created_at: string;
}

export interface CoachClient {
  id: string;
  coach_id: string;
  client_id: string;
  status: CoachClientStatus;
  notes: string | null;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  checkin_count: number;
  avg_state_score: number | null;
  top_patterns: string[] | null;
  decisions_count: number;
  vision_decisions: number;
  ai_report: string;
  generated_at: string;
}

export interface MonthlyLetter {
  id: string;
  user_id: string;
  month: number;
  year: number;
  ai_letter: string;
  generated_at: string;
}

// Pattern recognition API response
export interface PatternRecognitionResult {
  patterns: Array<{
    type: PatternType;
    title: string;
    description: string;
    frequency: number;
    trigger: string;
  }>;
  weekly_insight: string;
}

export interface Experiment {
  id: string;
  user_id: string;
  pattern_id: string | null;
  pattern_title: string;
  pattern_description: string | null;
  triggers: string[];
  emotion_sensation: string;
  automatic_action: string;
  identity_confirmation: string;
  body_discharge_name: string;
  body_discharge_instruction: string;
  body_discharge_duration: string;
  different_action: string;
  different_action_when: string;
  ai_rationale: string | null;
  status: ExperimentStatus;
  resolution: ExperimentResolution | null;
  started_at: string;
  duration_days: number;
  ends_at: string | null;
  last_review: string | null;
  last_review_at: string | null;
  created_at: string;
}

export interface ExperimentEntry {
  id: string;
  experiment_id: string;
  user_id: string;
  checkin_id: string | null;
  emerged: boolean;
  response: ExperimentResponse | null;
  note: string | null;
  date: string;
  created_at: string;
}

export interface ExperimentGeneration {
  loop_map: {
    triggers: string[];
    emotion_sensation: string;
    automatic_action: string;
    identity_confirmation: string;
  };
  intervention: {
    body_discharge: {
      name: string;
      instruction: string;
      duration: string;
    };
    different_action: {
      instruction: string;
      when: string;
    };
  };
  meta: {
    pattern_title: string;
    ai_rationale: string;
    duration_days: number;
  };
}

export interface StatDefinition {
  id: string;
  user_id: string;
  key: string;
  label: string;
  area: StatArea;
  unit: string | null;
  definition: string | null;
  direction: StatDirection;
  mode: StatMode;
  period: StatPeriod;
  target: number | null;
  /** Il VFP di cui questa stat è un figlio. null = stat a sé, o essa stessa un VFP. */
  parent_id: string | null;
  /** Quale livello di produzione presidia. Presente solo sui figli. */
  role: StatRole | null;
  /** Come si aggregano i valori salendo al periodo del VFP. */
  aggregation: StatAggregation;
  active: boolean;
  created_at: string;
}

export interface StatEntry {
  id: string;
  stat_id: string;
  user_id: string;
  period_start: string;
  value: number;
  estimated: boolean;
  note: string | null;
  created_at: string;
}
