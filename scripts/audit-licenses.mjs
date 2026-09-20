#!/usr/bin/env node
/**
 * Reads the declared licence of every installed package and sorts them into
 * "fine for a paid app", "needs a look", and "stop".
 *
 *   node scripts/audit-licenses.mjs             summary
 *   node scripts/audit-licenses.mjs --full      every package
 *   node scripts/audit-licenses.mjs --prod      only what ships in the bundle
 *
 * This reports what packages *declare*. It is not legal advice and it cannot
 * see a licence that is wrong in package.json, or a second licence inside a
 * vendored binary. The copyleft and unknown lists are the ones worth a human
 * looking at; see docs/LICENSES.md.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = join(ROOT, 'node_modules');

/** Permissive: commercial use and distribution are allowed, attribution aside. */
const PERMISSIVE = new Set([
  'MIT',
  'MIT*',
  'ISC',
  'BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'BlueOak-1.0.0',
  'Python-2.0',
  'WTFPL',
  'Zlib',
  'MIT-0',
]);

/**
 * Weak copyleft. Usually fine when merely linked or unmodified, but the
 * obligation is real if the file itself is modified and shipped.
 */
const WEAK_COPYLEFT = new Set([
  'MPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'LGPL-2.1-or-later',
  'EPL-2.0',
  'CDDL-1.0',
]);

/** Strong copyleft. Shipping these in a closed-source paid app is a problem. */
const STRONG_COPYLEFT = new Set([
  'GPL-2.0',
  'GPL-3.0',
  'GPL-2.0-or-later',
  'GPL-3.0-or-later',
  'AGPL-3.0',
  'AGPL-3.0-or-later',
  'SSPL-1.0',
]);

function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license && typeof pkg.license === 'object' && pkg.license.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).join(' OR ');
  return 'UNKNOWN';
}

/** Splits `(MIT OR Apache-2.0)` so a dual-licensed package is judged fairly. */
function parts(expr) {
  return expr
    .replace(/[()]/g, '')
    .split(/\s+(?:OR|AND)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function classify(expr) {
  const p = parts(expr);
  if (p.some((x) => PERMISSIVE.has(x))) return 'permissive';
  if (p.some((x) => STRONG_COPYLEFT.has(x))) return 'strong-copyleft';
  if (p.some((x) => WEAK_COPYLEFT.has(x))) return 'weak-copyleft';
  return 'unknown';
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const full = join(dir, entry.name);
    if (entry.name.startsWith('@')) {
      yield* walk(full);
      continue;
    }
    if (entry.name === '.bin') continue;
    const manifest = join(full, 'package.json');
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        if (pkg.name) yield { name: pkg.name, version: pkg.version, license: licenseOf(pkg), dir: full };
      } catch {
        /* an unparseable manifest is reported by its absence from the list */
      }
    }
    const nested = join(full, 'node_modules');
    if (existsSync(nested)) yield* walk(nested);
  }
}

/** Packages reachable from `dependencies` — i.e. what can end up in the app. */
function productionSet() {
  const root = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const seen = new Set();
  const queue = Object.keys(root.dependencies ?? {});
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const manifest = join(MODULES, name, 'package.json');
    if (!existsSync(manifest)) continue;
    try {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      queue.push(...Object.keys(pkg.dependencies ?? {}));
    } catch {
      /* ignore */
    }
  }
  return seen;
}

const full = process.argv.includes('--full');
const prodOnly = process.argv.includes('--prod');

const prod = productionSet();
let packages = [...walk(MODULES)];
if (prodOnly) packages = packages.filter((p) => prod.has(p.name));

// One row per name+version; the same package appears at several depths.
const unique = new Map();
for (const p of packages) unique.set(`${p.name}@${p.version}`, p);
const all = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));

const buckets = { permissive: [], 'weak-copyleft': [], 'strong-copyleft': [], unknown: [] };
const byLicense = new Map();
for (const p of all) {
  const kind = classify(p.license);
  buckets[kind].push(p);
  byLicense.set(p.license, (byLicense.get(p.license) ?? 0) + 1);
}

console.log(
  `\n${all.length} packages${prodOnly ? ' (production dependency tree)' : ' (everything installed)'}\n`,
);

console.log('By licence:');
for (const [license, count] of [...byLicense.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${license}`);
}

console.log('\nBy risk for a paid, closed-source app:');
console.log(`  ${String(buckets.permissive.length).padStart(4)}  permissive        fine`);
console.log(
  `  ${String(buckets['weak-copyleft'].length).padStart(4)}  weak copyleft     fine if unmodified; check`,
);
console.log(`  ${String(buckets['strong-copyleft'].length).padStart(4)}  strong copyleft   STOP if it ships`);
console.log(`  ${String(buckets.unknown.length).padStart(4)}  unknown           check by hand`);

for (const kind of ['strong-copyleft', 'weak-copyleft', 'unknown']) {
  if (!buckets[kind].length) continue;
  console.log(`\n${kind}:`);
  for (const p of buckets[kind]) {
    console.log(
      `  ${p.name}@${p.version}  —  ${p.license}${prod.has(p.name) ? '  [SHIPS]' : '  (dev only)'}`,
    );
  }
}

if (full) {
  console.log('\nAll packages:');
  for (const p of all) console.log(`  ${p.name}@${p.version}  ${p.license}`);
}

console.log('');

// Anything strong-copyleft that actually ships fails the check.
const blocking = buckets['strong-copyleft'].filter((p) => prod.has(p.name));
if (blocking.length) {
  console.error(`FAIL: ${blocking.length} strong-copyleft package(s) in the shipping tree.`);
  process.exit(1);
}
