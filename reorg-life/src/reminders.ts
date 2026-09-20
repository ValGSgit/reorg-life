import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Local notifications. Everything here is a no-op on web: expo-notifications
 * has no web scheduling backend, and the preview should not ask for
 * permissions it cannot honour.
 */
export const REMINDERS_SUPPORTED = Platform.OS !== 'web';

if (REMINDERS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const DAILY_ID = 'daily-checkin';
const habitId = (id: number) => `habit-${id}`;

export type PermissionState = 'granted' | 'denied' | 'unsupported';

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Asks once, gently. Never throws; a refusal is a normal outcome, not an error. */
export async function requestPermission(): Promise<PermissionState> {
  if (!REMINDERS_SUPPORTED) return 'unsupported';
  try {
    await ensureChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    if (!existing.canAskAgain) return 'denied';
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function getPermission(): Promise<PermissionState> {
  if (!REMINDERS_SUPPORTED) return 'unsupported';
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

async function cancel(identifier: string) {
  if (!REMINDERS_SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

async function scheduleDaily(identifier: string, title: string, body: string, hour: number, minute: number) {
  await cancel(identifier);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

/** Schedules one gentle daily check-in reminder. Returns false if it could not be set. */
export async function scheduleDailyCheckin(hour = 20, minute = 0): Promise<boolean> {
  if (!REMINDERS_SUPPORTED) return false;
  if ((await requestPermission()) !== 'granted') return false;
  await scheduleDaily(
    DAILY_ID,
    'A quiet moment?',
    'Your character would love to hear how today went.',
    hour,
    minute,
  );
  return true;
}

export async function cancelDailyCheckin() {
  await cancel(DAILY_ID);
}

/** Parses 'HH:MM'. Returns null for anything else, so bad data never schedules. */
export function parseTime(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export type HabitReminder = { id: number; title: string; remind_at: string | null; archived: number };

/**
 * Rebuilds every per-habit reminder. Habits without a time, or archived ones,
 * simply end up with nothing scheduled.
 */
export async function syncHabitReminders(habits: HabitReminder[]): Promise<boolean> {
  if (!REMINDERS_SUPPORTED) return false;
  const wanted = habits.filter((h) => !h.archived && parseTime(h.remind_at));
  if (wanted.length === 0) {
    await Promise.all(habits.map((h) => cancel(habitId(h.id))));
    return true;
  }
  if ((await requestPermission()) !== 'granted') return false;
  for (const h of habits) {
    const at = h.archived ? null : parseTime(h.remind_at);
    if (!at) {
      await cancel(habitId(h.id));
      continue;
    }
    await scheduleDaily(habitId(h.id), h.title, 'A small step, whenever you are ready.', at.hour, at.minute);
  }
  return true;
}

export async function cancelHabitReminder(id: number) {
  await cancel(habitId(id));
}
