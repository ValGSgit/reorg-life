import { contentTypeFor, resolveRequestPath } from '../../../scripts/lib/static-serve.mjs';

/**
 * The preview server is a development convenience, but it still takes a path
 * off the wire and turns it into a file read. Traversal out of the export
 * directory is the one bug worth refusing to ship even in a dev tool.
 */
describe('resolveRequestPath', () => {
  const root = '/srv/dist';

  it('maps a plain path to a file under the root', () => {
    expect(resolveRequestPath(root, '/favicon.ico')).toBe('/srv/dist/favicon.ico');
  });

  it('serves index.html for the root itself', () => {
    expect(resolveRequestPath(root, '/')).toBe('/srv/dist/index.html');
  });

  it('ignores the query string', () => {
    expect(resolveRequestPath(root, '/index.html?demo=seed')).toBe('/srv/dist/index.html');
  });

  it('refuses to climb out of the root', () => {
    expect(resolveRequestPath(root, '/../../etc/passwd')).toBeNull();
    expect(resolveRequestPath(root, '/../secrets.txt')).toBeNull();
  });

  it('refuses an encoded climb, not just a literal one', () => {
    expect(resolveRequestPath(root, '/%2e%2e/%2e%2e/etc/passwd')).toBeNull();
  });

  it('survives a malformed escape rather than throwing', () => {
    expect(resolveRequestPath(root, '/%zz')).toBeNull();
  });

  it('keeps a path that merely contains dots', () => {
    expect(resolveRequestPath(root, '/_expo/static/js/web/index-a1b2.js')).toBe(
      '/srv/dist/_expo/static/js/web/index-a1b2.js',
    );
  });
});

describe('contentTypeFor', () => {
  it('knows the types the export actually contains', () => {
    expect(contentTypeFor('index.html')).toMatch(/text\/html/);
    expect(contentTypeFor('app.js')).toMatch(/javascript/);
    expect(contentTypeFor('style.css')).toMatch(/text\/css/);
    expect(contentTypeFor('metadata.json')).toMatch(/application\/json/);
    expect(contentTypeFor('sprout-1.png')).toBe('image/png');
    expect(contentTypeFor('wa-sqlite.wasm')).toBe('application/wasm');
  });

  it('falls back to a byte stream rather than guessing wrong', () => {
    expect(contentTypeFor('mystery.xyz')).toBe('application/octet-stream');
  });

  it('is not confused by upper case extensions', () => {
    expect(contentTypeFor('LOGO.PNG')).toBe('image/png');
  });
});
