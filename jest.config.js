/**
 * Three projects, because the three kinds of test need different environments.
 *
 * - `domain` — pure logic in plain Node. No renderer, no Expo. Fast, and the
 *   suite the coverage floor leans on.
 * - `db` — schema and repository against a real in-memory SQLite (Node 22's
 *   built-in `node:sqlite`), so migrations and constraints are exercised for
 *   real rather than against a fake that would accept invalid SQL.
 * - `component` — screens through jest-expo, so react-native and Expo modules
 *   resolve.
 *
 * Playwright owns the end-to-end suite; Jest does not run it. See
 * `npm run test:e2e`.
 */
const babelTransform = {
  '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
};

module.exports = {
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/domain/**/*.test.ts'],
      transform: babelTransform,
    },
    {
      displayName: 'db',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/db/**/*.test.ts'],
      transform: babelTransform,
    },
    {
      displayName: 'component',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/component/**/*.test.tsx', '<rootDir>/tests/component/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/db/**/*.ts',
    'src/backup.ts',
    '!src/**/*.web.ts',
    '!src/db/index.ts',
    '!src/domain/index.ts',
  ],
  coverageThreshold: {
    // Enforced in CI. Raising this is welcome. Lowering it needs a sentence in
    // the PR description saying why — see AGENTS.md.
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
