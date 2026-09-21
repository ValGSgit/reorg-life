import { CHARACTER_ART, artMoodFor, characterArt } from '../../src/characterArt';
import { CHARACTERS } from '../../src/domain';

/**
 * These guard two things that break quietly.
 *
 * A path in CHARACTER_ART that does not exist fails the Metro build with a
 * resolution error rather than anything readable, so it is worth catching
 * here instead.
 *
 * The blob fallback is on the critical path: Comet, Moss and Blaze have no
 * art at all, so the blob is what they render. If it breaks, those avatars
 * become a blank space where the companion should be.
 */
describe('CHARACTER_ART', () => {
  it('only registers known characters', () => {
    const known = CHARACTERS.map((c) => c.id) as string[];
    for (const id of Object.keys(CHARACTER_ART)) {
      expect(known).toContain(id);
    }
  });

  it('resolves every registered image', () => {
    for (const [id, set] of Object.entries(CHARACTER_ART)) {
      for (const [mood, source] of Object.entries(set ?? {})) {
        expect([id, mood, source]).toEqual([id, mood, expect.anything()]);
      }
    }
  });

  it('registers all five moods for any character it covers at all', () => {
    for (const [id, set] of Object.entries(CHARACTER_ART)) {
      // The id is in the assertion so a failure names the character.
      expect([id, Object.keys(set ?? {}).sort()]).toEqual([id, ['1', '2', '3', '4', '5']]);
    }
  });
});

describe('artMoodFor', () => {
  it('passes through the valid scale', () => {
    for (const mood of [1, 2, 3, 4, 5]) expect(artMoodFor(mood)).toBe(mood);
  });

  it('clamps out-of-range values rather than asking for a missing image', () => {
    expect(artMoodFor(0)).toBe(1);
    expect(artMoodFor(-99)).toBe(1);
    expect(artMoodFor(9)).toBe(5);
  });

  it('survives nonsense', () => {
    expect(artMoodFor(Number.NaN)).toBe(3);
    expect(artMoodFor(3.4)).toBe(3);
  });
});

describe('characterArt', () => {
  it('returns art for a character that has it', () => {
    expect(characterArt('sprout', 3)).toBeTruthy();
    expect(characterArt('ember', 1)).toBeTruthy();
  });

  it('has art for all three companions the time-of-day rotation needs', () => {
    // ADR 0001: Sprout in the morning, Ember in the afternoon, Dusk at night.
    for (const id of ['sprout', 'ember', 'dusk'] as const) {
      expect([id, characterArt(id, 3)]).toEqual([id, expect.anything()]);
    }
  });

  it('returns nothing for a character with no art, so the blob is used', () => {
    expect(characterArt('comet', 3)).toBeUndefined();
    expect(characterArt('moss', 3)).toBeUndefined();
    expect(characterArt('blaze', 3)).toBeUndefined();
  });

  it('returns nothing when no character is given', () => {
    expect(characterArt(undefined, 3)).toBeUndefined();
  });

  it('gives a different image for a rough day than a good one', () => {
    expect(characterArt('sprout', 1)).not.toEqual(characterArt('sprout', 5));
  });

  it('clamps rather than failing for an out-of-range mood', () => {
    expect(characterArt('sprout', 99)).toEqual(characterArt('sprout', 5));
    expect(characterArt('sprout', -5)).toEqual(characterArt('sprout', 1));
  });
});
