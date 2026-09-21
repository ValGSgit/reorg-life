import { DEFAULT_PERIOD_SETTINGS, periodFor } from '../domain/companion';

/**
 * One schema for every platform. The native database is SQLCipher-encrypted
 * and the web one is not, but their tables are identical so `repo.ts` stays a
 * single implementation.
 */
export const LATEST_VERSION = 3;

const MIGRATIONS: Record<number, Migration> = {
  1: `
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  character_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL UNIQUE,
  mood INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  done INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at);
`,
  3: addPeriods,
  2: `
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  -- 'daily', 'weekdays', or a comma-separated list of weekdays (0 = Sunday)
  schedule TEXT NOT NULL DEFAULT 'daily',
  -- 'HH:MM' local time, or NULL for no reminder of its own
  remind_at TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (habit_id, day)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id, day);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`,
};

/**
 * The methods `migrate` actually calls.
 *
 * Deliberately a hand-written interface rather than
 * `Pick<SQLiteDatabase, ...>`: the real methods are heavily overloaded, so
 * picking them would drag in signatures migrate never uses and would stop a
 * simple test double from satisfying the type. Narrow dependencies are easier
 * to test, which is the whole reason this takes its database as an argument.
 *
 * `getAllAsync` and `runAsync` are here for migration 3, which backfills each
 * row's period from its timestamp. That has to happen in JavaScript, because
 * the period comes from `periodFor` in the domain layer — reimplementing the
 * boundary arithmetic in SQL would give two answers that could disagree.
 */
export type Migratable = {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
};

/** A migration is either plain SQL or, when it needs the domain layer, a function. */
type Migration = string | ((db: Migratable) => Promise<void>);

const hasColumn = async (db: Migratable, table: string, column: string): Promise<boolean> => {
  // PRAGMA takes no bound parameters; `table` is a literal from this file.
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some((c) => c.name === column);
};

/**
 * Migration 3 — a period on check-ins and events (ADR 0001, T-021).
 *
 * `checkins.day` was UNIQUE, which allowed one check-in a day. The rule is now
 * one per period, up to three. SQLite cannot drop a constraint in place, so
 * the table is rebuilt: create, copy, drop, rename. That happens underneath
 * rows somebody has actually written, so it runs in a transaction — a partial
 * rebuild would leave the database with no `checkins` table at all.
 *
 * Every step is guarded by a check for work already done, so an interruption
 * between the commit and the version bump leaves a database that can still be
 * migrated rather than one that throws on the next launch.
 */
async function addPeriods(db: Migratable): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    if (!(await hasColumn(db, 'events', 'period'))) {
      await db.execAsync('ALTER TABLE events ADD COLUMN period TEXT;');
    }

    if (!(await hasColumn(db, 'checkins', 'period'))) {
      await db.execAsync(`
CREATE TABLE checkins_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  mood INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  period TEXT,
  UNIQUE (day, period)
);
INSERT INTO checkins_v3 (id, day, mood, note, created_at)
  SELECT id, day, mood, note, created_at FROM checkins;
DROP TABLE checkins;
ALTER TABLE checkins_v3 RENAME TO checkins;
CREATE INDEX IF NOT EXISTS idx_checkins_day_period ON checkins(day, period);
`);
    }

    // Backfill from the timestamp each row already carries. The timestamp
    // stays the record of when something happened; the period is derived from
    // it, which is what lets `recomputePeriods` redo this if boundaries move.
    for (const [table, column] of [
      ['checkins', 'created_at'],
      ['events', 'starts_at'],
    ]) {
      const rows = await db.getAllAsync<{ id: number; at: string }>(
        `SELECT id, ${column} AS at FROM ${table} WHERE period IS NULL`,
      );
      for (const row of rows) {
        const when = new Date(row.at);
        // A row with an unreadable timestamp keeps a null period rather than
        // being assigned a wrong one. Nothing downstream requires it.
        if (Number.isNaN(when.getTime())) continue;
        await db.runAsync(
          `UPDATE ${table} SET period = ? WHERE id = ?`,
          periodFor(when, DEFAULT_PERIOD_SETTINGS),
          row.id,
        );
      }
    }

    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

/** Applies any migrations the database has not seen yet. Safe to call on every launch. */
export async function migrate(db: Migratable): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current + 1; v <= LATEST_VERSION; v++) {
    const step: Migration | undefined = MIGRATIONS[v];
    if (!step) continue;
    if (typeof step === 'string') await db.execAsync(step);
    else await step(db);
    // PRAGMA does not accept bound parameters; v is a loop counter, not input.
    await db.execAsync(`PRAGMA user_version = ${v};`);
  }
}
