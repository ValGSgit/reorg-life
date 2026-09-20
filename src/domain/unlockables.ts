/**
 * Small things your companion can wear, earned by levelling up.
 *
 * These are gifts, never chores: nothing is ever taken away once unlocked,
 * nothing expires, and leaving the slot empty is a perfectly good choice.
 */
export type Unlockable = {
  id: string;
  name: string;
  /** The level at which this appears. */
  level: number;
  /** Drawn by components/Character.tsx. */
  kind: 'none' | 'sprig' | 'scarf' | 'hat' | 'halo' | 'stars';
  color: string;
  note: string;
};

export const NO_ITEM: Unlockable = {
  id: 'none',
  name: 'Just as they are',
  level: 1,
  kind: 'none',
  color: 'transparent',
  note: 'No accessory. Always available.',
};

export const UNLOCKABLES: Unlockable[] = [
  NO_ITEM,
  {
    id: 'sprig',
    name: 'Little sprig',
    level: 2,
    kind: 'sprig',
    color: '#7DB88B',
    note: 'For showing up twice.',
  },
  {
    id: 'scarf',
    name: 'Soft scarf',
    level: 3,
    kind: 'scarf',
    color: '#E28FA4',
    note: 'For the colder days.',
  },
  { id: 'hat', name: 'Round hat', level: 5, kind: 'hat', color: '#6C8EBF', note: 'Worn at a slight angle.' },
  {
    id: 'halo',
    name: 'Quiet glow',
    level: 7,
    kind: 'halo',
    color: '#E0A85F',
    note: 'You have been kind to yourself.',
  },
  {
    id: 'stars',
    name: 'Small stars',
    level: 10,
    kind: 'stars',
    color: '#C4A8E0',
    note: 'For the long haul.',
  },
];

export const unlockedFor = (level: number): Unlockable[] => UNLOCKABLES.filter((u) => u.level <= level);

export const lockedFor = (level: number): Unlockable[] => UNLOCKABLES.filter((u) => u.level > level);

/** The next thing to look forward to, if there is one. */
export const nextUnlock = (level: number): Unlockable | undefined =>
  UNLOCKABLES.filter((u) => u.level > level).sort((a, b) => a.level - b.level)[0];

/** Resolves a stored id, ignoring anything not yet unlocked or no longer known. */
export function equippedItem(id: string | null | undefined, level: number): Unlockable {
  const found = UNLOCKABLES.find((u) => u.id === id);
  if (!found || found.level > level) return NO_ITEM;
  return found;
}

export const EQUIPPED_SETTING = 'equipped_item';
