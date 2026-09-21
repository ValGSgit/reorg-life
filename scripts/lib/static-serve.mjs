/**
 * The parts of the preview server worth testing on their own: turning a
 * request path into a file path, and naming its type.
 *
 * Kept pure and separate because one of them takes untrusted input. The
 * server itself is a development convenience, but "it is only a dev tool" is
 * a bad reason to serve whatever path someone asks for.
 *
 * Deliberately dependency-free, like the rest of `scripts/lib`.
 */
import { posix } from 'node:path';

const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  wasm: 'application/wasm',
  txt: 'text/plain; charset=utf-8',
};

/** The media type for a filename, or a byte stream when it is not known. */
export function contentTypeFor(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return TYPES[ext] ?? 'application/octet-stream';
}

/**
 * The file a request maps to, or null if it escapes the export directory.
 *
 * Normalising before checking is the point: `/a/../../etc/passwd` only looks
 * safe until the `..` segments are resolved. Percent escapes are decoded
 * first, because an encoded `..` is still a `..`.
 */
export function resolveRequestPath(root, requestPath) {
  const withoutQuery = requestPath.split('?')[0].split('#')[0];

  let decoded;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    // A malformed escape is a bad request, not something to guess at.
    return null;
  }

  // Reject `..` as a path segment before normalising rather than after.
  // `posix.normalize` collapses leading `..` against the root, so
  // `/../../etc/passwd` quietly becomes `/etc/passwd` and then looks like an
  // ordinary path — checking afterwards would find nothing wrong with it.
  // Nothing the export serves ever contains a `..` segment.
  if (decoded.split('/').some((segment) => segment === '..')) return null;

  const relative = posix.normalize(decoded).replace(/^\/+/, '');
  const file = relative === '' || relative === '.' ? 'index.html' : relative;
  const resolved = posix.join(root, file);

  // Belt and braces: whatever the normalisation did, the answer has to be
  // inside the directory being served.
  return resolved.startsWith(`${root}/`) ? resolved : null;
}
