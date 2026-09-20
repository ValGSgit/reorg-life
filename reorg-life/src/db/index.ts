import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { kvGet, kvSet } from '../kv';
import { migrate } from './schema';

const KEY_NAME = 'reorglife.dbkey';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getOrCreateKey(): Promise<string> {
  let key = await kvGet(KEY_NAME);
  if (!key) {
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await kvSet(KEY_NAME, key);
  }
  return key;
}

/** Native: SQLCipher-encrypted, key held in the OS keystore. See index.web.ts for the preview. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const key = await getOrCreateKey();
      const db = await SQLite.openDatabaseAsync('reorglife.db');
      await db.execAsync(`PRAGMA key = '${key}';`);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

/** The database is encrypted at rest on this platform. */
export const DB_IS_ENCRYPTED = true;
