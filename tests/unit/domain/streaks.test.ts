import { dayKey, gentleStreak, gentleStreakOn, isDueOn, scheduleLabel } from '../../../src/domain';

/**
 * These tests protect a product rule, not an implementation detail: a streak
 * forgives one missed day, and days a schedule does not ask for are skipped
 * rather than counted against you. See AGENTS.md — do not weaken these to
 * make a change pass.
 */

/** Walks back from a fixed "today" and returns the day key n days earlier. */
const daysAgo = (n: number, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return dayKey(d);
};

// A Thursday, so weekday/weekend behaviour is unambiguous.
const THURSDAY = new Date(2026, 0, 15, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(THURSDAY);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the fixture', () => {
  it('pins today to a Thursday so weekday cases are meaningful', () => {
    expect(new Date().getDay()).toBe(4);
    expect(dayKey()).toBe('2026-01-15');
  });
});

describe('gentleStreak (daily)', () => {
  it('is zero when nothing has been done', () => {
    expect(gentleStreak([])).toBe(0);
  });

  it('counts an unbroken run ending today', () => {
    expect(gentleStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
  });

  it('does not treat a missing today as a break, because the day is not over', () => {
    expect(gentleStreak([daysAgo(1), daysAgo(2), daysAgo(3)])).toBe(3);
  });

  it('forgives a single missed day and keeps counting past it', () => {
    // done today, done yesterday, MISSED, done, done
    const days = [daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)];
    expect(gentleStreak(days)).toBe(4);
  });

  it('stops after two missed days in a row', () => {
    // done today, done yesterday, MISSED, MISSED, done (that last one is lost)
    const days = [daysAgo(0), daysAgo(1), daysAgo(4), daysAgo(5)];
    expect(gentleStreak(days)).toBe(2);
  });

  it('forgives more than one gap, as long as no two gaps are adjacent', () => {
    const days = [daysAgo(0), daysAgo(2), daysAgo(4), daysAgo(6)];
    expect(gentleStreak(days)).toBe(4);
  });

  it('ignores days in the future', () => {
    const tomorrow = dayKey(new Date(2026, 0, 16));
    expect(gentleStreak([tomorrow])).toBe(0);
  });

  it('is unaffected by duplicate entries for the same day', () => {
    expect(gentleStreak([daysAgo(0), daysAgo(0), daysAgo(1)])).toBe(2);
  });
});

describe('isDueOn', () => {
  const monday = new Date(2026, 0, 19);
  const saturday = new Date(2026, 0, 17);

  it('treats daily and an empty schedule as every day', () => {
    expect(isDueOn('daily', saturday)).toBe(true);
    expect(isDueOn('', saturday)).toBe(true);
  });

  it('asks for weekdays only on Monday to Friday', () => {
    expect(isDueOn('weekdays', monday)).toBe(true);
    expect(isDueOn('weekdays', saturday)).toBe(false);
  });

  it('reads a comma-separated list as weekday numbers, Sunday being 0', () => {
    expect(isDueOn('1,3,5', monday)).toBe(true);
    expect(isDueOn('0,6', saturday)).toBe(true);
    expect(isDueOn('0,6', monday)).toBe(false);
  });
});

describe('gentleStreakOn with a schedule', () => {
  it('skips days the schedule does not ask for instead of counting them as misses', () => {
    // Today is Monday. The habit is weekdays-only and was done Thursday and
    // Friday. The weekend in between must not break anything.
    jest.setSystemTime(new Date(2026, 0, 19, 12, 0, 0));
    const days = ['2026-01-16', '2026-01-15']; // Fri, Thu
    expect(gentleStreakOn(days, 'weekdays')).toBe(2);
  });

  it('still forgives exactly one missed scheduled day', () => {
    jest.setSystemTime(new Date(2026, 0, 19, 12, 0, 0));
    // Fri done, Thu MISSED, Wed done, Tue done
    const days = ['2026-01-16', '2026-01-14', '2026-01-13'];
    expect(gentleStreakOn(days, 'weekdays')).toBe(3);
  });

  it('counts nothing for a schedule whose days have never been done', () => {
    expect(gentleStreakOn(['2026-01-14'], '0,6')).toBe(0);
  });
});

describe('scheduleLabel', () => {
  it('names the presets', () => {
    expect(scheduleLabel('daily')).toBe('Every day');
    expect(scheduleLabel('weekdays')).toBe('Weekdays');
  });

  it('renders a custom day list', () => {
    expect(scheduleLabel('2,4')).toBe('Tue / Thu');
  });

  it('falls back to every day rather than showing nothing', () => {
    expect(scheduleLabel('nonsense')).toBe('Every day');
  });
});
