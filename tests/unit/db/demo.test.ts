import { createTestDb, type TestDb } from '../../helpers/testDb';
import { migrate } from '../../../src/db/schema';
import { DOMAINS, levelFor, xpForLevel } from '../../../src/domain';

let mockDb: TestDb;
jest.mock('../../../src/db/index', () => ({
  getDb: () => Promise.resolve(mockDb),
  DB_IS_ENCRYPTED: false,
}));

const demo = require('../../../src/db/demo') as typeof import('../../../src/db/demo');

beforeEach(async () => {
  mockDb = createTestDb();
  await migrate(mockDb);
});

afterEach(async () => {
  await mockDb.closeAsync();
});

const count = async (table: string) =>
  (await mockDb.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;

/**
 * Demo data exists so the app can be looked at without typing entries for ten
 * minutes. The two things that matter are that it cannot reach a real install,
 * and that it can be removed completely — demo moods stranded in someone's
 * real timeline would be worse than having no demo data at all.
 */
describe('the guard', () => {
  it('refuses to seed outside a development build', async () => {
    await expect(demo.seedDemoData({ dev: false })).rejects.toThrow(demo.DemoDataError);
  });

  it('writes nothing at all when it refuses', async () => {
    await expect(demo.seedDemoData({ dev: false })).rejects.toThrow();

    expect(await count('checkins')).toBe(0);
    expect(await count('habits')).toBe(0);
    expect(await count('events')).toBe(0);
    expect(await count('profile')).toBe(0);
  });

  it('refuses to wipe outside a development build', async () => {
    await demo.seedDemoData({ dev: true });
    const before = await count('checkins');

    await expect(demo.wipeAllData({ dev: false })).rejects.toThrow(demo.DemoDataError);

    // A refused wipe must not half-delete anything.
    expect(await count('checkins')).toBe(before);
  });

  it('says why, rather than failing silently', async () => {
    await expect(demo.seedDemoData({ dev: false })).rejects.toThrow(/development build/i);
  });
});

describe('seedDemoData', () => {
  const NOW = new Date('2026-05-20T20:00:00');

  it('fills all three periods, so the rotation can be seen', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    const rows = await mockDb.getAllAsync<{ period: string }>('SELECT DISTINCT period FROM checkins');
    expect(rows.map((r) => r.period).sort()).toEqual(['afternoon', 'morning', 'night']);
  });

  it('derives the period from the clock rather than hardcoding it', async () => {
    // Push the boundaries out so that nothing the seed writes is night any
    // more: the latest seeded check-in is 21:00, and night now starts at
    // 22:00. Under the defaults, 20:00 and 21:00 are both night — so if the
    // periods were hardcoded rather than derived, night would still be here.
    await demo.seedDemoData({
      dev: true,
      now: NOW,
      settings: { afternoonStart: '21:00', nightStart: '22:00' },
    });

    const periods = (
      await mockDb.getAllAsync<{ period: string }>('SELECT DISTINCT period FROM checkins')
    ).map((r) => r.period);
    expect(periods).toContain('morning');
    expect(periods).not.toContain('night');
  });

  it('spans several days, so a timeline has something to show', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    const days = await mockDb.getAllAsync<{ day: string }>('SELECT DISTINCT day FROM checkins');
    expect(days.length).toBeGreaterThanOrEqual(4);
  });

  it('creates at least two habits, with a streak already running', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    expect(await count('habits')).toBeGreaterThanOrEqual(2);
    expect(await count('habit_logs')).toBeGreaterThan(0);
  });

  it('leaves XP partway to a level, so the reward states are visible', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    const profile = await mockDb.getFirstAsync<{ xp: number }>('SELECT xp FROM profile WHERE id = 1');
    const xp = profile!.xp;
    const level = levelFor(xp);

    expect(level).toBeGreaterThan(1);
    // Strictly between two level boundaries: a full bar shows nothing useful.
    expect(xp).toBeGreaterThan(xpForLevel(level));
    expect(xp).toBeLessThan(xpForLevel(level + 1));
  });

  it('makes every seeded entry obviously fictional', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    const notes = await mockDb.getAllAsync<{ note: string }>('SELECT note FROM checkins');
    const titles = await mockDb.getAllAsync<{ title: string }>(
      'SELECT title FROM events UNION ALL SELECT title FROM habits',
    );

    // Nothing here should ever be mistakable for something the owner wrote.
    for (const { note } of notes) expect(note).toMatch(/demo/i);
    for (const { title } of titles) expect(title).toMatch(/demo/i);
  });

  it('only uses life areas that actually exist', async () => {
    // A seeded domain that is not in DOMAINS renders without a colour or a
    // label, and cannot be reached by the timeline's life-area filter — so the
    // demo data quietly makes working features look broken.
    await demo.seedDemoData({ dev: true, now: NOW });
    const known = DOMAINS.map((d) => d.id) as string[];

    const rows = await mockDb.getAllAsync<{ domain: string }>(
      'SELECT domain FROM events UNION SELECT domain FROM habits',
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const { domain } of rows) expect(known).toContain(domain);
  });

  it('spreads across every life area, so the filters all have something', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });

    const rows = await mockDb.getAllAsync<{ domain: string }>(
      'SELECT DISTINCT domain FROM events UNION SELECT DISTINCT domain FROM habits',
    );
    expect(new Set(rows.map((r) => r.domain)).size).toBe(DOMAINS.length);
  });

  it('can be run twice without falling over the one-per-period rule', async () => {
    await demo.seedDemoData({ dev: true, now: NOW });
    await expect(demo.seedDemoData({ dev: true, now: NOW })).resolves.not.toThrow();
  });
});

describe('wipeAllData', () => {
  it('empties every table, leaving nothing stranded', async () => {
    await demo.seedDemoData({ dev: true });
    expect(await count('checkins')).toBeGreaterThan(0);

    await demo.wipeAllData({ dev: true });

    for (const table of ['checkins', 'events', 'habits', 'habit_logs', 'settings', 'profile']) {
      expect([table, await count(table)]).toEqual([table, 0]);
    }
  });

  it('leaves no habit log pointing at a habit that is gone', async () => {
    await demo.seedDemoData({ dev: true });
    await demo.wipeAllData({ dev: true });

    const orphans = await mockDb.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM habit_logs WHERE habit_id NOT IN (SELECT id FROM habits)',
    );
    expect(orphans).toEqual({ n: 0 });
  });

  it('is safe to run on an already empty database', async () => {
    await expect(demo.wipeAllData({ dev: true })).resolves.not.toThrow();
    expect(await count('checkins')).toBe(0);
  });

  it('leaves the schema in place, so the app still works afterwards', async () => {
    await demo.seedDemoData({ dev: true });
    await demo.wipeAllData({ dev: true });

    const tables = await mockDb.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(['checkins', 'events', 'habits', 'habit_logs', 'profile', 'settings']),
    );
  });
});
