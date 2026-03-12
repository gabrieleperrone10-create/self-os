import type { Checkin, Decision } from '@/types';

export interface MomentumData {
  score: number;
  stateComponent: number;  // 0-40
  streakComponent: number; // 0-30
  visionComponent: number; // 0-30
  avgScore: number;
  visionRatio: number;
  color: 'green' | 'gold' | 'red';
}

export function calculateMomentum(
  checkins: Checkin[],
  decisions: Decision[],
  streak: number
): MomentumData {
  // Component 1 — avg state score last 7 days (40%)
  const last7 = checkins.filter(c => {
    const diff = (Date.now() - new Date(c.date).getTime()) / 86400000;
    return diff <= 7;
  });
  const avgScore =
    last7.length > 0
      ? last7.reduce((sum, c) => sum + (c.state_score ?? 5), 0) / last7.length
      : 0;
  const stateComponent = (avgScore / 10) * 40;

  // Component 2 — streak (30%) — 14+ days = full score
  const streakComponent = Math.min(streak / 14, 1) * 30;

  // Component 3 — vision vs fear decisions last 14 days (30%)
  const last14Decisions = decisions.filter(d => {
    const diff = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
    return diff <= 14 && d.origin !== null && d.origin !== 'unclear';
  });
  const visionCount = last14Decisions.filter(d => d.origin === 'vision').length;
  const totalDecisions = last14Decisions.length;
  // If no decisions: neutral contribution (15 pts)
  const visionRatio = totalDecisions > 0 ? visionCount / totalDecisions : 0.5;
  const visionComponent = visionRatio * 30;

  const score = Math.max(1, Math.min(100, Math.round(stateComponent + streakComponent + visionComponent)));

  return {
    score,
    stateComponent: Math.round(stateComponent),
    streakComponent: Math.round(streakComponent),
    visionComponent: Math.round(visionComponent),
    avgScore: Math.round(avgScore * 10) / 10,
    visionRatio: Math.round(visionRatio * 100),
    color: score >= 70 ? 'green' : score >= 40 ? 'gold' : 'red',
  };
}

export const MOMENTUM_COLOR = {
  green: '#8B9E7A',
  gold:  '#C9A96E',
  red:   '#9E7A7A',
} as const;
