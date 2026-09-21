/**
 * Reading the timeline as Day → Morning / Afternoon / Night (T-022, ADR 0001).
 *
 * This is the part of the timeline worth testing, so it lives here rather than
 * in the screen: entries in, a grouped and filtered structure out. Search uses
 * the same path, which is why filtering and grouping are one module.
 *
 * Three rules shape everything below:
 *
 * 1. **The timestamp is authoritative.** T-021 stores a `period` on every row,
 *    but only as a derived convenience — move the boundaries and it is
 *    recomputed. A row that has no period (written before the migration, or
 *    skipped by the backfill because its timestamp was unreadable) is still
 *    placed, from the timestamp it does carry.
 * 2. **The local clock decides the day.** `dayKey` reads local calendar
 *    fields on purpose; going through UTC would move an entry made late in the
 *    evening onto tomorrow. See src/domain/time.ts.
 * 3. **An empty period is not rendered.** A period nobody wrote in is
 *    information, not a gap to be filled, and the timeline says nothing about
 *    it at all rather than showing a blank section.
 *
 * Pure logic: no React, no Expo, no database. See src/domain/README.md.
 */
import type { CharacterId } from './characters';
import {
  PERIODS,
  companionForPeriod,
  periodFor,
  periodLabel,
  type PeriodId,
  type PeriodSettings,
} from './companion';
import { dayKey } from './time';

/**
 * The least an entry has to carry to be placed on the timeline.
 *
 * Deliberately structural rather than a union of `Checkin` and `EventRow`:
 * `domain` knows nothing about the database, and the screen maps its rows onto
 * this shape on the way in.
 */
export type TimelineEntry = {
  /** A timestamp, or a bare `YYYY-MM-DD` day key. Authoritative. */
  when: string;
  /** The period stored by T-021, when the row has one. */
  period?: PeriodId | null;
  /** The life area, for the life-area filter. */
  domain?: string | null;
  /** What a search matches against. */
  text?: string | null;
};

export type PeriodSection<T> = {
  period: PeriodId;
  label: string;
  companion: CharacterId;
  /** Names the period, so the section is never conveyed by colour alone. */
  accessibilityLabel: string;
  entries: T[];
};

export type DaySection<T> = {
  /** `YYYY-MM-DD`, local. */
  day: string;
  label: string;
  accessibilityLabel: string;
  /** Only the periods that actually hold something, in day order. */
  periods: PeriodSection<T>[];
};

/**
 * An empty list means "all of them", so clearing a filter and never setting
 * one are the same state. That is what makes "clear filters" a single reset
 * rather than a list of things to remember to re-tick.
 */
export type TimelineFilters = {
  periods: readonly PeriodId[];
  domains: readonly string[];
  search: string;
};

export type GroupOptions = {
  /** Period boundaries, for entries whose period has to be derived. */
  settings?: Partial<PeriodSettings>;
  /** Which day counts as today, for the day headings. Defaults to now. */
  today?: string;
};

export const NO_FILTERS: TimelineFilters = { periods: [], domains: [], search: '' };

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PERIOD_IDS = new Set<string>(PERIODS.map((p) => p.id));

/**
 * A local `Date` for whatever the row stored, or null if it cannot be read.
 *
 * A bare `YYYY-MM-DD` is built field by field rather than handed to
 * `new Date()`, which would read it as UTC midnight and land on the day before
 * for anyone west of Greenwich. Rolled-over nonsense like `2026-13-45` is
 * rejected rather than quietly becoming a date in the following year.
 */
const localDateOf = (when: string): Date | null => {
  const parts = DAY_ONLY.exec(when);
  if (parts) {
    const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
    const date = new Date(year, month - 1, day);
    const rolled = date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day;
    return rolled ? null : date;
  }
  const date = new Date(when);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The period an entry belongs to: the stored one if it has a usable one,
 * otherwise derived from its timestamp. Null only when neither is readable,
 * which means the row cannot be placed at all.
 */
const resolvePeriod = (entry: TimelineEntry, settings: Partial<PeriodSettings>): PeriodId | null => {
  if (entry.period && PERIOD_IDS.has(entry.period)) return entry.period;
  const at = localDateOf(entry.when);
  return at ? periodFor(at, settings) : null;
};

/** Add a value or take it away, without disturbing the list handed in. */
export const toggleFilter = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/**
 * A day heading. Today and yesterday are named rather than dated, because
 * that is how someone reading their own week thinks about them.
 *
 * Anything unreadable is handed straight back: a heading that says what was
 * stored is better than one that invents a plausible date.
 */
export const dayLabel = (day: string, today: string = dayKey()): string => {
  const date = DAY_ONLY.test(day) ? localDateOf(day) : null;
  if (!date) return day;
  if (day === today) return 'Today';

  const reference = localDateOf(today);
  if (reference) {
    const before = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 1);
    if (day === dayKey(before)) return 'Yesterday';
  }

  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Narrow a list of entries to the active view. Every filter is an `and`, and
 * an empty one is not a filter at all, so `NO_FILTERS` returns the lot.
 *
 * Exported separately from the grouping because search runs through here too.
 */
export const filterEntries = <T extends TimelineEntry>(
  entries: readonly T[],
  filters: Partial<TimelineFilters> = {},
  options: GroupOptions = {},
): T[] => {
  const periods = filters.periods ?? [];
  const domains = filters.domains ?? [];
  const search = (filters.search ?? '').trim().toLowerCase();
  const settings = options.settings ?? {};

  return entries.filter((entry) => {
    if (domains.length > 0 && !domains.includes(entry.domain ?? '')) return false;
    if (search.length > 0 && !(entry.text ?? '').toLowerCase().includes(search)) return false;
    if (periods.length > 0) {
      const period = resolvePeriod(entry, settings);
      if (!period || !periods.includes(period)) return false;
    }
    return true;
  });
};

/**
 * The timeline, grouped and filtered.
 *
 * Days run newest first, because that is what someone opening the screen wants
 * to see; within a day the periods run Morning → Afternoon → Night and the
 * entries inside each run earliest first, so a day reads in the order it was
 * lived. Entries recorded at the same moment keep the order they arrived in.
 *
 * An entry whose `when` cannot be read at all is left out: there is no day to
 * put it on. It is dropped rather than thrown on, because a corrupt row should
 * not take the whole screen down with it.
 */
export const groupByDayAndPeriod = <T extends TimelineEntry>(
  entries: readonly T[],
  filters: Partial<TimelineFilters> = {},
  options: GroupOptions = {},
): DaySection<T>[] => {
  const settings = options.settings ?? {};
  const today = options.today ?? dayKey();

  type Placed = { entry: T; day: string; period: PeriodId; at: number; arrived: number };
  const placed: Placed[] = [];

  filterEntries(entries, filters, options).forEach((entry, arrived) => {
    const at = localDateOf(entry.when);
    if (!at) return;
    const period = resolvePeriod(entry, settings);
    if (!period) return;
    placed.push({ entry, day: dayKey(at), period, at: at.getTime(), arrived });
  });

  const byDay = new Map<string, Placed[]>();
  for (const row of placed) {
    const existing = byDay.get(row.day);
    if (existing) existing.push(row);
    else byDay.set(row.day, [row]);
  }

  return [...byDay.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((day) => {
      const rows = byDay.get(day) as Placed[];
      const label = dayLabel(day, today);

      const periods = PERIODS.map((period) => period.id)
        .map((id) => ({
          id,
          rows: rows.filter((row) => row.period === id).sort((a, b) => a.at - b.at || a.arrived - b.arrived),
        }))
        .filter((section) => section.rows.length > 0)
        .map(({ id, rows: inPeriod }) => ({
          period: id,
          label: periodLabel(id),
          companion: companionForPeriod(id),
          accessibilityLabel: `${periodLabel(id)}, ${inPeriod.length} ${
            inPeriod.length === 1 ? 'entry' : 'entries'
          }`,
          entries: inPeriod.map((row) => row.entry),
        }));

      return { day, label, accessibilityLabel: label, periods };
    });
};
