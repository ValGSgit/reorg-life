import { useColorScheme } from 'react-native';

const light = {
  bg: '#F7F4EF',
  card: '#FFFFFF',
  text: '#2B2A33',
  sub: '#6E6B78',
  line: '#E7E2DA',
  accent: '#6C8EBF',
  good: '#7DB88B',
};
const dark = {
  bg: '#16151B',
  card: '#211F29',
  text: '#F1EFF5',
  sub: '#A19DAE',
  line: '#2E2B38',
  accent: '#8FB0E0',
  good: '#8FCB9C',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

/**
 * A soft background wash per period (ADR 0001).
 *
 * Deliberately close to the page background: this is meant to be felt rather
 * than noticed, and it sits behind text that still has to meet contrast. The
 * dark values are near-black with a hint of the same hue, because a tint
 * bright enough to read as "sunrise" in dark mode is a tint bright enough to
 * be unpleasant at 3am — which is exactly when someone might be using this.
 */
const PERIOD_TINTS = {
  morning: { light: '#FBF3E6', dark: '#1C1913' },
  afternoon: { light: '#F1F5FB', dark: '#14171E' },
  night: { light: '#EEEBF4', dark: '#141220' },
} as const;

export const periodTint = (period: keyof typeof PERIOD_TINTS, isDark: boolean): string =>
  PERIOD_TINTS[period][isDark ? 'dark' : 'light'];
