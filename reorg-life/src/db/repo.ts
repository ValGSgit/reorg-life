import { getDb } from './index';
import { XP_PER_CHECKIN, XP_PER_HABIT, XP_PER_TASK, dayKey, gentleStreakOn, isDueOn } from '../domain';

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

// ---------------------------------------------------------------- settings

/** Small per-user preferences that belong with the data, not the keystore. */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}

export async function allSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ------------------------------------------------------------------ habits

export type Habit = {
  id: number;
  title: string;
  domain: string;
  schedule: string;
  remind_at: string | null;
  archived: number;
  created_at: string;
};

/** A habit plus the bits the UI needs: today's state and its gentle streak. */
export type HabitView = Habit & { doneToday: boolean; dueToday: boolean; streak: number };

export async function listHabits(includeArchived = false): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY archived, created_at`,
  );
}

export async function createHabit(
  title: string,
  domain: string,
  schedule = 'daily',
  remindAt: string | null = null,
): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO habits (title, domain, schedule, remind_at, created_at) VALUES (?, ?, ?, ?, ?)',
    title, domain, schedule, remindAt, new Date().toISOString(),
  );
  return r.lastInsertRowId;
}

export async function updateHabit(
  id: number,
  patch: { title?: string; domain?: string; schedule?: string; remind_at?: string | null; archived?: number },
) {
  const db = await getDb();
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (!fields.length) return;
  const sql = `UPDATE habits SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`;
  await db.runAsync(sql, ...fields.map((f) => patch[f] as string | number | null), id);
}

export async function deleteHabit(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ?', id);
  await db.runAsync('DELETE FROM habits WHERE id = ?', id);
}

export async function habitLogDays(habitId: number): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>('SELECT day FROM habit_logs WHERE habit_id = ?', habitId);
  return rows.map((r) => r.day);
}

/**
 * Marks a habit done or not-done for a day. XP is awarded the first time a
 * day is marked and never taken back — unticking is for fixing a mistake, not
 * a punishment.
 */
export async function setHabitDone(habitId: number, done: boolean, day = dayKey()): Promise<void> {
  const db = await getDb();
  if (!done) {
    await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND day = ?', habitId, day);
    return;
  }
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM habit_logs WHERE habit_id = ? AND day = ?', habitId, day,
  );
  if (existing) return;
  await db.runAsync(
    'INSERT INTO habit_logs (habit_id, day, created_at) VALUES (?, ?, ?)',
    habitId, day, new Date().toISOString(),
  );
  await addXp(XP_PER_HABIT);
}

/** Every active habit with its streak and today's state, ready to render. */
export async function habitViews(today = dayKey()): Promise<HabitView[]> {
  const db = await getDb();
  const habits = await listHabits();
  if (!habits.length) return [];
  const logs = await db.getAllAsync<{ habit_id: number; day: string }>('SELECT habit_id, day FROM habit_logs');
  const byHabit = new Map<number, string[]>();
  for (const l of logs) {
    const list = byHabit.get(l.habit_id);
    if (list) list.push(l.day);
    else byHabit.set(l.habit_id, [l.day]);
  }
  const now = new Date();
  return habits.map((h) => {
    const days = byHabit.get(h.id) ?? [];
    return {
      ...h,
      doneToday: days.includes(today),
      dueToday: isDueOn(h.schedule, now),
      streak: gentleStreakOn(days, h.schedule, today),
    };
  });
}

// ------------------------------------------------------- backup / restore

/** Everything the app holds, as plain rows. Used by src/backup.ts. */
export type Snapshot = {
  profile: (Profile & { created_at?: string }) | null;
  checkins: Checkin[];
  events: EventRow[];
  habits: Habit[];
  habit_logs: { habit_id: number; day: string; created_at: string }[];
  settings: Record<string, string>;
};

export async function exportSnapshot(): Promise<Snapshot> {
  const db = await getDb();
  const [profile, checkins, events, habits, habit_logs, settings] = await Promise.all([
    db.getFirstAsync<Profile & { created_at: string }>(
      'SELECT character_id, display_name, xp, created_at FROM profile WHERE id = 1'),
    db.getAllAsync<Checkin>('SELECT id, day, mood, note FROM checkins ORDER BY day'),
    db.getAllAsync<EventRow>('SELECT * FROM events ORDER BY starts_at'),
    db.getAllAsync<Habit>('SELECT * FROM habits ORDER BY created_at'),
    db.getAllAsync<{ habit_id: number; day: string; created_at: string }>(
      'SELECT habit_id, day, created_at FROM habit_logs ORDER BY day'),
    allSettings(),
  ]);
  return { profile, checkins, events, habits, habit_logs, settings };
}

/**
 * Replaces the contents of the database with a snapshot, in one transaction:
 * either the whole restore lands or nothing changes.
 */
export async function importSnapshot(s: Snapshot): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      'DELETE FROM habit_logs; DELETE FROM habits; DELETE FROM events; DELETE FROM checkins; DELETE FROM settings; DELETE FROM profile;',
    );
    if (s.profile) {
      await db.runAsync(
        'INSERT INTO profile (id, character_id, display_name, xp, created_at) VALUES (1, ?, ?, ?, ?)',
        s.profile.character_id, s.profile.display_name, s.profile.xp ?? 0,
        s.profile.created_at ?? new Date().toISOString(),
      );
    }
    for (const c of s.checkins ?? []) {
      await db.runAsync(
        'INSERT OR REPLACE INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)',
        c.day, c.mood, c.note ?? '', new Date().toISOString());
    }
    for (const e of s.events ?? []) {
      await db.runAsync(
        'INSERT INTO events (title, domain, starts_at, source, done) VALUES (?, ?, ?, ?, ?)',
        e.title, e.domain, e.starts_at, e.source ?? 'manual', e.done ? 1 : 0);
    }
    // Habit ids are re-issued, so logs are remapped onto the new ids.
    const idMap = new Map<number, number>();
    for (const h of s.habits ?? []) {
      const r = await db.runAsync(
        'INSERT INTO habits (title, domain, schedule, remind_at, archived, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        h.title, h.domain, h.schedule ?? 'daily', h.remind_at ?? null, h.archived ? 1 : 0,
        h.created_at ?? new Date().toISOString());
      idMap.set(h.id, r.lastInsertRowId);
    }
    for (const l of s.habit_logs ?? []) {
      const mapped = idMap.get(l.habit_id);
      if (mapped === undefined) continue;
      await db.runAsync(
        'INSERT OR IGNORE INTO habit_logs (habit_id, day, created_at) VALUES (?, ?, ?)',
        mapped, l.day, l.created_at ?? new Date().toISOString());
    }
    for (const [k, v] of Object.entries(s.settings ?? {})) {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', k, v);
    }
  });
}
