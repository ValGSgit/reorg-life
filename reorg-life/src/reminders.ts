import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const DAILY_ID = 'daily-checkin';

/** Schedules one gentle daily check-in reminder. Returns false if permission was denied. */
export async function scheduleDailyCheckin(hour = 20, minute = 0): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: { title: 'A quiet moment?', body: 'Your character would love to hear how today went.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}

export async function cancelDailyCheckin() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
}
