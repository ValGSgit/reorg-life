import {
  DEFAULT_PERIOD_SETTINGS,
  PERIODS,
  companionFor,
  companionForPeriod,
  periodFor,
  periodLabel,
  resolvePeriodSettings,
} from '../../../src/domain';

/**
 * These tests protect the product rule in ADR 0001: the companion follows the
 * *local* clock, and it cross-fades rather than snapping. Every hard case here
 * — the two DST days, the midnight wrap, a night-shift wake time — is cheap to
 * assert and expensive to debug on a device at 05:00. Do not weaken them.
 *
 * The suite runs with `TZ=Europe/Vienna` (set in jest.config.js) because two of
 * these cases only exist in a zone that observes DST.
 */

/** A Date at a local wall-clock time on a given local date. */
const at = (y: number, m: number, d: number, hh: number, mm = 0, ss = 0) => new Date(y, m - 1, d, hh, mm, ss);

/** Blend rounded, because the easing curve's exact float is not the contract. */
const blendAt = (date: Date, settings = {}) => Math.round(companionFor(date, settings).blend * 1000) / 1000;

describe('the fixture', () => {
  it('runs in a DST-observing zone, or the DST cases below prove nothing', () => {
    // Vienna: UTC+1 in winter, UTC+2 in summer. getTimezoneOffset is inverted.
    expect(at(2026, 1, 15, 12).getTimezoneOffset()).toBe(-60);
    expect(at(2026, 7, 15, 12).getTimezoneOffset()).toBe(-120);
  });

  it('maps each period to its companion exactly once', () => {
    expect(PERIODS.map((p) => p.id)).toEqual(['morning', 'afternoon', 'night']);
    expect(PERIODS.map((p) => p.companion)).toEqual(['sprout', 'ember', 'dusk']);
  });
});

describe('periodFor', () => {
  it('returns the right period at the middle of each one', () => {
    expect(periodFor(at(2026, 9, 21, 8, 30))).toBe('morning');
    expect(periodFor(at(2026, 9, 21, 15, 0))).toBe('afternoon');
    expect(periodFor(at(2026, 9, 21, 23, 30))).toBe('night');
  });

  /**
   * The decision, written down because it is the kind of thing that silently
   * flips in a refactor: a boundary belongs to the period it *starts*.
   */
  it('gives each boundary minute to the period that starts there', () => {
    expect(periodFor(at(2026, 9, 21, 5, 0))).toBe('morning');
    expect(periodFor(at(2026, 9, 21, 4, 59, 59))).toBe('night');
    expect(periodFor(at(2026, 9, 21, 12, 0))).toBe('afternoon');
    expect(periodFor(at(2026, 9, 21, 11, 59, 59))).toBe('morning');
    expect(periodFor(at(2026, 9, 21, 18, 0))).toBe('night');
    expect(periodFor(at(2026, 9, 21, 17, 59, 59))).toBe('afternoon');
  });

  it('keeps night whole across midnight', () => {
    expect(periodFor(at(2026, 9, 21, 23, 59))).toBe('night');
    expect(periodFor(at(2026, 9, 22, 0, 1))).toBe('night');
    expect(companionFor(at(2026, 9, 21, 23, 59)).primary).toBe('dusk');
    expect(companionFor(at(2026, 9, 22, 0, 1)).primary).toBe('dusk');
  });

  it('reads the clock when called with no date', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(at(2026, 9, 21, 15, 0));
      expect(periodFor()).toBe('afternoon');
      jest.setSystemTime(at(2026, 9, 21, 8, 0));
      expect(periodFor()).toBe('morning');
      expect(companionFor()).toEqual({ primary: 'sprout', secondary: 'sprout', blend: 0 });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('companionFor outside a transition', () => {
  it('names one companion, with secondary equal to primary and no blend', () => {
    const c = companionFor(at(2026, 9, 21, 8, 30));
    expect(c).toEqual({ primary: 'sprout', secondary: 'sprout', blend: 0 });
  });

  it('is settled at the centre of every period', () => {
    for (const hour of [8, 15, 23]) {
      expect(blendAt(at(2026, 9, 21, hour, 30))).toBe(0);
    }
  });
});

describe('companionFor across a transition', () => {
  // The default window is 30 minutes either side of 12:00, so 11:30 → 12:30.
  it('is 0 at the opening edge and still shows the outgoing companion', () => {
    const c = companionFor(at(2026, 9, 21, 11, 30));
    expect(c.primary).toBe('sprout');
    expect(c.secondary).toBe('ember');
    expect(c.blend).toBe(0);
  });

  it('is half way at the boundary itself', () => {
    expect(blendAt(at(2026, 9, 21, 12, 0))).toBe(0.5);
  });

  it('is 1 at the closing edge, fully showing the incoming companion', () => {
    const c = companionFor(at(2026, 9, 21, 12, 30));
    expect(c.primary).toBe('sprout');
    expect(c.secondary).toBe('ember');
    expect(c.blend).toBe(1);
  });

  it('rises, never falls, across the window', () => {
    const samples = [0, 10, 20, 30, 40, 50, 60].map((m) => blendAt(at(2026, 9, 21, 11, 30 + m)));
    expect(samples[0]).toBe(0);
    expect(samples[samples.length - 1]).toBe(1);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it('puts primary and secondary the right way round on both sides', () => {
    // Before the boundary we are still leaving morning...
    expect(companionFor(at(2026, 9, 21, 11, 45))).toMatchObject({
      primary: 'sprout',
      secondary: 'ember',
    });
    // ...and after it we are still arriving at afternoon. The pair does not
    // flip mid-fade, or the cross-fade would jump at the boundary.
    expect(companionFor(at(2026, 9, 21, 12, 15))).toMatchObject({
      primary: 'sprout',
      secondary: 'ember',
    });
  });

  it('settles again one minute after the window closes', () => {
    expect(companionFor(at(2026, 9, 21, 12, 31))).toEqual({
      primary: 'ember',
      secondary: 'ember',
      blend: 0,
    });
  });

  it('cross-fades around the midnight-spanning boundary too', () => {
    // 18:00 hands over from Ember to Dusk.
    expect(companionFor(at(2026, 9, 21, 18, 0))).toMatchObject({
      primary: 'ember',
      secondary: 'dusk',
      blend: 0.5,
    });
    // 05:00 hands back from Dusk to Sprout.
    expect(companionFor(at(2026, 9, 21, 5, 0))).toMatchObject({
      primary: 'dusk',
      secondary: 'sprout',
      blend: 0.5,
    });
  });

  it('takes a configurable window, still centred on the boundary', () => {
    // Two hours either side of 12:00 means the fade runs 10:00 → 14:00.
    const wide = { transitionMinutes: 120 };
    expect(blendAt(at(2026, 9, 21, 10, 0), wide)).toBe(0);
    expect(blendAt(at(2026, 9, 21, 12, 0), wide)).toBe(0.5);
    expect(blendAt(at(2026, 9, 21, 14, 0), wide)).toBe(1);
    // ...and that 11:00 is only a quarter of the way in, not half.
    expect(blendAt(at(2026, 9, 21, 11, 0), wide)).toBeLessThan(0.5);
  });

  it('switches instantly when the window is zero', () => {
    expect(companionFor(at(2026, 9, 21, 11, 59), { transitionMinutes: 0 })).toEqual({
      primary: 'sprout',
      secondary: 'sprout',
      blend: 0,
    });
    expect(companionFor(at(2026, 9, 21, 12, 0), { transitionMinutes: 0 })).toEqual({
      primary: 'ember',
      secondary: 'ember',
      blend: 0,
    });
  });

  it('clamps a window too wide to fit between two boundaries', () => {
    // Afternoon is six hours; a 10-hour window either side cannot fit. It must
    // be clamped rather than letting two fades overlap and fight.
    const c = companionFor(at(2026, 9, 21, 15, 0), { transitionMinutes: 600 });
    expect(c.blend).toBe(0);
    expect(c.primary).toBe('ember');
  });
});

describe('wake time and bedtime', () => {
  it('starts morning at the wake time when that is later', () => {
    const late = { wake: '09:00' };
    expect(periodFor(at(2026, 9, 21, 7, 0), late)).toBe('night');
    expect(periodFor(at(2026, 9, 21, 9, 0), late)).toBe('morning');
    expect(companionFor(at(2026, 9, 21, 7, 0), late).primary).toBe('dusk');
  });

  it('leaves the boundary alone when the wake time is earlier', () => {
    expect(periodFor(at(2026, 9, 21, 5, 30), { wake: '03:00' })).toBe('morning');
    expect(periodFor(at(2026, 9, 21, 4, 0), { wake: '03:00' })).toBe('night');
  });

  it('keeps night running past midnight for a 02:00 bedtime', () => {
    const owl = { wake: '09:00', bedtime: '02:00' };
    expect(periodFor(at(2026, 9, 21, 23, 0), owl)).toBe('night');
    expect(periodFor(at(2026, 9, 22, 1, 30), owl)).toBe('night');
    expect(periodFor(at(2026, 9, 22, 7, 0), owl)).toBe('night');
    expect(periodFor(at(2026, 9, 22, 9, 30), owl)).toBe('morning');
  });

  it('will not let a wake time swallow the whole morning', () => {
    // 13:00 is past the start of afternoon. Honouring it literally would leave
    // no morning at all, so it is clamped to leave an hour.
    const s = resolvePeriodSettings({ wake: '13:00' });
    expect(s.morningStart).toBe('11:00');
    expect(periodFor(at(2026, 9, 21, 11, 30), { wake: '13:00' })).toBe('morning');
  });
});

describe('a pinned companion', () => {
  it('ignores the clock completely', () => {
    const pinned = { pinnedCompanion: 'dusk' as const };
    for (const hour of [0, 5, 8, 12, 15, 18, 23]) {
      expect(companionFor(at(2026, 9, 21, hour, 0), pinned)).toEqual({
        primary: 'dusk',
        secondary: 'dusk',
        blend: 0,
      });
    }
  });

  it('never blends, even standing exactly on a boundary', () => {
    expect(blendAt(at(2026, 9, 21, 12, 0), { pinnedCompanion: 'sprout' })).toBe(0);
  });

  it('still reports the real period, because notes are filed by clock not choice', () => {
    expect(periodFor(at(2026, 9, 21, 15, 0), { pinnedCompanion: 'dusk' })).toBe('afternoon');
  });

  it('falls back to the rotation when pinned to a companion that does not exist', () => {
    const s = resolvePeriodSettings({ pinnedCompanion: 'nessie' as never });
    expect(s.pinnedCompanion).toBeNull();
    expect(companionFor(at(2026, 9, 21, 15, 0), { pinnedCompanion: 'nessie' as never }).primary).toBe(
      'ember',
    );
  });
});

describe('daylight saving', () => {
  /**
   * The strongest evidence that nothing caches an offset: the same wall-clock
   * time yields the same period on either side of a DST change, even though the
   * two instants are a different distance from UTC.
   */
  it('gives the same period at the same wall-clock time across spring forward', () => {
    const before = at(2026, 3, 28, 12, 30); // CET, UTC+1
    const after = at(2026, 3, 29, 12, 30); // CEST, UTC+2
    expect(before.getTimezoneOffset()).not.toBe(after.getTimezoneOffset());
    expect(periodFor(before)).toBe('afternoon');
    expect(periodFor(after)).toBe('afternoon');
  });

  it('gives the same period at the same wall-clock time across falling back', () => {
    const before = at(2026, 10, 24, 20, 0);
    const after = at(2026, 10, 25, 20, 0);
    expect(before.getTimezoneOffset()).not.toBe(after.getTimezoneOffset());
    expect(periodFor(before)).toBe('night');
    expect(periodFor(after)).toBe('night');
  });

  it('handles the hour that does not exist on the spring-forward day', () => {
    // 2026-03-29 02:30 never happens in Vienna; the clock jumps 02:00 → 03:00.
    const ghost = at(2026, 3, 29, 2, 30);
    expect(ghost.getHours()).toBe(3); // normalised by the platform, not by us
    expect(periodFor(ghost)).toBe('night'); // 03:30 is still night
    expect(periodFor(at(2026, 3, 29, 1, 30))).toBe('night');
    expect(periodFor(at(2026, 3, 29, 5, 30))).toBe('morning');
  });

  it('handles the hour that happens twice on the autumn day', () => {
    // Vienna falls back at 03:00 → 02:00, so 02:30 local happens twice: once at
    // 00:30Z while still CEST, and again at 01:30Z as CET.
    const firstPass = new Date(Date.UTC(2026, 9, 25, 0, 30));
    const secondPass = new Date(Date.UTC(2026, 9, 25, 1, 30));
    expect(firstPass.getHours()).toBe(2);
    expect(secondPass.getHours()).toBe(2);
    expect(firstPass.getTime()).not.toBe(secondPass.getTime());
    expect(periodFor(firstPass)).toBe('night');
    expect(periodFor(secondPass)).toBe('night');
  });
});

describe('nonsense settings fall back rather than throwing', () => {
  it('ignores boundaries that are out of order', () => {
    const s = resolvePeriodSettings({ afternoonStart: '04:00', nightStart: '02:00' });
    expect(s.afternoonStart).toBe(DEFAULT_PERIOD_SETTINGS.afternoonStart);
    expect(s.nightStart).toBe(DEFAULT_PERIOD_SETTINGS.nightStart);
    expect(periodFor(at(2026, 9, 21, 15, 0), { afternoonStart: '04:00' })).toBe('afternoon');
  });

  it('ignores times it cannot parse', () => {
    for (const bad of ['', 'noon', '25:00', '12:75', '12', '-1:00', 'aa:bb']) {
      expect(resolvePeriodSettings({ morningStart: bad }).morningStart).toBe(
        DEFAULT_PERIOD_SETTINGS.morningStart,
      );
    }
  });

  it('ignores an awake span too short to be real', () => {
    // Bedtime half an hour after waking is a typo, not a lifestyle.
    const s = resolvePeriodSettings({ wake: '07:00', bedtime: '07:30' });
    expect(s.wake).toBe(DEFAULT_PERIOD_SETTINGS.wake);
    expect(s.bedtime).toBe(DEFAULT_PERIOD_SETTINGS.bedtime);
  });

  it('ignores an identical wake time and bedtime', () => {
    const s = resolvePeriodSettings({ wake: '08:00', bedtime: '08:00' });
    expect(s.wake).toBe(DEFAULT_PERIOD_SETTINGS.wake);
  });

  it('ignores a negative or absurd transition window', () => {
    expect(resolvePeriodSettings({ transitionMinutes: -5 }).transitionMinutes).toBe(
      DEFAULT_PERIOD_SETTINGS.transitionMinutes,
    );
    expect(resolvePeriodSettings({ transitionMinutes: Number.NaN }).transitionMinutes).toBe(
      DEFAULT_PERIOD_SETTINGS.transitionMinutes,
    );
  });

  it('returns the defaults unchanged when given nothing', () => {
    expect(resolvePeriodSettings()).toEqual(DEFAULT_PERIOD_SETTINGS);
    expect(resolvePeriodSettings({})).toEqual(DEFAULT_PERIOD_SETTINGS);
  });
});

describe('labels', () => {
  it('names each period in plain words', () => {
    expect(periodLabel('morning')).toBe('Morning');
    expect(periodLabel('afternoon')).toBe('Afternoon');
    expect(periodLabel('night')).toBe('Night');
  });

  it('maps a period to its companion', () => {
    expect(companionForPeriod('morning')).toBe('sprout');
    expect(companionForPeriod('afternoon')).toBe('ember');
    expect(companionForPeriod('night')).toBe('dusk');
  });
});
