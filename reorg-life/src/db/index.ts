import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_NAME = 'reorglife.dbkey';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_NAME, key);
  }
  return key;
}

const SCHEMA = `
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
PRAGMA user_version = 1;
`;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const key = await getOrCreateKey();
      const db = await SQLite.openDatabaseAsync('reorglife.db');
      await db.execAsync(`PRAGMA key = '${key}';`);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(SCHEMA);
      return db;
    })();
  }
  return dbPromise;
}
