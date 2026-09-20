/**
 * One schema for every platform. The native database is SQLCipher-encrypted
 * and the web one is not, but their tables are identical so `repo.ts` stays a
 * single implementation.
 */
export const LATEST_VERSION = 2;

const MIGRATIONS: Record<number, string> = {
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
 * The two methods `migrate` actually calls, neither with bound parameters.
 *
 * Deliberately a hand-written interface rather than
 * `Pick<SQLiteDatabase, ...>`: the real methods are heavily overloaded, so
 * picking them would drag in signatures migrate never uses and would stop a
 * simple test double from satisfying the type. Narrow dependencies are easier
 * to test, which is the whole reason this takes its database as an argument.
 */
export type Migratable = {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
};

/** Applies any migrations the database has not seen yet. Safe to call on every launch. */
export async function migrate(db: Migratable): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current + 1; v <= LATEST_VERSION; v++) {
    const sql = MIGRATIONS[v];
    if (!sql) continue;
    await db.execAsync(sql);
    // PRAGMA does not accept bound parameters; v is a loop counter, not input.
    await db.execAsync(`PRAGMA user_version = ${v};`);
  }
}
