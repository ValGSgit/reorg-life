import type { ImageSourcePropType } from 'react-native';
import type { CharacterId } from './domain';

/**
 * Companion artwork, keyed by character and mood.
 *
 * Mood runs 1 (rough) to 5 (thriving), matching the check-in scale, so a
 * companion's expression follows how the days have actually been going.
 *
 * Metro resolves `require()` at build time, so every path listed here must be
 * a real file or the bundle fails. A character with no entry falls back to the
 * blob drawn in `components/Character.tsx`, so a partial set is fine — which
 * is just as well, since only two companions are drawn so far.
 *
 * > Everything registered here today is a **watermark-derived placeholder**
 * > and must not ship. See docs/ASSETS.md and task T-010.
 */
export type ArtMood = 1 | 2 | 3 | 4 | 5;

type ArtSet = Partial<Record<ArtMood, ImageSourcePropType>>;

export const CHARACTER_ART: Partial<Record<CharacterId, ArtSet>> = {
  sprout: {
    1: require('../assets/characters/sprout-1.png'),
    2: require('../assets/characters/sprout-2.png'),
    3: require('../assets/characters/sprout-3.png'),
    4: require('../assets/characters/sprout-4.png'),
    5: require('../assets/characters/sprout-5.png'),
  },
  ember: {
    1: require('../assets/characters/ember-1.png'),
    2: require('../assets/characters/ember-2.png'),
    3: require('../assets/characters/ember-3.png'),
    4: require('../assets/characters/ember-4.png'),
    5: require('../assets/characters/ember-5.png'),
  },
  // Dusk's sheet has "Stage 1..5" text baked into the image, so it is not
  // usable. Dusk falls back to the blob — and since the time-of-day rotation
  // needs Dusk every night, that fallback is on the critical path and is
  // covered by a test. See ADR 0001 and task T-010.
};

/** Clamps anything to the 1-5 scale, so bad data cannot pick a missing image. */
export const artMoodFor = (mood: number): ArtMood => {
  const rounded = Math.round(Number.isFinite(mood) ? mood : 3);
  return Math.min(5, Math.max(1, rounded)) as ArtMood;
};

/**
 * The right image for this character and mood, or undefined to use the blob.
 *
 * If a character is part-way through being drawn, the nearest available mood
 * is used rather than dropping to the blob mid-set — a slightly wrong
 * expression reads better than the companion changing species.
 */
export function characterArt(id: CharacterId | undefined, mood: number): ImageSourcePropType | undefined {
  if (!id) return undefined;
  const set = CHARACTER_ART[id];
  if (!set) return undefined;

  const wanted = artMoodFor(mood);
  const exact = set[wanted];
  if (exact) return exact;

  const available = (Object.keys(set) as unknown[])
    .map((k) => Number(k) as ArtMood)
    .filter((m) => set[m])
    .sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted));

  return available.length ? set[available[0]] : undefined;
}
