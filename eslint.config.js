// Flat config (ESLint 9). `npm run lint` and `npx expo lint` both use this.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'coverage/*', 'node_modules/*', '.expo/*', 'playwright-report/*', 'test-results/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // Unused args are fine when they document a signature, as long as they
      // are underscore-prefixed.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // The one rule that keeps src/domain unit-testable in plain Node. If this
    // starts failing, the fix is to move the impure part out of domain/, not
    // to relax the rule.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/domain must stay pure: no React imports.' },
            { name: 'react-native', message: 'src/domain must stay pure: no react-native imports.' },
          ],
          patterns: [
            {
              group: ['expo', 'expo-*', 'react-native/*', '@react-native/*'],
              message: 'src/domain must stay pure: no Expo or react-native imports.',
            },
          ],
        },
      ],
    },
  },
  {
    // Screens load data with `useEffect(() => { load(); }, [load])`, where
    // `load` is an async useCallback. The setState lands after an await, but
    // the rule cannot see through that and flags the call.
    //
    // It is still pointing at something real: none of these loaders cancel on
    // unmount. Fixing that means restructuring async loading in four screens,
    // which needs component tests in place first, so it is tracked as a task
    // rather than done here or quietly ignored:
    //   docs/tasks/T-014-cancel-safe-screen-loading.md
    // Re-enable this rule as part of that task.
    files: ['src/features/**/*.tsx'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    // Tests legitimately use require() for post-mock imports and Node globals.
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
]);
