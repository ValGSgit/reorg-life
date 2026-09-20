import { LATEST_VERSION, migrate } from '../../../src/db/schema';
import { createTestDb, tableNames, userVersion, type TestDb } from '../../helpers/testDb';

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

  it('allows only one check-in row per day', async () => {
    const insert = () =>
      db.runAsync(
        'INSERT INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)',
        '2026-03-03',
        3,
        '',
        '2026-03-03T09:00:00.000Z',
      );
    await insert();
    await expect(insert()).rejects.toThrow();
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
