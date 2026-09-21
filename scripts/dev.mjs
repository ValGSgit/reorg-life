#!/usr/bin/env node
/**
 * One command for looking at the app and checking it still works.
 *
 *   npm run dev            what you can do, and what each one costs
 *   npm run dev web        the live dev server, with reloading
 *   npm run dev preview    build the static export and serve it
 *   npm run dev android    the dev server, opening on a connected phone
 *   npm run dev test       unit tests
 *   npm run dev check      the full gate, same as npm run verify
 *   npm run dev e2e        end-to-end tests against the web build
 *
 * This exists because looking at a change meant remembering four different
 * scripts. It adds nothing of its own — every one of these shells out to a
 * script that still works on its own, so CI and `package.json` are unchanged.
 *
 * Seeding is deliberately not here. The web preview keeps its database in the
 * browser, and a phone keeps its own, so neither can be filled from a Node
 * process. The seed and wipe buttons live at the bottom of Settings in any
 * development build.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TASKS = {
  web: {
    blurb: 'Dev server with reloading. Best while changing something.',
    steps: [['npm', ['run', 'web']]],
  },
  preview: {
    blurb: 'Build the static export and serve it. No Metro; what ships is what you see.',
    steps: [
      ['npm', ['run', 'web:build']],
      ['npm', ['run', 'web:serve']],
    ],
  },
  android: {
    blurb: 'Dev server, opening on a connected phone. Needs a dev build installed.',
    steps: [['npm', ['run', 'android']]],
  },
  test: {
    blurb: 'Unit tests. Fast.',
    steps: [['npm', ['test']]],
  },
  check: {
    blurb: 'The full gate: lint, format, types, coverage, both exports. Slow, and the one CI runs.',
    steps: [['npm', ['run', 'verify']]],
  },
  e2e: {
    blurb: 'End-to-end tests in a real browser.',
    steps: [['npm', ['run', 'test:e2e']]],
  },
};

function usage() {
  console.log('');
  console.log('  npm run dev <what>');
  console.log('');
  for (const [name, task] of Object.entries(TASKS)) {
    console.log(`  ${name.padEnd(9)} ${task.blurb}`);
  }
  console.log('');
  console.log('  Demo data: seed and wipe are buttons at the bottom of Settings,');
  console.log('  in any development build. They cannot run in a release build.');
  console.log('');
}

/** Runs one command, inheriting stdio so output appears as it happens. */
function run(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${command} ${args.join(' ')}\n`);
    // shell: true so `npm` resolves to npm.cmd on Windows, which is the
    // machine this is for.
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}

const name = process.argv[2];
const task = TASKS[name];

if (!task) {
  if (name) console.log(`\n  No idea what "${name}" is.`);
  usage();
  process.exit(name ? 1 : 0);
}

for (const [command, args] of task.steps) {
  try {
    await run(command, args);
  } catch (error) {
    console.error(`\n  Stopped: ${error.message}\n`);
    process.exit(1);
  }
}
