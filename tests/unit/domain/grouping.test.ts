import {
  NO_FILTERS,
  dayLabel,
  filterEntries,
  groupByDayAndPeriod,
  toggleFilter,
  type TimelineEntry,
} from '../../../src/domain';

/**
 * Grouping is the part of the timeline worth testing, which is why it lives in
 * `domain` and not in the screen (T-022).
 *
 * Timestamps here are written without a zone suffix on purpose: JavaScript
 * reads those as local time, and the whole feature is defined against the
 * local clock. The suite pins TZ to Europe/Vienna (see jest.config.js).
 */

type Row = TimelineEntry & { id: string };

const row = (id: string, when: string, extra: Partial<TimelineEntry> = {}): Row => ({
  id,
  when,
  ...extra,
});

/** Every entry id in the grouped tree, in the order it would be read. */
const idsOf = (days: ReturnType<typeof groupByDayAndPeriod<Row>>) =>
  days.flatMap((d) => d.periods.flatMap((p) => p.entries.map((e) => e.id)));

describe('groupByDayAndPeriod', () => {
  it('groups entries under a day, then a period', () => {
    const days = groupByDayAndPeriod([
      row('a', '2026-09-21T09:00:00', { period: 'morning' }),
      row('b', '2026-09-21T20:00:00', { period: 'night' }),
      row('c', '2026-09-20T14:00:00', { period: 'afternoon' }),
    ]);

    expect(days.map((d) => d.day)).toEqual(['2026-09-21', '2026-09-20']);
    expect(days[0].periods.map((p) => p.period)).toEqual(['morning', 'night']);
    expect(days[1].periods.map((p) => p.period)).toEqual(['afternoon']);
  });

  it('orders periods morning, afternoon, night whatever order they arrive in', () => {
    const days = groupByDayAndPeriod([
      row('n', '2026-09-21T22:00:00', { period: 'night' }),
      row('m', '2026-09-21T07:00:00', { period: 'morning' }),
      row('a', '2026-09-21T13:00:00', { period: 'afternoon' }),
    ]);

    expect(days[0].periods.map((p) => p.period)).toEqual(['morning', 'afternoon', 'night']);
  });

  it('renders one section for a day that only has one period', () => {
    const days = groupByDayAndPeriod([
      row('a', '2026-09-21T09:00:00', { period: 'morning' }),
      row('b', '2026-09-21T10:30:00', { period: 'morning' }),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0].periods).toHaveLength(1);
    expect(days[0].periods[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('never emits a period with no entries in it', () => {
    const days = groupByDayAndPeriod([row('a', '2026-09-21T13:00:00', { period: 'afternoon' })]);

    expect(days[0].periods.every((p) => p.entries.length > 0)).toBe(true);
  });

  it('gives every period section its companion and a label naming the period', () => {
    const days = groupByDayAndPeriod([
      row('m', '2026-09-21T07:00:00', { period: 'morning' }),
      row('a', '2026-09-21T13:00:00', { period: 'afternoon' }),
      row('n', '2026-09-21T22:00:00', { period: 'night' }),
    ]);

    expect(days[0].periods.map((p) => p.companion)).toEqual(['sprout', 'ember', 'dusk']);
    expect(days[0].periods.map((p) => p.label)).toEqual(['Morning', 'Afternoon', 'Night']);
    for (const section of days[0].periods) {
      expect(section.accessibilityLabel).toContain(section.label);
    }
  });

  it('counts entries in the accessible label, singular and plural', () => {
    const days = groupByDayAndPeriod([
      row('m', '2026-09-21T07:00:00', { period: 'morning' }),
      row('a', '2026-09-21T13:00:00', { period: 'afternoon' }),
      row('a2', '2026-09-21T15:00:00', { period: 'afternoon' }),
    ]);

    expect(days[0].periods[0].accessibilityLabel).toBe('Morning, 1 entry');
    expect(days[0].periods[1].accessibilityLabel).toBe('Afternoon, 2 entries');
  });

  it('reads newest day first, and within a day in the order the day was lived', () => {
    const days = groupByDayAndPeriod([
      row('later', '2026-09-21T16:00:00', { period: 'afternoon' }),
      row('earlier', '2026-09-21T13:00:00', { period: 'afternoon' }),
      row('yesterday', '2026-09-20T13:00:00', { period: 'afternoon' }),
    ]);

    expect(idsOf(days)).toEqual(['earlier', 'later', 'yesterday']);
  });

  it('keeps the arrival order of two entries recorded at the same moment', () => {
    const days = groupByDayAndPeriod([
      row('first', '2026-09-21T13:00:00', { period: 'afternoon' }),
      row('second', '2026-09-21T13:00:00', { period: 'afternoon' }),
    ]);

    expect(idsOf(days)).toEqual(['first', 'second']);
  });

  it('derives the period from the timestamp when a row carries none', () => {
    // A row written before the T-021 migration, or one the backfill could not
    // read. The timestamp stays authoritative, so it can always be placed.
    const days = groupByDayAndPeriod([
      row('old', '2026-09-21T09:00:00'),
      row('older', '2026-09-21T20:00:00', { period: null }),
    ]);

    expect(days[0].periods.map((p) => p.period)).toEqual(['morning', 'night']);
  });

  it('still groups a backfilled row by its stored period', () => {
    const days = groupByDayAndPeriod([row('backfilled', '2026-09-21T09:00:00', { period: 'morning' })]);

    expect(days[0].periods[0].period).toBe('morning');
    expect(days[0].periods[0].entries.map((e) => e.id)).toEqual(['backfilled']);
  });

  it('honours the period boundaries in settings when deriving', () => {
    // Someone who wakes at 13:00: 14:00 is still their morning.
    const days = groupByDayAndPeriod([row('late-riser', '2026-09-21T14:00:00')], NO_FILTERS, {
      settings: { morningStart: '13:00', afternoonStart: '17:00', nightStart: '22:00', wake: '13:00' },
    });

    expect(days[0].periods[0].period).toBe('morning');
  });

  it('places a day-only value on that local day rather than shifting it', () => {
    const days = groupByDayAndPeriod([row('checkin', '2026-09-21')]);

    expect(days[0].day).toBe('2026-09-21');
  });

  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 UTC on the 21st is 01:30 on the 22nd in Vienna.
    const days = groupByDayAndPeriod([row('late', '2026-09-21T23:30:00.000Z')]);

    expect(days[0].day).toBe('2026-09-22');
  });

  it('leaves out an entry whose timestamp cannot be read, without throwing', () => {
    const days = groupByDayAndPeriod([
      row('broken', 'not a date'),
      row('fine', '2026-09-21T09:00:00', { period: 'morning' }),
    ]);

    expect(idsOf(days)).toEqual(['fine']);
  });

  it('returns nothing at all for no entries', () => {
    expect(groupByDayAndPeriod([])).toEqual([]);
  });
});

describe('filterEntries', () => {
  const entries = [
    row('m-health', '2026-09-21T09:00:00', { period: 'morning', domain: 'health', text: 'Walk' }),
    row('a-work', '2026-09-21T13:00:00', { period: 'afternoon', domain: 'work', text: 'Wrote the report' }),
    row('n-health', '2026-09-21T22:00:00', { period: 'night', domain: 'health', text: 'Stretch' }),
    row('m-work', '2026-09-20T09:00:00', { period: 'morning', domain: 'work', text: 'Standup' }),
  ];

  it('returns everything when nothing is filtered', () => {
    expect(filterEntries(entries, NO_FILTERS).map((e) => e.id)).toEqual([
      'm-health',
      'a-work',
      'n-health',
      'm-work',
    ]);
  });

  it('narrows to one period', () => {
    expect(filterEntries(entries, { periods: ['morning'] }).map((e) => e.id)).toEqual(['m-health', 'm-work']);
  });

  it('narrows to several periods at once', () => {
    expect(filterEntries(entries, { periods: ['morning', 'night'] }).map((e) => e.id)).toEqual([
      'm-health',
      'n-health',
      'm-work',
    ]);
  });

  it('narrows by life area', () => {
    expect(filterEntries(entries, { domains: ['work'] }).map((e) => e.id)).toEqual(['a-work', 'm-work']);
  });

  it('combines a period filter with a life-area filter, narrowing on both', () => {
    expect(filterEntries(entries, { periods: ['morning'], domains: ['work'] }).map((e) => e.id)).toEqual([
      'm-work',
    ]);
  });

  it('restores everything when the filters are cleared', () => {
    const narrowed = { periods: ['morning' as const], domains: ['work'], search: 'stand' };
    expect(filterEntries(entries, narrowed)).toHaveLength(1);
    expect(filterEntries(entries, NO_FILTERS)).toHaveLength(entries.length);
  });

  it('searches text, ignoring case and surrounding space', () => {
    expect(filterEntries(entries, { search: '  REPORT ' }).map((e) => e.id)).toEqual(['a-work']);
  });

  it('applies the other filters to a search as well', () => {
    // Three entries contain a "t"; only one of them is a night.
    expect(filterEntries(entries, { search: 't', periods: ['night'] }).map((e) => e.id)).toEqual([
      'n-health',
    ]);
  });

  it('matches nothing rather than everything when a search has no hits', () => {
    expect(filterEntries(entries, { search: 'xyzzy' })).toEqual([]);
  });

  it('treats an entry with no text as unsearchable rather than a match', () => {
    expect(filterEntries([row('bare', '2026-09-21T09:00:00')], { search: 'a' })).toEqual([]);
  });

  it('filters by a period the row does not store, derived from its timestamp', () => {
    const old = [row('old', '2026-09-21T09:00:00', { domain: 'health', text: 'Walk' })];
    expect(filterEntries(old, { periods: ['morning'] }).map((e) => e.id)).toEqual(['old']);
    expect(filterEntries(old, { periods: ['night'] })).toEqual([]);
  });

  it('reaches the screen through the grouping as well', () => {
    const days = groupByDayAndPeriod(entries, { periods: ['morning'], domains: ['work'] });
    expect(idsOf(days)).toEqual(['m-work']);
  });
});

describe('toggleFilter', () => {
  it('adds a value that is not there', () => {
    expect(toggleFilter([], 'morning')).toEqual(['morning']);
  });

  it('removes one that is', () => {
    expect(toggleFilter(['morning', 'night'], 'morning')).toEqual(['night']);
  });

  it('does not mutate the list it was given', () => {
    const before = ['morning'];
    toggleFilter(before, 'night');
    expect(before).toEqual(['morning']);
  });
});

describe('dayLabel', () => {
  it('names today and yesterday plainly', () => {
    expect(dayLabel('2026-09-21', '2026-09-21')).toBe('Today');
    expect(dayLabel('2026-09-20', '2026-09-21')).toBe('Yesterday');
  });

  it('spells out any other day', () => {
    expect(dayLabel('2026-09-19', '2026-09-21')).toBe('Saturday, 19 September 2026');
  });

  it('handles a day in another year', () => {
    expect(dayLabel('2025-01-01', '2026-09-21')).toBe('Wednesday, 1 January 2025');
  });

  it('hands back anything it cannot read, rather than inventing a date', () => {
    expect(dayLabel('nonsense', '2026-09-21')).toBe('nonsense');
  });

  it('carries the day label onto the day section', () => {
    const days = groupByDayAndPeriod([row('a', '2026-09-21T09:00:00', { period: 'morning' })], NO_FILTERS, {
      today: '2026-09-21',
    });

    expect(days[0].label).toBe('Today');
    expect(days[0].accessibilityLabel).toBe('Today');
  });
});
