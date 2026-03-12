import type { Checkin } from '@/types';

// Returns streak in consecutive days (most recent first)
export function calculateStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0;

  // Get unique dates sorted descending
  const dates = Array.from(new Set(checkins.map(c => c.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));

  // Streak must include today or yesterday to be "active"
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getCheckinType(): 'morning' | 'evening' {
  const hour = new Date().getHours();
  return hour < 15 ? 'morning' : 'evening';
}

export function averageStateScore(checkins: Checkin[]): number | null {
  if (checkins.length === 0) return null;
  const sum = checkins.reduce((acc, c) => acc + (c.state_score ?? 0), 0);
  return Math.round((sum / checkins.length) * 10) / 10;
}
