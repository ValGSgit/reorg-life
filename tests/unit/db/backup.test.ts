import { createTestDb, type TestDb } from '../../helpers/testDb';
import { migrate } from '../../../src/db/schema';

// Real AES-GCM via Node's WebCrypto; see the helper for why this is not a stub.
jest.mock('expo-crypto', () => require('../../helpers/expoCryptoMock'));

// Jest hoists jest.mock above the imports, so the factory may only close over
// names beginning with `mock`.
let mockDb: TestDb;

// `src/db/index` reaches for expo-sqlite and the OS keystore, neither of which
// exists here. The repository underneath is the real thing.
jest.mock('../../../src/db/index', () => ({
  getDb: () => Promise.resolve(mockDb),
  DB_IS_ENCRYPTED: true,
}));

// Imported after the mocks so they take effect.
const { createBackup, restoreBackup, describeSnapshot, BackupError, BACKUP_FORMAT } =
  require('../../../src/backup') as typeof import('../../../src/backup');
const repo = require('../../../src/db/repo') as typeof import('../../../src/db/repo');

async function seed() {
  await repo.createProfile('sprout', 'Val');
  await repo.saveCheckin(4, 'steady day');
  await repo.addEvent('Call a friend', 'relationships', new Date('2026-02-02T10:00:00.000Z'));
  const habitId = await repo.createHabit('Walk', 'health', 'weekdays', '08:30');
  await repo.setHabitDone(habitId, true, '2026-02-02');
  await repo.setSetting('checkin_reminder', '20:00');
  return habitId;
}

beforeEach(async () => {
  mockDb = createTestDb();
  await migrate(mockDb);
});

afterEach(async () => {
  await mockDb.closeAsync();
});

describe('createBackup', () => {
  it('produces a payload plus a recovery key, and neither contains readable data', async () => {
    await seed();

    const { payload, recoveryKey, filename } = await createBackup();

    expect(payload.length).toBeGreaterThan(0);
    expect(recoveryKey.length).toBeGreaterThan(0);
    expect(filename).toMatch(/^reorglife-\d{4}-\d{2}-\d{2}\.backup$/);

    // The whole promise of the feature: the file on its own says nothing.
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    expect(decoded).not.toContain('Val');
    expect(decoded).not.toContain('steady day');
    expect(decoded).not.toContain(BACKUP_FORMAT);
  });

  it('uses a fresh key every time, so one leaked key cannot open another backup', async () => {
    await seed();

    const first = await createBackup();
    const second = await createBackup();

    expect(first.recoveryKey).not.toEqual(second.recoveryKey);
    await expect(restoreBackup(second.payload, first.recoveryKey)).rejects.toThrow(BackupError);
  });
});

describe('restoreBackup round trip', () => {
  it('brings back exactly what was exported', async () => {
    await seed();
    const { payload, recoveryKey } = await createBackup();

    // Wipe and change everything, the way a new device would look.
    await repo.importSnapshot({
      profile: null,
      checkins: [],
      events: [],
      habits: [],
      habit_logs: [],
      settings: {},
    });
    expect(await repo.getProfile()).toBeNull();

    const restored = await restoreBackup(payload, recoveryKey);

    expect(describeSnapshot(restored)).toBe('1 check-in, 1 timeline entry, 1 habit');
    const profile = await repo.getProfile();
    expect(profile).toMatchObject({ display_name: 'Val', character_id: 'sprout' });

    const habits = await repo.listHabits();
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({ title: 'Walk', schedule: 'weekdays', remind_at: '08:30' });

    // Habit ids are re-issued on import; the logs must follow them.
    const logs = await repo.habitLogDays(habits[0].id);
    expect(logs).toEqual(['2026-02-02']);

    expect(await repo.getSetting('checkin_reminder')).toBe('20:00');
  });

  it('does not duplicate rows when restoring over existing data', async () => {
    await seed();
    const { payload, recoveryKey } = await createBackup();

    await restoreBackup(payload, recoveryKey);
    await restoreBackup(payload, recoveryKey);

    expect(await repo.listHabits()).toHaveLength(1);
    expect(await repo.recentCheckins()).toHaveLength(1);
  });
});

describe('restoreBackup rejects what it should', () => {
  it('refuses a wrong recovery key without touching the database', async () => {
    await seed();
    const { payload } = await createBackup();
    const other = await createBackup();

    await expect(restoreBackup(payload, other.recoveryKey)).rejects.toThrow(BackupError);

    // Still intact.
    expect(await repo.getProfile()).toMatchObject({ display_name: 'Val' });
    expect(await repo.listHabits()).toHaveLength(1);
  });

  it('refuses a key that is not a key at all, with a message about its shape', async () => {
    await seed();
    const { payload } = await createBackup();

    await expect(restoreBackup(payload, 'obviously-not-a-key')).rejects.toThrow(/shape/i);
  });

  it('refuses a tampered payload, because GCM authenticates the ciphertext', async () => {
    await seed();
    const { payload, recoveryKey } = await createBackup();

    const bytes = Buffer.from(payload, 'base64');
    bytes[bytes.length - 5] ^= 0xff; // flip a bit inside the tag
    const tampered = bytes.toString('base64');

    await expect(restoreBackup(tampered, recoveryKey)).rejects.toThrow(BackupError);
  });

  it('refuses an empty file and a missing key with their own messages', async () => {
    await expect(restoreBackup('', 'whatever')).rejects.toThrow(/empty/i);
    await expect(restoreBackup('something', '')).rejects.toThrow(/recovery key is needed/i);
  });

  it('refuses a validly encrypted file that is not a ReorgLife backup', async () => {
    const { AESEncryptionKey, aesEncryptAsync } =
      require('../../helpers/expoCryptoMock') as typeof import('../../helpers/expoCryptoMock');
    const key = await AESEncryptionKey.generate();
    const sealed = await aesEncryptAsync(Buffer.from(JSON.stringify({ hello: 'world' }), 'utf8'), key);

    await expect(
      restoreBackup((await sealed.combined('base64')) as string, await key.encoded('base64')),
    ).rejects.toThrow(/not a ReorgLife backup/i);
  });

  it('refuses a backup from a newer version of the app rather than guessing', async () => {
    const { AESEncryptionKey, aesEncryptAsync } =
      require('../../helpers/expoCryptoMock') as typeof import('../../helpers/expoCryptoMock');
    const key = await AESEncryptionKey.generate();
    const bundle = { format: BACKUP_FORMAT, version: 999, exportedAt: 'x', data: {} };
    const sealed = await aesEncryptAsync(Buffer.from(JSON.stringify(bundle), 'utf8'), key);

    await expect(
      restoreBackup((await sealed.combined('base64')) as string, await key.encoded('base64')),
    ).rejects.toThrow(/newer version/i);
  });
});

describe('unicode survives the round trip', () => {
  it('keeps notes with emoji and accents byte-for-byte', async () => {
    const note = 'café ☕ — 家族と過ごした日 🌱';
    await repo.createProfile('dusk', 'Zoë');
    await repo.saveCheckin(5, note);

    const { payload, recoveryKey } = await createBackup();
    const restored = await restoreBackup(payload, recoveryKey);

    expect(restored.checkins[0].note).toBe(note);
    expect((await repo.recentCheckins())[0].note).toBe(note);
  });
});
