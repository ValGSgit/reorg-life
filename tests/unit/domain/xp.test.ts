import { XP_PER_CHECKIN, XP_PER_HABIT, XP_PER_TASK, levelFor, xpForLevel } from '../../../src/domain';

describe('levels', () => {
  it('starts everyone at level 1 with no XP', () => {
    expect(levelFor(0)).toBe(1);
  });

  it('never drops below level 1, and never returns NaN, for nonsense input', () => {
    // A restored backup or a hand-edited database could carry these; NaN here
    // would spread silently into the level badge and the progress bar.
    expect(levelFor(-100)).toBe(1);
    expect(levelFor(Number.NaN)).toBe(1);
    expect(levelFor(Number.NEGATIVE_INFINITY)).toBe(1);
  });

  it('is monotonic: more XP never means a lower level', () => {
    let previous = levelFor(0);
    for (let xp = 0; xp <= 5000; xp += 10) {
      const level = levelFor(xp);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('agrees with xpForLevel at every boundary', () => {
    for (let level = 1; level <= 30; level++) {
      const threshold = xpForLevel(level);
      expect(levelFor(threshold)).toBe(level);
      // One XP short of the threshold is still the level below.
      if (level > 1) expect(levelFor(threshold - 1)).toBe(level - 1);
    }
  });

  it('makes each level take longer than the one before it', () => {
    for (let level = 2; level < 20; level++) {
      const thisGap = xpForLevel(level + 1) - xpForLevel(level);
      const previousGap = xpForLevel(level) - xpForLevel(level - 1);
      expect(thisGap).toBeGreaterThan(previousGap);
    }
  });
});

describe('XP awards', () => {
  it('are all positive, because XP is only ever added', () => {
    expect(XP_PER_CHECKIN).toBeGreaterThan(0);
    expect(XP_PER_TASK).toBeGreaterThan(0);
    expect(XP_PER_HABIT).toBeGreaterThan(0);
  });

  it('weights a one-off task above a check-in, and a habit tick below it', () => {
    expect(XP_PER_TASK).toBeGreaterThan(XP_PER_CHECKIN);
    expect(XP_PER_HABIT).toBeLessThan(XP_PER_CHECKIN);
  });
});
