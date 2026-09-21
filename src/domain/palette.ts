/**
 * The app's colours, as pure data (T-033).
 *
 * They live here rather than in `theme.ts` so they can be measured in plain
 * Node: `theme.ts` imports `useColorScheme` from react-native, which would
 * drag a renderer into a test whose only job is arithmetic on hex strings.
 * `theme.ts` re-exports all of this, so nothing else needs to know.
 *
 * Every pair is asserted against WCAG AA in `tests/unit/domain/palette.test.ts`,
 * with the ratios computed rather than written down. Change a value here and
 * the test tells you what it did.
 */

/**
 * Light theme.
 *
 * `accent` and `good` were lightened-for-prettiness originally and failed AA
 * badly — 3.36 and 2.31 against white, when 4.5 is the bar. Both were darkened
 * along their own hue, lightness only, so the palette reads the same but can
 * actually be read.
 */
export const LIGHT = {
  bg: '#F7F4EF',
  card: '#FFFFFF',
  text: '#2B2A33',
  sub: '#6E6B78',
  line: '#E7E2DA',
  /** Was #6C8EBF (3.36 on white). */
  accent: '#4A71AA',
  /** Was #7DB88B (2.31 on white) — the worst failure in the palette. */
  good: '#447C51',
  /** Sits on `accent`, so it is part of the palette rather than a literal. */
  buttonText: '#FFFFFF',
};

/**
 * Dark theme.
 *
 * The colours themselves already passed and are untouched. `buttonText` is
 * new and is *not* white: the dark accent is a pale blue, and white on it is
 * 2.22 — the primary button was unreadable in dark mode and nothing recorded
 * it. Near-black on that same blue is 8.17.
 */
export const DARK = {
  bg: '#16151B',
  card: '#211F29',
  text: '#F1EFF5',
  sub: '#A19DAE',
  line: '#2E2B38',
  accent: '#8FB0E0',
  good: '#8FCB9C',
  buttonText: '#16151B',
};

/**
 * A soft background wash per period (ADR 0001).
 *
 * Meant to be felt rather than noticed, so they sit close to the page colour —
 * but text still has to clear AA on them, which is why the night tint is a
 * shade lighter than it first was: muted text on it measured 4.42.
 */
export const PERIOD_TINTS = {
  morning: { light: '#FBF3E6', dark: '#1C1913' },
  afternoon: { light: '#F1F5FB', dark: '#14171E' },
  night: { light: '#F0EEF5', dark: '#141220' },
} as const;

export type PeriodTintId = keyof typeof PERIOD_TINTS;
