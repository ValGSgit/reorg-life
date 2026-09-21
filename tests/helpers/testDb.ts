import { DatabaseSync } from 'node:sqlite';

/**
 * A real SQLite database for tests, exposing the slice of expo-sqlite's
 * `SQLiteDatabase` API that `src/db` actually uses.
 *
 * Real SQLite rather than a mock, because the things worth testing here are
 * the SQL and the migrations themselves — constraints, `INSERT OR REPLACE`,
 * transaction rollback. A hand-written fake would happily accept SQL that
 * SQLite rejects, which is exactly the bug class these tests exist to catch.
 *
 * Node 22 ships `node:sqlite`, so this needs no native dependency. It is the
 * same engine underneath expo-sqlite, minus SQLCipher.
 */
export type TestDb = {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
  /** Escape hatch for test setup that predates a migration. */
  raw: DatabaseSync;
};

export function createTestDb(): TestDb {
  const db = new DatabaseSync(':memory:');

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...params) {
      const r = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async withTransactionAsync(fn) {
      db.exec('BEGIN');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    async closeAsync() {
      db.close();
    },
    raw: db,
  };
}

/** Table names currently in the database, excluding SQLite's own. */
export async function tableNames(db: TestDb): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return rows.map((r) => r.name);
}

export async function userVersion(db: TestDb): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Column names on a table, for asserting a migration actually added one. */
export async function columnNames(db: TestDb, table: string): Promise<string[]> {
  // PRAGMA does not take bound parameters; `table` is a literal in tests.
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((r) => r.name);
}
