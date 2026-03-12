// SELF OS — Global TypeScript Types

export type UserRole = 'user' | 'coach' | 'admin';
export type UserPlan = 'free' | 'pro' | 'coach';
export type CheckinType = 'morning' | 'evening';
export type PatternType = 'shadow' | 'expansion' | 'belief' | 'state';
export type DecisionOrigin = 'fear' | 'vision' | 'unclear';
export type CoachClientStatus = 'active' | 'paused' | 'ended';

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
