/**
 * Demo data for the preview harness (T-037).
 *
 * The app is hard to judge from an empty database: no timeline, no streaks,
 * no reward states, and the companion rotation only shows whichever period it
 * happens to be. This fills it with obviously fictional entries so a change
 * can be looked at, and removes them again completely.
 *
 * Two rules hold this together:
 *
 * 1. **It cannot run in a release build.** Every entry point asserts it first.
 *    Demo moods appearing in somebody's real journal would be worse than
 *    having no demo data at all.
 * 2. **Everything it writes says DEMO.** If a wipe is ever missed, what is
 *    left is unmistakable rather than quietly mixed in with real entries.
 */
import { getDb } from './index';
import { XP_PER_CHECKIN, dayKey, periodFor, type PeriodSettings } from '../domain';

/** Thrown instead of writing anything, so a refusal is never silent. */
export class DemoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoDataError';
  }
}

/**
 * True only in a development build.
 *
 * Metro replaces `__DEV__` with a literal at build time, so a production
 * bundle contains `false` here and the seed is unreachable — not merely
 * disabled at runtime.
 */
export const isDevBuild = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__ === true;

function assertDemoAllowed(dev: boolean): void {
  if (!dev) {
    throw new DemoDataError(
      'Demo data is only available in a development build. Refusing to touch a real database.',
    );
  }
}

type DemoOptions = {
  /** Overridden only by tests; defaults to the real build flag. */
  dev?: boolean;
  now?: Date;
  settings?: Partial<PeriodSettings>;
};

/** Local-clock date `days` before `now`, at `hour`:00. */
const at = (now: Date, days: number, hour: number): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/**
 * Check-ins to write, as [days ago, hour, mood, note].
 *
 * The shape is deliberate rather than random: today has all three periods so
 * the rotation is visible, there is a deliberate gap at four days ago so the
 * forgiving streak can be seen working, and the moods vary so the companion
 * expressions differ.
 */
const CHECKINS: [number, number, number, string][] = [
  [0, 9, 4, 'DEMO — a made-up morning. Slept badly, still got up.'],
  [0, 14, 3, 'DEMO — a made-up afternoon. Quiet, which is fine.'],
  [0, 20, 5, 'DEMO — a made-up evening. Good day on balance.'],
  [1, 10, 3, 'DEMO — invented entry. Nothing much happened.'],
  [1, 21, 2, 'DEMO — invented entry. Tired by the evening.'],
  [2, 8, 5, 'DEMO — sample text, not a real note.'],
  [3, 15, 4, 'DEMO — sample text. A steady sort of day.'],
  // Nothing four days ago: one missed day is forgiven, and this is how you
  // can see that it is.
  [5, 11, 2, 'DEMO — placeholder. A harder one; writing it down anyway.'],
  [6, 19, 3, 'DEMO — placeholder entry from last week.'],
];

const EVENTS: [number, number, string, string, number][] = [
  [0, 11, 'DEMO: pretend dentist appointment', 'health', 0],
  [1, 16, 'DEMO: imaginary coffee with a friend', 'social', 1],
  [3, 10, 'DEMO: fictional admin afternoon', 'work', 1],
  [5, 18, 'DEMO: made-up grocery run', 'home', 1],
  [-2, 9, 'DEMO: invented thing happening later this week', 'life', 0],
];

const HABITS: [string, string, string, number[]][] = [
  // [title, domain, schedule, days-ago it was done]
  ['DEMO: stretch for five minutes', 'health', 'daily', [0, 1, 2, 3, 5, 6]],
  ['DEMO: water the pretend plants', 'home', 'daily', [0, 1, 3, 4]],
  ['DEMO: write one made-up sentence', 'growth', 'daily', [1, 2]],
];

/**
 * XP that sits partway between two levels.
 *
 * A number that lands exactly on a boundary shows a full or empty bar, which
 * is the one state that tells you nothing about whether the bar works.
 */
const DEMO_XP = 260;

/** Fills the database with obviously fictional entries. Development builds only. */
export async function seedDemoData({
  dev = isDevBuild(),
  now = new Date(),
  settings = {},
}: DemoOptions = {}) {
  assertDemoAllowed(dev);
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, ?, ?)',
      'sprout',
      'Demo',
      DEMO_XP,
      at(now, 30, 12).toISOString(),
    );

    for (const [days, hour, mood, note] of CHECKINS) {
      const when = at(now, days, hour);
      // INSERT OR REPLACE so a second seed updates rather than colliding with
      // the one-check-in-per-period rule.
      await db.runAsync(
        'INSERT OR REPLACE INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
        dayKey(when),
        mood,
        note,
        when.toISOString(),
        periodFor(when, settings),
      );
    }

    for (const [days, hour, title, domain, done] of EVENTS) {
      const when = at(now, days, hour);
      await db.runAsync(
        'INSERT INTO events (title, domain, starts_at, source, done, period) VALUES (?, ?, ?, ?, ?, ?)',
        title,
        domain,
        when.toISOString(),
        'demo',
        done,
        periodFor(when, settings),
      );
    }

    for (const [title, domain, schedule, doneDays] of HABITS) {
      const result = await db.runAsync(
        'INSERT INTO habits (title, domain, schedule, remind_at, archived, created_at) VALUES (?, ?, ?, ?, 0, ?)',
        title,
        domain,
        schedule,
        null,
        at(now, 30, 9).toISOString(),
      );
      for (const days of doneDays) {
        const when = at(now, days, 9);
        await db.runAsync(
          'INSERT OR IGNORE INTO habit_logs (habit_id, day, created_at) VALUES (?, ?, ?)',
          result.lastInsertRowId,
          dayKey(when),
          when.toISOString(),
        );
      }
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      'demo_seeded_at',
      now.toISOString(),
    );
  });
}

/**
 * Removes everything, demo or not.
 *
 * Deliberately not "delete the rows that look like demo data": a wipe that
 * leaves anything behind is the failure this is meant to prevent, and
 * matching on text would miss whatever the seed writes next. The schema and
 * the migrations are untouched, so the app keeps working and simply starts
 * from onboarding again.
 */
export async function wipeAllData({ dev = isDevBuild() }: Pick<DemoOptions, 'dev'> = {}) {
  assertDemoAllowed(dev);
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    // habit_logs first, so nothing is briefly orphaned mid-transaction.
    await db.execAsync(
      'DELETE FROM habit_logs; DELETE FROM habits; DELETE FROM events; DELETE FROM checkins; DELETE FROM settings; DELETE FROM profile;',
    );
  });
}

/** Roughly how much XP the seeded history represents, for the copy to quote. */
export const DEMO_SUMMARY = `${CHECKINS.length} check-ins over a week, ${HABITS.length} habits and ${EVENTS.length} timeline entries — all fictional. Worth about ${CHECKINS.length * XP_PER_CHECKIN} XP if you had earned it.`;
