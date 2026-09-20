import { NO_ITEM, UNLOCKABLES, equippedItem, lockedFor, nextUnlock, unlockedFor } from '../../../src/domain';

describe('the catalogue', () => {
  it('has unique ids', () => {
    const ids = UNLOCKABLES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('always offers the empty slot from level 1, so wearing nothing is a real choice', () => {
    expect(unlockedFor(1)).toContainEqual(NO_ITEM);
  });
});

describe('unlockedFor / lockedFor', () => {
  it('splits the catalogue with nothing lost or double-counted', () => {
    for (const level of [1, 2, 3, 5, 7, 10, 99]) {
      expect(unlockedFor(level).length + lockedFor(level).length).toBe(UNLOCKABLES.length);
    }
  });

  it('only ever grows as the level rises, because nothing is taken away', () => {
    let previous = unlockedFor(1).length;
    for (let level = 1; level <= 30; level++) {
      const count = unlockedFor(level).length;
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it('unlocks everything eventually', () => {
    const highest = Math.max(...UNLOCKABLES.map((u) => u.level));
    expect(unlockedFor(highest)).toHaveLength(UNLOCKABLES.length);
    expect(lockedFor(highest)).toHaveLength(0);
  });
});

describe('nextUnlock', () => {
  it('points at the nearest item above the current level', () => {
    const next = nextUnlock(1);
    expect(next).toBeDefined();
    expect(next!.level).toBeGreaterThan(1);
    // Nothing locked sits between the current level and the one named.
    for (const item of lockedFor(1)) {
      expect(item.level).toBeGreaterThanOrEqual(next!.level);
    }
  });

  it('is undefined once there is nothing left to earn', () => {
    const highest = Math.max(...UNLOCKABLES.map((u) => u.level));
    expect(nextUnlock(highest)).toBeUndefined();
  });
});

describe('equippedItem', () => {
  const locked = UNLOCKABLES.find((u) => u.level > 1)!;

  it('returns the item when it is unlocked', () => {
    expect(equippedItem(locked.id, locked.level)).toEqual(locked);
  });

  it('falls back to the empty slot for an item the level has not reached', () => {
    expect(equippedItem(locked.id, locked.level - 1)).toEqual(NO_ITEM);
  });

  it('falls back for an unknown id rather than throwing', () => {
    expect(equippedItem('no-such-item', 99)).toEqual(NO_ITEM);
  });

  it('treats null and undefined as nothing equipped', () => {
    expect(equippedItem(null, 99)).toEqual(NO_ITEM);
    expect(equippedItem(undefined, 99)).toEqual(NO_ITEM);
  });
});
