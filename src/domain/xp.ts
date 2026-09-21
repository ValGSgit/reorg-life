/**
 * Experience and levels. Gentle by design: XP is only ever added, never
 * removed, so undoing something is a correction rather than a punishment.
 */
export const XP_PER_CHECKIN = 10;
/**
 * A second or third check-in on the same day (ADR 0001).
 *
 * Smaller than the first, so there is no pressure to check in three times to
 * "do the day properly" — but never zero, because showing up again on a hard
 * day is worth something. It is a bonus, not a quota.
 */
export const XP_PER_REPEAT_CHECKIN = 3;
export const XP_PER_TASK = 15;
export const XP_PER_HABIT = 5;

/**
 * Levels get progressively further apart, so early progress feels quick.
 *
 * XP is clamped at zero first. Nothing in the app subtracts XP, but a
 * restored backup or a hand-edited database could carry a negative or
 * non-numeric value, and `Math.sqrt` of a negative is NaN — which would then
 * spread silently into the level badge and the progress bar.
 */
export const levelFor = (xp: number) => {
  const safe = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return Math.floor(Math.sqrt(safe / 50)) + 1;
};

/** Total XP needed to reach a level. Inverse of `levelFor`. */
export const xpForLevel = (level: number) => 50 * (level - 1) ** 2;
