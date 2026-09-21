import { useColorScheme } from 'react-native';
import { DARK, LIGHT, PERIOD_TINTS, type PeriodTintId } from './domain';

/**
 * The React-facing half of the palette. The colours themselves live in
 * `src/domain/palette.ts` so they can be contrast-tested in plain Node; this
 * file only picks between them.
 */
export type Theme = typeof LIGHT;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? DARK : LIGHT);

/** The soft background wash for a period (ADR 0001). */
export const periodTint = (period: PeriodTintId, isDark: boolean): string =>
  PERIOD_TINTS[period][isDark ? 'dark' : 'light'];

export { DARK, LIGHT, PERIOD_TINTS };
