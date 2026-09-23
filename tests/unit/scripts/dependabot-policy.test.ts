import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Dependabot's ignore list, and the packages that must stay on it.
 *
 * Expo SDK packages move together. Upgrading one out of step with the others
 * breaks the build in a way npm will not warn about at install time, because
 * expo declares its SDK siblings as `*` peers — so a wrong-SDK package
 * installs cleanly and fails later.
 *
 * `dependabot.yml` already documented that policy in comments. It still
 * happened: `react-native-reanimated` 4.7.0 was proposed, merged, and broke
 * `npm ci` on `main` outright, because reanimated 4.7 needs
 * `react-native-worklets` 0.13.x while Expo SDK 57 pins it to ^0.10.0. The
 * dependency is transitive, so nothing in `package.json` showed the conflict.
 *
 * A comment could not fail a build. This can.
 */

const ROOT = resolve(__dirname, '../../..');
const CONFIG = join(ROOT, '.github/dependabot.yml');

/**
 * Everything here ships as part of an Expo SDK release and must only move
 * when the SDK does, via a deliberate `npx expo install --fix` upgrade.
 */
const MOVES_WITH_THE_SDK = [
  'expo',
  'expo-*',
  '@expo/*',
  'react-native',
  'react',
  'react-dom',
  'react-native-web',
  'jest-expo',
  // Added after the 4.7.0 incident described above.
  'react-native-reanimated',
  'react-native-worklets',
];

function ignoredNames(): string[] {
  const text = readFileSync(CONFIG, 'utf8');
  return [...text.matchAll(/^\s*-\s*dependency-name:\s*['"]?([^'"\n]+?)['"]?\s*$/gm)].map((m) => m[1]);
}

describe('dependabot ignores the packages that move with the Expo SDK', () => {
  it.each(MOVES_WITH_THE_SDK)('ignores %s', (name) => {
    expect(ignoredNames()).toContain(name);
  });

  it('pins reanimated to a version Expo SDK 57 can resolve', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    // 4.6+ requires react-native-worklets 0.13.x, which Expo SDK 57 does not
    // ship. Raising this needs an SDK upgrade, not a version bump.
    expect(pkg.dependencies['react-native-reanimated']).toMatch(/^4\.5\./);
  });
});
