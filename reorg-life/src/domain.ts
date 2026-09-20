export const DOMAINS = [
  { id: 'health', label: 'Health', color: '#7DB88B' },
  { id: 'relationships', label: 'Relationships', color: '#E28FA4' },
  { id: 'work', label: 'Work', color: '#6C8EBF' },
  { id: 'creativity', label: 'Creativity', color: '#E0A85F' },
  { id: 'finances', label: 'Finances', color: '#8C7FC2' },
  { id: 'digital', label: 'Digital footprint', color: '#5FB3B3' },
] as const;
export type DomainId = (typeof DOMAINS)[number]['id'];

/**
 * The six companions. `body` is the blob colour used until artwork exists;
 * generated art is registered separately in `characterArt.ts`, keyed by these ids.
 */
export const CHARACTERS = [
  { id: 'sprout', name: 'Sprout', trait: 'Calm', body: '#A8D5BA' },
  { id: 'comet', name: 'Comet', trait: 'Curious', body: '#9DB8F0' },
  { id: 'ember', name: 'Ember', trait: 'Energetic', body: '#F4A97F' },
  { id: 'moss', name: 'Moss', trait: 'Cozy', body: '#C9B79C' },
  { id: 'blaze', name: 'Blaze', trait: 'Bold', body: '#E88C8C' },
  { id: 'dusk', name: 'Dusk', trait: 'Dreamy', body: '#C4A8E0' },
] as const;
export type CharacterId = (typeof CHARACTERS)[number]['id'];

export const MOODS = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
] as const;

export const XP_PER_CHECKIN = 10;
export const XP_PER_TASK = 15;
export const XP_PER_HABIT = 5;
export const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (level: number) => 50 * (level - 1) ** 2;

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
