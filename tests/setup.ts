/**
 * expo-notifications has no test backend and would reach for a native module.
 * Reminder behaviour is asserted through this mock rather than by scheduling
 * anything real.
 */
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

/**
 * Reanimated 4 needs a native worklets runtime it cannot have in Jest, and the
 * mock it ships pulls that runtime in through its own index — so it is stubbed
 * locally. With it, animated styles resolve to their end values
 * immediately — which is what the companion tests want: they assert the
 * opacity a blend produces, not the frames on the way there.
 */
jest.mock('react-native-reanimated', () => require('./helpers/reanimatedMock'));
