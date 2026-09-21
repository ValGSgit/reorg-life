#!/usr/bin/env node
/**
 * Serves the static web export over plain HTTP.
 *
 *   node scripts/serve-web.mjs [--port 8080]
 *
 * This is the "look at it without a dev server" path: `npm run web:build`
 * produces `dist/web`, and this serves those files with no Metro, no
 * bundler and no watching. What you see is what the export actually contains.
 *
 * Deliberately written on `node:http` rather than adding a static-server
 * dependency: it is thirty lines, it works the same on Windows, and a preview
 * tool is not worth a new entry in the lockfile.
 *
 * It binds to 127.0.0.1 on purpose. This build is unencrypted by design and
 * has no business being reachable from the rest of the network.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentTypeFor, resolveRequestPath } from './lib/static-serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'web');

const portArg = process.argv.indexOf('--port');
const PORT = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]);

if (!existsSync(DIST)) {
  console.error('\nNo build to serve at dist/web.\n');
  console.error('Run this first:\n\n  npm run web:build\n');
  process.exit(1);
}

// posix separators, because resolveRequestPath works in URL space.
const distPosix = DIST.split('\\').join('/');

const server = createServer((req, res) => {
  const resolved = resolveRequestPath(distPosix, req.url ?? '/');
  if (!resolved) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  const file = resolved.split('/').join(process.platform === 'win32' ? '\\' : '/');
  const exists = existsSync(file) && statSync(file).isFile();

  // A single-page app: anything that is not a real file is the app itself,
  // so a deep link still boots rather than 404ing.
  const target = exists ? file : join(DIST, 'index.html');

  res.writeHead(exists ? 200 : 404, {
    'content-type': contentTypeFor(target),
    // A preview should never be cached into confusion.
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log(`  Serving the web export at  http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('  This build is NOT encrypted. It is a testing surface, not a journal.');
  console.log('  Seed and wipe demo data from Settings, at the bottom.');
  console.log('');
  console.log('  Ctrl-C to stop.');
  console.log('');
});
