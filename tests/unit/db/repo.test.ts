import { createTestDb, type TestDb } from '../../helpers/testDb';
import { migrate } from '../../../src/db/schema';
import { XP_PER_CHECKIN, XP_PER_HABIT, XP_PER_TASK, dayKey } from '../../../src/domain';

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
  it('awards XP the first time a day is saved, and not again', async () => {
    const first = await repo.saveCheckin(4, 'hello');
    expect(first).toEqual({ firstToday: true });
    expect(await xp()).toBe(XP_PER_CHECKIN);

    const second = await repo.saveCheckin(2, 'changed my mind');
    expect(second).toEqual({ firstToday: false });
    expect(await xp()).toBe(XP_PER_CHECKIN);
  });

  it('updates today rather than adding a second row', async () => {
    await repo.saveCheckin(4, 'first');
    await repo.saveCheckin(1, 'second');

    const all = await repo.recentCheckins();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ mood: 1, note: 'second' });
  });

  it('reports today, and nothing when today is untouched', async () => {
    expect(await repo.getTodayCheckin()).toBeNull();
    await repo.saveCheckin(5, 'good');
    expect(await repo.getTodayCheckin()).toMatchObject({ day: dayKey(), mood: 5 });
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
