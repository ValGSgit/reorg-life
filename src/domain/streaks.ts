import { dayKey } from './time';

/**
 * Which days a habit asks for. 'daily', 'weekdays', or a comma-separated list
 * of weekday numbers where 0 is Sunday (for example '1,3,5').
 */
export const SCHEDULES = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: '1,3,5', label: 'Mon / Wed / Fri' },
  { id: '0,6', label: 'Weekends' },
] as const;

export function scheduleLabel(schedule: string): string {
  const known = SCHEDULES.find((s) => s.id === schedule);
  if (known) return known.label;
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = schedule
    .split(',')
    .map((n) => names[Number(n)])
    .filter(Boolean);
  return days.length ? days.join(' / ') : 'Every day';
}

/** Whether a habit on this schedule is asked for on the given date. */
export function isDueOn(schedule: string, d: Date): boolean {
  if (!schedule || schedule === 'daily') return true;
  const dow = d.getDay();
  if (schedule === 'weekdays') return dow >= 1 && dow <= 5;
  return schedule.split(',').some((n) => Number(n) === dow);
}

/**
 * Gentle streak: counts days the thing was done, walking backwards, and
 * forgives one missed day before stopping. Days the schedule does not ask for
 * are skipped entirely rather than counted against you, and today is never
 * treated as missed — the day is not over yet.
 *
 * This forgiveness is a product rule, not an implementation detail. See
 * AGENTS.md; tests protect it.
 */
export function gentleStreakOn(days: string[], schedule: string, today = dayKey()): number {
  const set = new Set(days);
  let streak = 0;
  let misses = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const k = dayKey(d);
    if (isDueOn(schedule, d)) {
      if (set.has(k)) {
        streak++;
        misses = 0;
      } else if (k !== today) {
        misses++;
        if (misses >= 2) break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Gentle streak for something expected every day, such as the check-in. */
export const gentleStreak = (days: string[], today = dayKey()): number =>
  gentleStreakOn(days, 'daily', today);
