import { LATEST_VERSION, migrate } from '../../../src/db/schema';
import { columnNames, createTestDb, tableNames, userVersion, type TestDb } from '../../helpers/testDb';

let db: TestDb;

beforeEach(() => {
  db = createTestDb();
});

afterEach(async () => {
  await db.closeAsync();
});

describe('migrate on an empty database', () => {
  it('creates every table and lands on the latest version', async () => {
    expect(await userVersion(db)).toBe(0);
    await migrate(db);

    expect(await userVersion(db)).toBe(LATEST_VERSION);
    expect(await tableNames(db)).toEqual(
      expect.arrayContaining(['checkins', 'events', 'habit_logs', 'habits', 'profile', 'settings']),
    );
  });

  it('is idempotent: running it again changes nothing and throws nothing', async () => {
    await migrate(db);
    const before = await tableNames(db);

    await migrate(db);

    expect(await tableNames(db)).toEqual(before);
    expect(await userVersion(db)).toBe(LATEST_VERSION);
  });
});

describe('migrate on a database that stopped at an earlier version', () => {
  /** Recreates what a v1 install actually looked like on the phone. */
  async function seedV1() {
    await db.execAsync(`
      CREATE TABLE profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        character_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT NOT NULL UNIQUE,
        mood INTEGER NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        starts_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        done INTEGER NOT NULL DEFAULT 0
      );
      PRAGMA user_version = 1;
    `);
    await db.runAsync(
      'INSERT INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, ?, ?)',
      'sprout',
      'Val',
      120,
      '2026-01-01T00:00:00.000Z',
    );
    await db.runAsync(
      'INSERT INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)',
      '2026-01-02',
      4,
      'a good day',
      '2026-01-02T20:00:00.000Z',
    );
  }

  it('upgrades to the latest version without touching existing rows', async () => {
    await seedV1();

    await migrate(db);

    expect(await userVersion(db)).toBe(LATEST_VERSION);

    // The whole point: nobody's data is lost by an upgrade.
    const profile = await db.getFirstAsync<{ display_name: string; xp: number }>(
      'SELECT display_name, xp FROM profile WHERE id = 1',
    );
    expect(profile).toEqual({ display_name: 'Val', xp: 120 });

    const checkin = await db.getFirstAsync<{ day: string; note: string }>('SELECT day, note FROM checkins');
    expect(checkin).toEqual({ day: '2026-01-02', note: 'a good day' });
  });

  it('adds only the tables that were missing', async () => {
    await seedV1();
    expect(await tableNames(db)).not.toContain('habits');

    await migrate(db);

    expect(await tableNames(db)).toEqual(expect.arrayContaining(['habits', 'habit_logs', 'settings']));
  });
});

describe('schema constraints', () => {
  beforeEach(async () => {
    await migrate(db);
  });

  /**
   * This used to assert one check-in per day. ADR 0001 deliberately replaced
   * that rule with one per period, up to three a day, so the constraint moved
   * from `day` to `(day, period)`. The guarantee it protects is unchanged: the
   * same slot cannot be filled twice.
   */
  it('allows only one check-in row per period per day', async () => {
    const insert = (period: string) =>
      db.runAsync(
        'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
        '2026-03-03',
        3,
        '',
        '2026-03-03T09:00:00.000Z',
        period,
      );
    await insert('morning');
    await expect(insert('morning')).rejects.toThrow();
    await expect(insert('afternoon')).resolves.toBeDefined();
  });

  it('allows only one habit log per habit per day', async () => {
    const habit = await db.runAsync(
      'INSERT INTO habits (title, domain, schedule, created_at) VALUES (?, ?, ?, ?)',
      'Walk',
      'health',
      'daily',
      '2026-03-01T00:00:00.000Z',
    );
    const log = () =>
      db.runAsync(
        'INSERT INTO habit_logs (habit_id, day, created_at) VALUES (?, ?, ?)',
        habit.lastInsertRowId,
        '2026-03-03',
        '2026-03-03T09:00:00.000Z',
      );
    await log();
    await expect(log()).rejects.toThrow();
  });

  it('keeps the profile a single row', async () => {
    await db.runAsync(
      'INSERT INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, ?, ?)',
      'sprout',
      'Val',
      0,
      '2026-01-01T00:00:00.000Z',
    );
    await expect(
      db.runAsync(
        'INSERT INTO profile (id, character_id, display_name, xp, created_at) VALUES (2, ?, ?, ?, ?)',
        'ember',
        'Someone else',
        0,
        '2026-01-01T00:00:00.000Z',
      ),
    ).rejects.toThrow();
  });

  it('defaults a new habit to active and unscheduled for reminders', async () => {
    await db.runAsync(
      'INSERT INTO habits (title, domain, created_at) VALUES (?, ?, ?)',
      'Stretch',
      'health',
      '2026-03-01T00:00:00.000Z',
    );
    const row = await db.getFirstAsync<{ schedule: string; archived: number; remind_at: string | null }>(
      'SELECT schedule, archived, remind_at FROM habits',
    );
    expect(row).toEqual({ schedule: 'daily', archived: 0, remind_at: null });
  });
});

describe('migration 3 — a period on check-ins and events', () => {
  /**
   * A v2 database with real rows in it. This is the case that destroys data:
   * `checkins` has to lose its one-row-per-day UNIQUE constraint, and SQLite
   * cannot drop a constraint in place, so the table gets rebuilt underneath
   * rows somebody actually wrote.
   */
  async function seedV2() {
    await db.execAsync(`
      CREATE TABLE profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        character_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT NOT NULL UNIQUE,
        mood INTEGER NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        starts_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        done INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        schedule TEXT NOT NULL DEFAULT 'daily',
        remind_at TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        day TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (habit_id, day)
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      PRAGMA user_version = 2;
    `);
    await db.runAsync(
      'INSERT INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, ?, ?)',
      'sprout',
      'Val',
      250,
      '2026-01-01T00:00:00.000Z',
    );
    // Local Europe/Vienna times: 08:15 morning, 13:40 afternoon, 22:05 night.
    for (const [day, mood, note, at] of [
      ['2026-03-01', 4, 'morning one', '2026-03-01T07:15:00.000Z'],
      ['2026-03-02', 2, 'afternoon one', '2026-03-02T12:40:00.000Z'],
      ['2026-03-03', 5, 'night one', '2026-03-03T21:05:00.000Z'],
    ] as const) {
      await db.runAsync(
        'INSERT INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)',
        day,
        mood,
        note,
        at,
      );
    }
    await db.runAsync(
      'INSERT INTO events (title, domain, starts_at, source, done) VALUES (?, ?, ?, ?, ?)',
      'dentist',
      'health',
      '2026-03-04T12:40:00.000Z',
      'manual',
      0,
    );
  }

  it('reaches version 3 and adds the column to both tables', async () => {
    await seedV2();
    await migrate(db);

    expect(await userVersion(db)).toBe(3);
    expect(await columnNames(db, 'checkins')).toContain('period');
    expect(await columnNames(db, 'events')).toContain('period');
  });

  it('backfills every existing row from its timestamp and loses nothing', async () => {
    await seedV2();

    await migrate(db);

    const checkins = await db.getAllAsync<{ day: string; mood: number; note: string; period: string }>(
      'SELECT day, mood, note, period FROM checkins ORDER BY day',
    );
    expect(checkins).toEqual([
      { day: '2026-03-01', mood: 4, note: 'morning one', period: 'morning' },
      { day: '2026-03-02', mood: 2, note: 'afternoon one', period: 'afternoon' },
      { day: '2026-03-03', mood: 5, note: 'night one', period: 'night' },
    ]);

    const event = await db.getFirstAsync<{ title: string; period: string }>(
      'SELECT title, period FROM events',
    );
    expect(event).toEqual({ title: 'dentist', period: 'afternoon' });

    // The rest of the database is untouched by the table rebuild.
    const profile = await db.getFirstAsync<{ display_name: string; xp: number }>(
      'SELECT display_name, xp FROM profile WHERE id = 1',
    );
    expect(profile).toEqual({ display_name: 'Val', xp: 250 });
  });

  it('leaves no row without a period', async () => {
    await seedV2();
    await migrate(db);

    const nulls = await db.getFirstAsync<{ n: number }>(
      'SELECT (SELECT COUNT(*) FROM checkins WHERE period IS NULL) + (SELECT COUNT(*) FROM events WHERE period IS NULL) AS n',
    );
    expect(nulls).toEqual({ n: 0 });
  });

  it('keeps the raw timestamp, so a period can be recomputed later', async () => {
    await seedV2();
    await migrate(db);

    const row = await db.getFirstAsync<{ created_at: string }>(
      'SELECT created_at FROM checkins WHERE day = ?',
      '2026-03-01',
    );
    expect(row?.created_at).toBe('2026-03-01T07:15:00.000Z');
  });

  it('is still idempotent once it has run', async () => {
    await seedV2();
    await migrate(db);
    const before = await db.getAllAsync('SELECT * FROM checkins ORDER BY day');

    await migrate(db);

    expect(await userVersion(db)).toBe(3);
    expect(await db.getAllAsync('SELECT * FROM checkins ORDER BY day')).toEqual(before);
  });
});

describe('check-in constraints after migration 3', () => {
  beforeEach(async () => {
    await migrate(db);
  });

  const insert = (day: string, period: string) =>
    db.runAsync(
      'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
      day,
      3,
      '',
      `${day}T09:00:00.000Z`,
      period,
    );

  it('allows three check-ins on one day, one per period', async () => {
    await insert('2026-04-01', 'morning');
    await insert('2026-04-01', 'afternoon');
    await insert('2026-04-01', 'night');

    const row = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM checkins WHERE day = ?',
      '2026-04-01',
    );
    expect(row).toEqual({ n: 3 });
  });
});
