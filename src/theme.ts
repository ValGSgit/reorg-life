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
