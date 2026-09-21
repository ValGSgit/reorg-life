#!/usr/bin/env node
/**
 * Prints the highest-priority task that is ready to start.
 *
 *   node scripts/next-task.mjs             the one task to do next
 *   node scripts/next-task.mjs --list      every task, grouped by status
 *   node scripts/next-task.mjs --generate  rewrite both generated documents
 *   node scripts/next-task.mjs --index     alias for --generate
 *
 * "Ready" means status todo, not blocked, and with every task in `blocked_by`
 * already done. Ordering lives in `lib/task-order.mjs`: priority (P1 first),
 * then milestone, then id, with `enables_review_of` letting a task that
 * unblocks *reviewing* another sit in front of it.
 *
 * The two generated documents are `docs/tasks/INDEX.md` and the status log in
 * `docs/ROADMAP.md`, assembled from one file per entry in `docs/status/`.
 * Neither is edited by hand.
 *
 * Deliberately dependency-free: it parses the small subset of YAML the task
 * front matter uses, so it runs on a clean checkout with nothing installed.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleStatusLog } from './lib/status-log.mjs';
import { orderTasks } from './lib/task-order.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TASKS_DIR = join(ROOT, 'docs', 'tasks');

const STATUS_DIR = join(ROOT, 'docs', 'status');
const ROADMAP = join(ROOT, 'docs', 'ROADMAP.md');

const STATUS_MARKER =
  '<!-- Generated from docs/status/ by scripts/next-task.mjs --generate. Do not edit by hand. -->';

/** Minimal front-matter parser: flat `key: value` pairs between --- fences. */
function parseFrontMatter(text, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) throw new Error(`${file}: no front matter`);
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at === -1) continue;
    const key = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (value === 'null' || value === '') value = null;
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else value = value.replace(/^['"]|['"]$/g, '');
    out[key] = value;
  }
  return out;
}

function loadTasks() {
  return readdirSync(TASKS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md' && f !== 'INDEX.md')
    .map((file) => {
      const fm = parseFrontMatter(readFileSync(join(TASKS_DIR, file), 'utf8'), file);
      return {
        file,
        path: `docs/tasks/${file}`,
        id: fm.id ?? file.slice(0, 5),
        title: fm.title ?? '(untitled)',
        milestone: fm.milestone ?? 'Unscheduled',
        priority: fm.priority ?? 'P3',
        status: fm.status ?? 'todo',
        cutCandidate: fm.cut_candidate === true,
        blockedBy: fm.blocked_by
          ? String(fm.blocked_by)
              .split(/[,\s]+/)
              .filter(Boolean)
          : [],
        // Not a dependency: it cannot block readiness, only ordering.
        enablesReviewOf: fm.enables_review_of
          ? String(fm.enables_review_of)
              .split(/[,\s]+/)
              .filter(Boolean)
          : [],
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** A task is ready when it is todo, not blocked, and its dependencies are done. */
function readiness(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return (task) => {
    if (task.status !== 'todo') return { ready: false, why: task.status };
    if (task.blockedBy.length) {
      const waiting = task.blockedBy.filter((id) => byId.get(id)?.status !== 'done');
      if (waiting.length) return { ready: false, why: `waiting on ${waiting.join(', ')}` };
    }
    return { ready: true, why: null };
  };
}

function printNext(tasks) {
  const isReady = readiness(tasks);
  const ready = orderTasks(tasks.filter((t) => isReady(t).ready));

  if (!ready.length) {
    const blocked = tasks.filter((t) => t.status === 'todo');
    console.log('\nNothing is ready to start.\n');
    if (blocked.length) {
      console.log('Blocked:');
      for (const t of blocked) console.log(`  ${t.id}  ${t.title}\n        ${isReady(t).why}`);
      console.log('');
    }
    return;
  }

  const [next, ...rest] = ready;
  console.log('');
  console.log(`  Next: ${next.id} — ${next.title}`);
  console.log('');
  console.log(`  Priority   ${next.priority}${next.cutCandidate ? '  (cut candidate)' : ''}`);
  console.log(`  Milestone  ${next.milestone}`);
  console.log(`  File       ${next.path}`);
  console.log('');
  console.log('  Read the task file, then follow AGENTS.md: write the failing');
  console.log('  test first, and open one pull request for this task alone.');
  console.log('');
  if (rest.length) {
    console.log(
      `  After that: ${rest
        .slice(0, 3)
        .map((t) => t.id)
        .join(', ')}`,
    );
    console.log('');
  }
}

function printList(tasks) {
  const isReady = readiness(tasks);
  for (const status of ['doing', 'todo', 'blocked', 'done', 'cut']) {
    const group = orderTasks(tasks.filter((t) => t.status === status));
    if (!group.length) continue;
    console.log(`\n${status.toUpperCase()} (${group.length})`);
    for (const t of group) {
      const flags = [
        t.priority,
        t.cutCandidate ? 'cut-candidate' : null,
        !isReady(t).ready && status === 'todo' ? isReady(t).why : null,
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`  ${t.id}  ${t.title}  [${flags}]`);
    }
  }
  console.log('');
}

function writeIndex(tasks) {
  const isReady = readiness(tasks);
  const rows = (group) =>
    orderTasks(group)
      .map((t) => {
        const notes = [t.cutCandidate ? 'cut candidate' : null, isReady(t).ready ? null : isReady(t).why]
          .filter(Boolean)
          .join('; ');
        return `| [${t.id}](${t.file}) | ${t.title} | ${t.priority} | ${t.milestone} | ${notes || '—'} |`;
      })
      .join('\n');

  const section = (title, status) => {
    const group = tasks.filter((t) => t.status === status);
    // null, not '', so the blank lines below survive the filter.
    if (!group.length) return null;
    return [
      `## ${title} (${group.length})`,
      '',
      '| Task | Title | Priority | Milestone | Notes |',
      '| --- | --- | --- | --- | --- |',
      rows(group),
      '',
    ].join('\n');
  };

  const ready = orderTasks(tasks.filter((t) => isReady(t).ready));

  const body = [
    '<!-- Generated by scripts/next-task.mjs --index. Do not edit by hand. -->',
    '',
    '# Task index',
    '',
    `${tasks.length} tasks. The source of truth for each is its own file; this is a view.`,
    '',
    ready.length
      ? `**Next up:** [${ready[0].id}](${ready[0].file}) — ${ready[0].title}`
      : '**Nothing is ready to start.**',
    '',
    'Run `npm run next-task` to get the same answer on the command line.',
    '',
    section('In progress', 'doing'),
    section('To do', 'todo'),
    section('Blocked', 'blocked'),
    section('Done', 'done'),
    section('Cut', 'cut'),
    '## Statuses',
    '',
    '`todo` · `doing` · `blocked` · `done` · `cut`',
    '',
    'A cut task keeps its file and gains a one-line reason. It is not deleted,',
    'so the decision stays visible later.',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  writeFileSync(join(TASKS_DIR, 'INDEX.md'), body + '\n', 'utf8');
  console.log(`Wrote docs/tasks/INDEX.md (${tasks.length} tasks)`);
}

/**
 * Rewrites the status log in docs/ROADMAP.md from the entries in docs/status/.
 *
 * The log used to be a list that every task pull request appended to, so two
 * open pull requests conflicted over the same lines — and resolving one of
 * those conflicts by hand silently lost an entry on the way into main. A
 * branch now adds a file and touches no shared line.
 */
function writeStatusLog() {
  const entries = readdirSync(STATUS_DIR)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({ name: file, body: readFileSync(join(STATUS_DIR, file), 'utf8') }));

  const roadmap = readFileSync(ROADMAP, 'utf8');
  const heading = '## Status log\n';
  const start = roadmap.indexOf(heading);
  if (start === -1) throw new Error('docs/ROADMAP.md has no "## Status log" heading');

  // Everything up to the next top-level heading belongs to the log.
  const after = roadmap.indexOf('\n## ', start + heading.length);
  if (after === -1) throw new Error('docs/ROADMAP.md has no heading after the status log');

  const body = [heading.trimEnd(), '', STATUS_MARKER, '', assembleStatusLog(entries), '', ''].join('\n');
  writeFileSync(ROADMAP, roadmap.slice(0, start) + body + roadmap.slice(after + 1), 'utf8');
  console.log('Wrote the status log in docs/ROADMAP.md (' + entries.length + ' entries)');
}

const tasks = loadTasks();
const arg = process.argv[2];
if (arg === '--list') printList(tasks);
else if (arg === '--index' || arg === '--generate') {
  // Both generated documents, always together. Regenerating one and
  // forgetting the other is how they drift apart.
  writeIndex(tasks);
  writeStatusLog();
} else printNext(tasks);
