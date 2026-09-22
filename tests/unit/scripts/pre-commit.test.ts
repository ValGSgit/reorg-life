import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * The pre-commit hook, and the one bypass it is allowed to have.
 *
 * AGENTS.md asks for commit history that shows a failing test before the code
 * that makes it pass. The hook runs the unit suite, so that commit cannot be
 * made — and the only workaround, `--no-verify`, switches off *everything*,
 * including the secret scan and the personal-data guard. That is a worse
 * trade than it looks, and it is the trade the rules currently force.
 *
 * So there is one named hatch, `ALLOW_RED=1`, and these tests exist to pin
 * down exactly how much it is allowed to skip: the unit tests, and nothing
 * else. If someone later widens it to cover lint, or — much worse — the
 * secret and personal-data checks, these fail.
 */

const REPO = resolve(__dirname, '../../..');
const HOOK = join(REPO, 'scripts/pre-commit');

type Run = { status: number; stdout: string; invocations: string[] };

const dirs: string[] = [];

afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/**
 * Runs the real hook against a throwaway repository.
 *
 * `npx` is stubbed with a script that records its arguments and succeeds, so
 * a test can see which checks the hook asked for without running eslint or
 * jest for real. `node_modules` is a bare directory for the same reason: the
 * hook only needs it to exist to decide the fast checks are runnable.
 */
function runHook(staged: Record<string, string>, env: Record<string, string> = {}): Run {
  const dir = mkdtempSync(join(tmpdir(), 'precommit-'));
  dirs.push(dir);

  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');

  for (const [name, body] of Object.entries(staged)) {
    const full = join(dir, name);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
    git('add', '--', name);
  }

  mkdirSync(join(dir, 'node_modules'), { recursive: true });

  // A stub `npx` that logs what it was asked to run, then exits 0.
  const binDir = join(dir, '.stub-bin');
  mkdirSync(binDir, { recursive: true });
  const log = join(dir, 'npx-calls.log');
  writeFileSync(join(binDir, 'npx'), `#!/bin/sh\necho "$@" >> "${log.replace(/\\/g, '/')}"\nexit 0\n`);
  execFileSync('chmod', ['+x', join(binDir, 'npx')]);

  let status = 0;
  let stdout = '';
  try {
    stdout = execFileSync('sh', [HOOK], {
      cwd: dir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        ...env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
      },
    });
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    status = err.status ?? 1;
    stdout = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }

  const invocations = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];

  return { status, stdout, invocations };
}

const ranJest = (r: Run) => r.invocations.some((line) => line.includes('jest'));
const ranLint = (r: Run) => r.invocations.some((line) => line.includes('eslint'));
const ranFormat = (r: Run) => r.invocations.some((line) => line.includes('prettier'));
const ranTypecheck = (r: Run) => r.invocations.some((line) => line.includes('tsc'));

describe('pre-commit, normally', () => {
  it('runs the unit tests', () => {
    const r = runHook({ 'src/thing.ts': 'export const a = 1;\n' });
    expect(ranJest(r)).toBe(true);
    expect(r.status).toBe(0);
  });
});

describe('pre-commit with ALLOW_RED=1', () => {
  it('skips the unit tests, so a failing test can be committed', () => {
    const r = runHook(
      { 'tests/unit/domain/a.test.ts': 'it("fails", () => expect(1).toBe(2));\n' },
      { ALLOW_RED: '1' },
    );
    expect(ranJest(r)).toBe(false);
    expect(r.status).toBe(0);
  });

  it('says out loud that it skipped them', () => {
    const r = runHook({ 'src/thing.ts': 'export const a = 1;\n' }, { ALLOW_RED: '1' });
    expect(r.stdout).toMatch(/ALLOW_RED/);
  });

  it('still runs lint, formatting and typecheck', () => {
    const r = runHook({ 'src/thing.ts': 'export const a = 1;\n' }, { ALLOW_RED: '1' });
    expect(ranLint(r)).toBe(true);
    expect(ranFormat(r)).toBe(true);
    expect(ranTypecheck(r)).toBe(true);
  });

  // The whole argument for the hatch is that it is narrower than --no-verify.
  // If it ever stops being narrower, it has no reason to exist.
  it('still refuses personal data', () => {
    const r = runHook({ 'life.db': 'not really a database\n' }, { ALLOW_RED: '1' });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/personal data/i);
  });

  it('still refuses raw placeholder art', () => {
    const r = runHook({ 'assets/characters/_raw/sheet.png': 'fake\n' }, { ALLOW_RED: '1' });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/watermarked placeholders/i);
  });
});

describe('ALLOW_RED is opt-in', () => {
  it('is off unless it is set to 1', () => {
    for (const value of ['', '0', 'false', 'no']) {
      const r = runHook({ 'src/thing.ts': 'export const a = 1;\n' }, { ALLOW_RED: value });
      expect(ranJest(r)).toBe(true);
    }
  });
});
