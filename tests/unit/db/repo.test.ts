import { createTestDb, type TestDb } from '../../helpers/testDb';
import { migrate } from '../../../src/db/schema';
import {
  XP_PER_CHECKIN,
  XP_PER_HABIT,
  XP_PER_REPEAT_CHECKIN,
  XP_PER_TASK,
  dayKey,
  gentleStreak,
} from '../../../src/domain';

let mockDb: TestDb;
jest.mock('../../../src/db/index', () => ({
  getDb: () => Promise.resolve(mockDb),
  DB_IS_ENCRYPTED: true,
}));

const repo = require('../../../src/db/repo') as typeof import('../../../src/db/repo');

const xp = async () => (await repo.getProfile())!.xp;

beforeEach(async () => {
  mockDb = createTestDb();
  await migrate(mockDb);
  await repo.createProfile('sprout', 'Val');
});

afterEach(async () => {
  await mockDb.closeAsync();
});

describe('profile', () => {
  it('is null before onboarding', async () => {
    await mockDb.execAsync('DELETE FROM profile');
    expect(await repo.getProfile()).toBeNull();
  });

  it('keeps XP when the profile is written again', async () => {
    await repo.saveCheckin(3, '');
    const before = await xp();

    await repo.createProfile('ember', 'Val the second');

    expect(await xp()).toBe(before);
    expect(await repo.getProfile()).toMatchObject({ character_id: 'ember' });
  });

  it('changes companion without disturbing anything else', async () => {
    await repo.saveCheckin(3, '');
    await repo.setCharacter('dusk');

    expect(await repo.getProfile()).toMatchObject({ character_id: 'dusk', display_name: 'Val' });
    expect(await xp()).toBe(XP_PER_CHECKIN);
  });
});

describe('check-ins', () => {
  it('awards XP the first time a day is saved, and not again for an edit', async () => {
    const first = await repo.saveCheckin(4, 'hello');
    expect(first).toMatchObject({ firstToday: true });
    expect(await xp()).toBe(XP_PER_CHECKIN);

    // Same period, so this is an edit rather than a second check-in: no
    // further award, and nothing taken away either.
    const second = await repo.saveCheckin(2, 'changed my mind');
    expect(second).toMatchObject({ firstToday: false });
    expect(await xp()).toBe(XP_PER_CHECKIN);
  });

  it('updates today rather than adding a second row', async () => {
    await repo.saveCheckin(4, 'first');
    await repo.saveCheckin(1, 'second');

    const all = await repo.recentCheckins();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ mood: 1, note: 'second' });
  });

  it('reports the current period, and nothing when it is untouched', async () => {
    expect(await repo.getCurrentCheckin()).toBeNull();
    await repo.saveCheckin(5, 'good');
    expect(await repo.getCurrentCheckin()).toMatchObject({ day: dayKey(), mood: 5 });
  });

  it('lists days for the streak calculation', async () => {
    await repo.saveCheckin(3, '');
    expect(await repo.checkinDays()).toEqual([dayKey()]);
  });

  it('returns recent check-ins newest first, respecting the limit', async () => {
    for (const day of ['2026-01-01', '2026-01-02', '2026-01-03']) {
      await mockDb.runAsync(
        'INSERT INTO checkins (day, mood, note, created_at) VALUES (?, ?, ?, ?)',
        day,
        3,
        '',
        `${day}T12:00:00.000Z`,
      );
    }
    const rows = await repo.recentCheckins(2);
    expect(rows.map((r) => r.day)).toEqual(['2026-01-03', '2026-01-02']);
  });
});

describe('events', () => {
  it('stores an event and lists it back', async () => {
    await repo.addEvent('Dentist', 'health', new Date('2026-04-01T09:00:00.000Z'));

    const events = await repo.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ title: 'Dentist', domain: 'health', done: 0, source: 'manual' });
  });

  it('awards XP when an event is completed, and never removes it when unticked', async () => {
    await repo.addEvent('Dentist', 'health', new Date());
    const [event] = await repo.listEvents();

    await repo.toggleEventDone(event.id, true);
    expect(await xp()).toBe(XP_PER_TASK);

    // Unticking is a correction, not a punishment.
    await repo.toggleEventDone(event.id, false);
    expect(await xp()).toBe(XP_PER_TASK);
    expect((await repo.listEvents())[0].done).toBe(0);
  });

  it('counts completed events per life area over the last fortnight', async () => {
    await repo.addEvent('Walk', 'health', new Date());
    await repo.addEvent('Budget', 'finances', new Date());
    const events = await repo.listEvents();
    await repo.toggleEventDone(events[0].id, true);

    const activity = await repo.domainActivity();
    const doneDomain = events[0].domain;
    expect(activity[doneDomain]).toBe(1);
    expect(Object.values(activity).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('leaves old completed events out of the fortnight window', async () => {
    await mockDb.runAsync(
      'INSERT INTO events (title, domain, starts_at, done) VALUES (?, ?, ?, 1)',
      'Ancient history',
      'work',
      new Date(Date.now() - 60 * 86400000).toISOString(),
    );
    expect(await repo.domainActivity()).toEqual({});
  });
});

describe('habits', () => {
  it('creates a habit with defaults and returns its id', async () => {
    const id = await repo.createHabit('Stretch', 'health');
    expect(id).toBeGreaterThan(0);

    const habits = await repo.listHabits();
    expect(habits[0]).toMatchObject({
      id,
      title: 'Stretch',
      schedule: 'daily',
      remind_at: null,
      archived: 0,
    });
  });

  it('hides archived habits unless asked for them', async () => {
    const id = await repo.createHabit('Stretch', 'health');
    await repo.updateHabit(id, { archived: 1 });

    expect(await repo.listHabits()).toHaveLength(0);
    expect(await repo.listHabits(true)).toHaveLength(1);
  });

  it('updates only the fields it is given', async () => {
    const id = await repo.createHabit('Stretch', 'health', 'daily', '07:00');

    await repo.updateHabit(id, { title: 'Stretch gently' });

    expect((await repo.listHabits())[0]).toMatchObject({
      title: 'Stretch gently',
      remind_at: '07:00',
      schedule: 'daily',
    });
  });

  it('ignores an empty update rather than writing invalid SQL', async () => {
    const id = await repo.createHabit('Stretch', 'health');
    await expect(repo.updateHabit(id, {})).resolves.toBeUndefined();
    expect(await repo.listHabits()).toHaveLength(1);
  });

  it('deletes a habit and its logs together', async () => {
    const id = await repo.createHabit('Stretch', 'health');
    await repo.setHabitDone(id, true);

    await repo.deleteHabit(id);

    expect(await repo.listHabits()).toHaveLength(0);
    expect(await repo.habitLogDays(id)).toEqual([]);
  });

  it('awards XP once per day and never removes it when unticked', async () => {
    const id = await repo.createHabit('Walk', 'health');

    await repo.setHabitDone(id, true);
    expect(await xp()).toBe(XP_PER_HABIT);

    await repo.setHabitDone(id, true); // same day again
    expect(await xp()).toBe(XP_PER_HABIT);

    await repo.setHabitDone(id, false);
    expect(await xp()).toBe(XP_PER_HABIT);
    expect(await repo.habitLogDays(id)).toEqual([]);
  });
});

describe('habitViews', () => {
  it('is empty when there are no habits', async () => {
    expect(await repo.habitViews()).toEqual([]);
  });

  it('reports today, due-today and the streak for each habit', async () => {
    const id = await repo.createHabit('Walk', 'health', 'daily');
    await repo.setHabitDone(id, true);

    const [view] = await repo.habitViews();
    expect(view).toMatchObject({ id, doneToday: true, dueToday: true, streak: 1 });
  });

  it('marks a habit not due today when its schedule does not ask for it', async () => {
    const today = new Date().getDay();
    // A schedule naming only a different weekday.
    const otherDay = (today + 2) % 7;
    const id = await repo.createHabit('Weekly thing', 'work', String(otherDay));

    const view = (await repo.habitViews()).find((v) => v.id === id)!;
    expect(view.dueToday).toBe(false);
  });

  it('keeps each habit log separate', async () => {
    const walk = await repo.createHabit('Walk', 'health');
    const read = await repo.createHabit('Read', 'creativity');
    await repo.setHabitDone(walk, true);

    const views = await repo.habitViews();
    expect(views.find((v) => v.id === walk)!.doneToday).toBe(true);
    expect(views.find((v) => v.id === read)!.doneToday).toBe(false);
  });
});

describe('settings', () => {
  it('returns null for a key that was never set', async () => {
    expect(await repo.getSetting('nope')).toBeNull();
  });

  it('stores and overwrites a value', async () => {
    await repo.setSetting('checkin_reminder', '20:00');
    expect(await repo.getSetting('checkin_reminder')).toBe('20:00');

    await repo.setSetting('checkin_reminder', 'off');
    expect(await repo.getSetting('checkin_reminder')).toBe('off');
  });

  it('reads every setting at once', async () => {
    await repo.setSetting('a', '1');
    await repo.setSetting('b', '2');
    expect(await repo.allSettings()).toEqual({ a: '1', b: '2' });
  });
});

describe('importSnapshot', () => {
  it('rolls back completely when a row in the snapshot is invalid', async () => {
    await repo.saveCheckin(4, 'original');

    const broken = {
      profile: { character_id: 'sprout', display_name: 'Val', xp: 0 },
      checkins: [{ id: 1, day: '2026-01-01', mood: 3, note: '' }],
      // `title` is NOT NULL, so this row must abort the whole restore.
      events: [
        {
          id: 1,
          title: null as unknown as string,
          domain: 'work',
          starts_at: 'x',
          source: 'manual',
          done: 0,
        },
      ],
      habits: [],
      habit_logs: [],
      settings: {},
    };

    await expect(repo.importSnapshot(broken)).rejects.toThrow();

    // The original data must still be there: a failed restore changes nothing.
    const checkins = await repo.recentCheckins();
    expect(checkins).toHaveLength(1);
    expect(checkins[0].note).toBe('original');
  });

  it('tolerates a snapshot with missing collections', async () => {
    await expect(
      repo.importSnapshot({
        profile: null,
        checkins: [],
        events: [],
        habits: [],
        habit_logs: [],
        settings: {},
      }),
    ).resolves.toBeUndefined();
    expect(await repo.getProfile()).toBeNull();
  });

  it('drops habit logs that point at a habit the snapshot does not contain', async () => {
    await repo.importSnapshot({
      profile: null,
      checkins: [],
      events: [],
      habits: [],
      habit_logs: [{ habit_id: 999, day: '2026-01-01', created_at: '2026-01-01T00:00:00.000Z' }],
      settings: {},
    });
    const rows = await mockDb.getAllAsync('SELECT * FROM habit_logs');
    expect(rows).toEqual([]);
  });
});

// ------------------------------------------------- periods on check-ins

/**
 * ADR 0001 changes the check-in rule from one a day to one per period, up to
 * three. The rules that must survive that change: XP is generous once a day
 * and small after, and the streak counts days rather than check-ins — three in
 * a day is not a bigger streak than one, and one missed day is still forgiven.
 */
describe('check-ins by period', () => {
  const at = (iso: string) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(iso));
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  // Local Europe/Vienna, which the Jest config pins.
  const MORNING = '2026-04-01T09:00:00';
  const AFTERNOON = '2026-04-01T14:00:00';
  const NIGHT = '2026-04-01T20:00:00';

  it('keeps three check-ins on one day, one per period', async () => {
    at(MORNING);
    await repo.saveCheckin(3, 'morning');
    at(AFTERNOON);
    await repo.saveCheckin(4, 'afternoon');
    at(NIGHT);
    await repo.saveCheckin(5, 'night');

    const rows = await repo.checkinsOn('2026-04-01');
    expect(rows.map((r) => [r.period, r.note])).toEqual([
      ['morning', 'morning'],
      ['afternoon', 'afternoon'],
      ['night', 'night'],
    ]);
  });

  it('updates rather than inserting when the period is already used', async () => {
    at(MORNING);
    await repo.saveCheckin(3, 'first thought');
    await repo.saveCheckin(5, 'second thought');

    const rows = await repo.checkinsOn('2026-04-01');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ mood: 5, note: 'second thought', period: 'morning' });
  });

  it('awards full XP once a day and a smaller bonus after that', async () => {
    at(MORNING);
    const before = await xp();
    const first = await repo.saveCheckin(3, '');
    const afterFirst = await xp();

    at(AFTERNOON);
    const second = await repo.saveCheckin(4, '');
    const afterSecond = await xp();

    expect(first.firstToday).toBe(true);
    expect(second.firstToday).toBe(false);
    expect(afterFirst - before).toBe(XP_PER_CHECKIN);
    expect(afterSecond - afterFirst).toBe(XP_PER_REPEAT_CHECKIN);
    // Gentle by design: a repeat is still a reward, just a smaller one.
    expect(XP_PER_REPEAT_CHECKIN).toBeGreaterThan(0);
    expect(XP_PER_REPEAT_CHECKIN).toBeLessThan(XP_PER_CHECKIN);
  });

  it('never takes XP away for editing an existing check-in', async () => {
    at(MORNING);
    await repo.saveCheckin(3, '');
    const after = await xp();

    await repo.saveCheckin(1, 'worse than I thought');

    expect(await xp()).toBeGreaterThanOrEqual(after);
  });

  it('counts a day once in the streak however many check-ins it holds', async () => {
    at(MORNING);
    await repo.saveCheckin(3, '');
    const oneCheckin = gentleStreak(await repo.checkinDays());

    at(AFTERNOON);
    await repo.saveCheckin(4, '');
    at(NIGHT);
    await repo.saveCheckin(5, '');

    expect(gentleStreak(await repo.checkinDays())).toBe(oneCheckin);
  });

  it('returns each day once, so nothing downstream can double-count', async () => {
    at(MORNING);
    await repo.saveCheckin(3, '');
    at(AFTERNOON);
    await repo.saveCheckin(4, '');

    const days = await repo.checkinDays();
    expect(days).toEqual([...new Set(days)]);
  });

  it('still forgives exactly one missed day, and stops at two', async () => {
    // gentleStreakOn walks back from the real clock, so the clock is what has
    // to move — passing a `today` only stops today counting as a miss.
    at('2026-04-06T20:00:00');
    // Written directly so the days are unambiguous: the 4th is missed.
    for (const day of ['2026-04-06', '2026-04-05', '2026-04-03', '2026-04-02']) {
      await mockDb.runAsync(
        'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
        day,
        3,
        '',
        day + 'T09:00:00.000Z',
        'morning',
      );
    }
    const days = await repo.checkinDays();

    // One gap (the 4th) is forgiven, so the run reaches back to the 2nd.
    expect(gentleStreak(days)).toBe(4);

    // Two missed days in a row do stop it. Dropping the 3rd leaves the 3rd and
    // 4th both missing, so the run ends at the 5th and the 2nd is not counted
    // however present it is.
    await mockDb.runAsync('DELETE FROM checkins WHERE day = ?', '2026-04-03');
    expect(gentleStreak(await repo.checkinDays())).toBe(2);
  });

  it('finds the check-in for the period being lived in right now', async () => {
    at(MORNING);
    await repo.saveCheckin(3, 'the morning one');

    at(AFTERNOON);
    expect(await repo.getCurrentCheckin()).toBeNull();

    at(MORNING);
    expect(await repo.getCurrentCheckin()).toMatchObject({ note: 'the morning one' });
  });
});

describe('events carry a period too', () => {
  it('stamps a new event with the period its start time falls in', async () => {
    await repo.addEvent('afternoon thing', 'life', new Date('2026-07-01T14:00:00'));

    const row = await mockDb.getFirstAsync<{ period: string }>('SELECT period FROM events');
    expect(row).toEqual({ period: 'afternoon' });
  });

  it('uses the event start, not the moment it was entered', async () => {
    // Something written down at night that happens tomorrow morning belongs
    // to the morning — the period describes the event, not the typing.
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T23:30:00'));
    await repo.addEvent('breakfast', 'life', new Date('2026-07-02T08:00:00'));
    jest.useRealTimers();

    const row = await mockDb.getFirstAsync<{ period: string }>('SELECT period FROM events');
    expect(row).toEqual({ period: 'morning' });
  });
});

describe('recomputePeriods', () => {
  it('moves a row to a different period when the boundaries move', async () => {
    // 13:00 local is afternoon by default.
    await mockDb.runAsync(
      'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
      '2026-05-01',
      3,
      '',
      new Date('2026-05-01T13:00:00').toISOString(),
      'afternoon',
    );

    // Someone who counts the afternoon as starting at 14:00.
    await repo.recomputePeriods({ afternoonStart: '14:00' });

    const row = await mockDb.getFirstAsync<{ period: string }>('SELECT period FROM checkins');
    expect(row).toEqual({ period: 'morning' });
  });

  it('derives from the timestamp, so it can be run again and again', async () => {
    await mockDb.runAsync(
      'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
      '2026-05-02',
      3,
      '',
      new Date('2026-05-02T13:00:00').toISOString(),
      'night',
    );

    await repo.recomputePeriods();
    await repo.recomputePeriods();

    const row = await mockDb.getFirstAsync<{ period: string }>('SELECT period FROM checkins');
    expect(row).toEqual({ period: 'afternoon' });
  });
});

describe('snapshots carry the period', () => {
  it('round trips a v3 snapshot unchanged', async () => {
    await mockDb.runAsync(
      'INSERT INTO checkins (day, mood, note, created_at, period) VALUES (?, ?, ?, ?, ?)',
      '2026-06-01',
      4,
      'kept',
      '2026-06-01T07:00:00.000Z',
      'morning',
    );
    const before = await repo.exportSnapshot();

    await repo.importSnapshot(before);

    const after = await repo.exportSnapshot();
    // Row ids are re-issued by a restore, the same way habit ids are, so the
    // comparison is of what was written rather than where it landed.
    const content = (rows: typeof before.checkins) => rows.map(({ id: _id, ...rest }) => rest);
    expect(content(after.checkins)).toEqual(content(before.checkins));
    expect(after.checkins[0]).toMatchObject({ period: 'morning', created_at: '2026-06-01T07:00:00.000Z' });
  });

  it('restores a backup taken before this migration, deriving the periods', async () => {
    // Exactly what a v2-era export looked like: no period field anywhere.
    const old = {
      profile: {
        character_id: 'sprout',
        display_name: 'Val',
        xp: 40,
        created_at: '2026-01-01T00:00:00.000Z',
      },
      checkins: [
        { id: 1, day: '2026-02-01', mood: 4, note: 'old morning', created_at: '2026-02-01T08:00:00.000Z' },
        { id: 2, day: '2026-02-02', mood: 2, note: 'old night', created_at: '2026-02-02T21:00:00.000Z' },
      ],
      events: [
        {
          id: 1,
          title: 'old event',
          domain: 'life',
          starts_at: '2026-02-03T13:00:00.000Z',
          source: 'manual',
          done: 0,
        },
      ],
      habits: [],
      habit_logs: [],
      settings: {},
    };

    await expect(repo.importSnapshot(old as never)).resolves.not.toThrow();

    const rows = await mockDb.getAllAsync<{ note: string; period: string }>(
      'SELECT note, period FROM checkins ORDER BY day',
    );
    expect(rows).toEqual([
      { note: 'old morning', period: 'morning' },
      { note: 'old night', period: 'night' },
    ]);

    const event = await mockDb.getFirstAsync<{ period: string }>('SELECT period FROM events');
    expect(event).toEqual({ period: 'afternoon' });
  });
});
