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
export const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (level: number) => 50 * (level - 1) ** 2;

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Gentle streak: a single missed day does not break it (built-in rest day). */
export function gentleStreak(days: string[], today = dayKey()): number {
  const set = new Set(days);
  let streak = 0;
  let misses = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const k = dayKey(d);
    if (set.has(k)) { streak++; misses = 0; }
    else if (k !== today) { misses++; if (misses >= 2) break; }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
