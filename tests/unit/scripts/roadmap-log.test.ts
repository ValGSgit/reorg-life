import fs from 'node:fs';
import path from 'node:path';
const { assembleStatusLog } = require('../../../scripts/lib/status-log.mjs');

/**
 * The status log in `docs/ROADMAP.md` must match the entries it is generated
 * from.
 *
 * One file per entry stopped two open pull requests conflicting over the same
 * lines in the log. It did not stop them conflicting over the *output*: both
 * branches regenerate `docs/ROADMAP.md`, and git merges that file by hunk, so
 * two entries added on two branches land in branch order rather than in date
 * order — with the blank line between a multi-paragraph entry and the next
 * bullet dropped, which is a formatting failure rather than a visible one.
 *
 * That is what took `main` red after PR #36: the merge produced a log that
 * `--generate` would never have written, and nothing compared the two.
 *
 * The fix is one command, `node scripts/next-task.mjs --generate`, and this
 * test is what says when it is needed.
 */

const ROOT = path.resolve(__dirname, '../../..');
const STATUS_DIR = path.join(ROOT, 'docs', 'status');

const entries = () =>
  fs
    .readdirSync(STATUS_DIR)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({ name: file, body: fs.readFileSync(path.join(STATUS_DIR, file), 'utf8') }));

/** The status log as it currently stands in the ROADMAP, marker excluded. */
function logInRoadmap(): string {
  const roadmap = fs.readFileSync(path.join(ROOT, 'docs', 'ROADMAP.md'), 'utf8');
  const heading = '## Status log\n';
  const start = roadmap.indexOf(heading);
  const after = roadmap.indexOf('\n## ', start + heading.length);
  return roadmap
    .slice(start + heading.length, after)
    .replace(/^\s*<!--[\s\S]*?-->\s*/, '')
    .trim();
}

describe('the status log in docs/ROADMAP.md', () => {
  it('is what the generator would write from docs/status/', () => {
    // If this fails, nothing is broken in the entries themselves — run
    // `node scripts/next-task.mjs --generate` and commit the result.
    expect(logInRoadmap()).toEqual(assembleStatusLog(entries()).trim());
  });

  it('lists every entry file exactly once', () => {
    const log = logInRoadmap();
    for (const entry of entries()) {
      const firstLine = entry.body.replace(/\s+$/, '').split('\n')[0];
      expect([entry.name, log.includes(firstLine)]).toEqual([entry.name, true]);
    }
  });
});
