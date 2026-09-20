import type { ImageSourcePropType } from 'react-native';
import type { CharacterId } from './domain';

/** The three expressions each character is drawn in. */
export type ArtMood = 'neutral' | 'happy' | 'tired';

/**
 * Generated character art, when it exists.
 *
 * Metro resolves `require()` at build time, so a path listed here must be a
 * real file or the bundle fails. While `assets/characters/` is empty this map
 * stays empty and every character falls back to the blob drawn in
 * `components/Character.tsx` — the app works either way.
 *
 * To switch a character over to artwork, drop
 * `assets/characters/<id>-<mood>.png` in place and uncomment its entry.
 */
export const CHARACTER_ART: Partial<
  Record<CharacterId, Partial<Record<ArtMood, ImageSourcePropType>>>
> = {
  // sprout: {
  //   neutral: require('../assets/characters/sprout-neutral.png'),
  //   happy: require('../assets/characters/sprout-happy.png'),
  //   tired: require('../assets/characters/sprout-tired.png'),
  // },
};

/** Maps a 1-5 mood score onto the three drawn expressions. */
export const artMoodFor = (mood: number): ArtMood =>
  mood >= 4 ? 'happy' : mood <= 2 ? 'tired' : 'neutral';

/** The right image for this character and mood, or undefined to use the blob. */
export function characterArt(
  id: CharacterId | undefined,
  mood: number,
): ImageSourcePropType | undefined {
  if (!id) return undefined;
  const set = CHARACTER_ART[id];
  if (!set) return undefined;
  // A character part-way through being drawn still shows something sensible.
  return set[artMoodFor(mood)] ?? set.neutral;
}
