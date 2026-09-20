import * as SQLite from 'expo-sqlite';
import { migrate } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Web preview: the same SQLite schema, run by expo-sqlite's wa-sqlite backend
 * and persisted in the browser's origin-private file system. There is no
 * SQLCipher on the web, so this database is NOT encrypted — the app shows a
 * permanent banner saying so. The native path in index.ts is unaffected.
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('reorglife.db');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export const DB_IS_ENCRYPTED = false;
