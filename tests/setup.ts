/**
 * jest-expo pays for standing up the react-native module graph on the first
 * render in a file, and whichever test runs first wears it. On a cold CI
 * runner that is more than Jest's 5s default — Timeline.test.tsx takes about
 * nine seconds all told, and its first test failed CI on two unrelated pull
 * requests in a row while passing locally.
 *
 * This is a cold-start allowance for the component suite only. Nothing here
 * waits on anything real, and the domain, db and scripts projects keep the
 * default, where a slow test would be a genuine signal.
 *
 * It lives here rather than in jest.config.js because testTimeout is not a
 * per-project option — Jest ignores it there and says so.
 */
jest.setTimeout(30_000);

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
