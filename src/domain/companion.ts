/**
 * Which companion is with you, and when.
 *
 * Three periods, three creatures, per [ADR 0001](../../docs/DECISIONS/0001-time-of-day-companions.md):
 * Sprout in the morning, Ember in the afternoon, Dusk at night. Boundaries are
 * configurable so that someone who wakes at 13:00 still gets a morning.
 *
 * Two rules matter more than the arithmetic:
 *
 * 1. **Local clock, read at the moment of use.** Every reading comes from
 *    `Date`'s local getters. Nothing here stores an offset, a zone name or a
 *    UTC timestamp, which is why a DST change or a flight needs no special
 *    case: the app simply asks what time it is now, wherever it now is.
 * 2. **Nonsense falls back, it never throws.** These settings come from a
 *    picker and from a database that may have been written by an older build.
 *    A contradictory value returns the default so the companion keeps working;
 *    an exception here would take the home screen down.
 *
 * Pure logic on purpose: no React, no Expo, no database. See src/domain/README.md.
 */
import { CHARACTERS, type CharacterId } from './characters';

/** The three periods, in the order a day runs through them. */
export const PERIODS = [
  { id: 'morning', label: 'Morning', companion: 'sprout' },
  { id: 'afternoon', label: 'Afternoon', companion: 'ember' },
  { id: 'night', label: 'Night', companion: 'dusk' },
] as const;

export type PeriodId = (typeof PERIODS)[number]['id'];

/**
 * Stored as `HH:MM` strings rather than minute counts: this is what a time
 * picker hands over, what a settings row holds, and what a human can read in a
 * backup file.
 */
export type PeriodSettings = {
  /** When morning begins. Pushed later by `wake` if that is later still. */
  morningStart: string;
  afternoonStart: string;
  nightStart: string;
  /** Night runs until you are awake. */
  wake: string;
  /** Carried for reminder scheduling (T-024); it does not move a boundary. */
  bedtime: string;
  /** Half-width of the cross-fade, in minutes either side of a boundary. */
  transitionMinutes: number;
  /** Set to turn the rotation off and keep one companion all day. */
  pinnedCompanion: CharacterId | null;
};

export const DEFAULT_PERIOD_SETTINGS: PeriodSettings = {
  morningStart: '05:00',
  afternoonStart: '12:00',
  nightStart: '18:00',
  wake: '05:00',
  bedtime: '23:00',
  transitionMinutes: 30,
  pinnedCompanion: null,
};

/**
 * What to draw: `primary` fades out, `secondary` fades in, `blend` says how far
 * along that is. Outside a transition the two are the same companion and
 * `blend` is 0, so a caller that ignores blending still renders correctly.
 */
export type CompanionBlend = {
  primary: CharacterId;
  secondary: CharacterId;
  blend: number;
};

const MINUTES_PER_DAY = 1440;
/** Morning must survive a late wake time by at least this much. */
const MIN_MORNING_MINUTES = 60;
/** An awake span shorter than this is a typo, not a lifestyle. */
const MIN_AWAKE_MINUTES = 4 * 60;

/** `HH:MM` → minutes past local midnight, or null if it is not a real time. */
const parseTime = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const formatTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Minutes past local midnight, seconds included so a fade moves continuously. */
const localMinutes = (date: Date): number =>
  date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

/** Forward distance from `from` to `to` around the 24-hour circle. */
const forward = (from: number, to: number): number =>
  (((to - from) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

/** Shortest signed distance from `b` to `a`, negative meaning "before b". */
const circularDiff = (a: number, b: number): number => {
  const d = forward(b, a);
  return d > MINUTES_PER_DAY / 2 ? d - MINUTES_PER_DAY : d;
};

/** Ease in and out, so the fade has no visible corner at either edge. */
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const withFallback = (value: unknown, fallback: string): number =>
  parseTime(value) ?? (parseTime(fallback) as number);

/**
 * Turn whatever was stored into settings the rest of this module can trust:
 * every time parseable, the boundaries in order, the awake span plausible, the
 * fade window narrow enough that two fades cannot overlap.
 *
 * Exported because the settings screen needs to show the values that will
 * actually be used — including the ones it quietly corrected.
 */
export const resolvePeriodSettings = (settings: Partial<PeriodSettings> = {}): PeriodSettings => {
  const d = DEFAULT_PERIOD_SETTINGS;

  let morning = withFallback(settings.morningStart, d.morningStart);
  let afternoon = withFallback(settings.afternoonStart, d.afternoonStart);
  let night = withFallback(settings.nightStart, d.nightStart);

  // All three live inside one day and must ascend. If they do not, we cannot
  // tell which one the person meant, so all three go back to the defaults.
  if (!(morning < afternoon && afternoon < night)) {
    morning = parseTime(d.morningStart) as number;
    afternoon = parseTime(d.afternoonStart) as number;
    night = parseTime(d.nightStart) as number;
  }

  let wake = withFallback(settings.wake, d.wake);
  let bedtime = withFallback(settings.bedtime, d.bedtime);
  const awake = forward(wake, bedtime);
  if (awake < MIN_AWAKE_MINUTES) {
    wake = parseTime(d.wake) as number;
    bedtime = parseTime(d.bedtime) as number;
  }

  // Night runs until you are awake — but morning has to survive it, so a wake
  // time past the start of afternoon is honoured only as far as it can be.
  morning = Math.min(Math.max(morning, wake), afternoon - MIN_MORNING_MINUTES);

  const transition = settings.transitionMinutes;
  let window =
    typeof transition === 'number' && Number.isFinite(transition) && transition >= 0
      ? transition
      : d.transitionMinutes;

  // A fade may not reach the middle of the shortest period, or two of them
  // would overlap and the pair of companions on screen would be ambiguous.
  const shortestPeriod = Math.min(
    afternoon - morning,
    night - afternoon,
    MINUTES_PER_DAY - (night - morning),
  );
  window = Math.min(window, Math.max(0, Math.ceil(shortestPeriod / 2) - 1));

  const pinned = CHARACTERS.some((c) => c.id === settings.pinnedCompanion)
    ? (settings.pinnedCompanion as CharacterId)
    : null;

  return {
    morningStart: formatTime(morning),
    afternoonStart: formatTime(afternoon),
    nightStart: formatTime(night),
    wake: formatTime(wake),
    bedtime: formatTime(bedtime),
    transitionMinutes: window,
    pinnedCompanion: pinned,
  };
};

/** The boundary minutes, in day order, from resolved settings. */
const boundariesOf = (s: PeriodSettings): [number, number, number] => [
  parseTime(s.morningStart) as number,
  parseTime(s.afternoonStart) as number,
  parseTime(s.nightStart) as number,
];

export const periodLabel = (id: PeriodId): string => PERIODS.find((p) => p.id === id)!.label;

export const companionForPeriod = (id: PeriodId): CharacterId => PERIODS.find((p) => p.id === id)!.companion;

/**
 * Which period a moment falls in. A boundary minute belongs to the period it
 * *starts*: 12:00 is afternoon, 11:59 is still morning.
 *
 * This is the function the database uses to file a note (T-021), so it answers
 * for the clock even when a companion is pinned — what you were doing at 15:00
 * happened in the afternoon whichever creature was on screen.
 */
export const periodFor = (date: Date = new Date(), settings: Partial<PeriodSettings> = {}): PeriodId => {
  const [morning, afternoon, night] = boundariesOf(resolvePeriodSettings(settings));
  const m = localMinutes(date);
  if (m >= morning && m < afternoon) return 'morning';
  if (m >= afternoon && m < night) return 'afternoon';
  return 'night';
};

/**
 * Which companion or pair of companions to draw, and how far between them.
 *
 * Inside a transition window the pair does not swap over at the boundary: the
 * outgoing companion stays `primary` for the whole fade while `blend` climbs
 * 0 → 1. Swapping them at the midpoint would make the cross-fade jump.
 */
export const companionFor = (
  date: Date = new Date(),
  settings: Partial<PeriodSettings> = {},
): CompanionBlend => {
  const resolved = resolvePeriodSettings(settings);

  if (resolved.pinnedCompanion) {
    const only = resolved.pinnedCompanion;
    return { primary: only, secondary: only, blend: 0 };
  }

  const window = resolved.transitionMinutes;
  const m = localMinutes(date);

  if (window > 0) {
    const boundaries = boundariesOf(resolved);
    // Each boundary hands over from the period ending there to the one starting.
    const handovers: { at: number; from: PeriodId; to: PeriodId }[] = [
      { at: boundaries[0], from: 'night', to: 'morning' },
      { at: boundaries[1], from: 'morning', to: 'afternoon' },
      { at: boundaries[2], from: 'afternoon', to: 'night' },
    ];

    for (const handover of handovers) {
      const distance = circularDiff(m, handover.at);
      if (Math.abs(distance) <= window) {
        return {
          primary: companionForPeriod(handover.from),
          secondary: companionForPeriod(handover.to),
          blend: smoothstep((distance + window) / (2 * window)),
        };
      }
    }
  }

  const settled = companionForPeriod(periodFor(date, settings));
  return { primary: settled, secondary: settled, blend: 0 };
};
