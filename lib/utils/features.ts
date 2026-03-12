import type { UserPlan } from '@/types';

// Features available per plan
const FEATURE_MAP: Record<string, UserPlan[]> = {
  scan:             ['free', 'pro', 'coach'],
  checkin:          ['free', 'pro', 'coach'],
  dashboard:        ['free', 'pro', 'coach'],
  mirror:           ['free', 'pro', 'coach'],   // open during beta
  identity_map:     ['free', 'pro', 'coach'],   // open during beta
  pattern_analysis: ['free', 'pro', 'coach'],   // open during beta
  coach_dashboard:  ['coach'],
};

export function canAccess(feature: keyof typeof FEATURE_MAP, plan: UserPlan): boolean {
  return FEATURE_MAP[feature]?.includes(plan) ?? false;
}

export function requiresPro(plan: UserPlan): boolean {
  return plan === 'free';
}
