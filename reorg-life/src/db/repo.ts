import { getDb } from './index';
import { XP_PER_CHECKIN, XP_PER_TASK, dayKey } from '../domain';

export type Profile = { character_id: string; display_name: string; xp: number };
export type Checkin = { id: number; day: string; mood: number; note: string };
export type EventRow = { id: number; title: string; domain: string; starts_at: string; source: string; done: number };

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  return db.getFirstAsync<Profile>('SELECT character_id, display_name, xp FROM profile WHERE id = 1');
}

export async function createProfile(characterId: string, name: string) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, COALESCE((SELECT xp FROM profile WHERE id = 1), 0), ?)',
    characterId, name, new Date().toISOString(),
  );
}

export async function setCharacter(characterId: string) {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET character_id = ? WHERE id = 1', characterId);
}

async function addXp(amount: number) {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET xp = xp + ? WHERE id = 1', amount);
}

export async function getTodayCheckin(): Promise<Checkin | null> {
  const db = await getDb();
  return db.getFirstAsync<Checkin>('SELECT * FROM checkins WHERE day = ?', dayKey());
}

/** Saves today's check-in; XP is awarded only the first time each day. */
export async function saveCheckin(mood: number, note: string): Promise<{ firstToday: boolean }> {
  const db = await getDb();
  const existing = await getTodayCheckin();
  if (existing) {
    await db.runAsync('UPDATE checkins SET mood = ?, note = ? WHERE id = ?', mood, note, existing.id);
    return { firstToday: false };
  }
  await db.runAsync('INSERT INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)', dayKey(), mood, note, new Date().toISOString());
  await addXp(XP_PER_CHECKIN);
  return { firstToday: true };
}

export async function recentCheckins(limit = 60): Promise<Checkin[]> {
  const db = await getDb();
  return db.getAllAsync<Checkin>('SELECT * FROM checkins ORDER BY day DESC LIMIT ?', limit);
}

export async function checkinDays(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>('SELECT day FROM checkins');
  return rows.map((r) => r.day);
}

export async function addEvent(title: string, domain: string, startsAt: Date) {
  const db = await getDb();
  await db.runAsync('INSERT INTO events (title, domain, starts_at) VALUES (?, ?, ?)', title, domain, startsAt.toISOString());
}

export async function listEvents(): Promise<EventRow[]> {
  const db = await getDb();
  return db.getAllAsync<EventRow>('SELECT * FROM events ORDER BY starts_at DESC LIMIT 200');
}

export async function toggleEventDone(id: number, done: boolean) {
  const db = await getDb();
  await db.runAsync('UPDATE events SET done = ? WHERE id = ?', done ? 1 : 0, id);
  if (done) await addXp(XP_PER_TASK);
}

/** Domain activity over the last 14 days: check-in-free proxy = completed events per domain. */
export async function domainActivity(): Promise<Record<string, number>> {
  const db = await getDb();
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const rows = await db.getAllAsync<{ domain: string; n: number }>(
    'SELECT domain, COUNT(*) AS n FROM events WHERE done = 1 AND starts_at >= ? GROUP BY domain', since);
  return Object.fromEntries(rows.map((r) => [r.domain, r.n]));
}
