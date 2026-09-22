/**
 * The ROADMAP status log, assembled from one file per entry.
 *
 * It used to be a single list that every task pull request appended to. Two
 * pull requests open at once touch the same few lines, so they conflict, and
 * resolving that conflict by hand already dropped an entry once without
 * anyone noticing. One file per entry means a task branch adds a file and
 * touches no shared line, so there is nothing to conflict over.
 *
 * Entries live in `docs/status/` and are named `YYYY-MM-DD-NN-slug.md`. The
 * `NN` orders entries within a day; two branches picking the same number is
 * harmless, because the filenames still differ and both files survive. The
 * body is plain prose, wrapped as you would write it — the leading bullet and
 * the two-space continuation indent are added here.
 *
 * Deliberately dependency-free and pure: no file system, no imports, so it
 * can be tested directly and runs on a clean checkout.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `YYYY-MM-DD-NN-slug.md`. Anything else is not an entry. */
const ENTRY_NAME = /^(\d{4}-\d{2}-\d{2})-(\d{2})-([a-z0-9][a-z0-9-]*)\.md$/;

/**
 * Pulls the date, sequence and slug out of an entry filename.
 *
 * Returns null rather than guessing, so a README or a stray file in the
 * directory is skipped instead of being rendered as a broken log line.
 */
export function parseEntryName(filename) {
  const match = ENTRY_NAME.exec(filename);
  if (!match) return null;
  return { date: match[1], seq: match[2], slug: match[3] };
}

/** `2026-09-20` to `20 Sep` — the short form the log has always used. */
export function formatEntryDate(isoDate) {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/**
 * Renders entries as the markdown list that goes into the ROADMAP.
 *
 * Ordering is by filename, which is date, then sequence, then slug — a total
 * order that does not depend on the order the directory was read in, so two
 * machines assemble the same log.
 */
export function assembleStatusLog(entries) {
  return (
    entries
      .map((entry) => ({ ...entry, meta: parseEntryName(entry.name) }))
      .filter((entry) => entry.meta)
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((entry) => {
        const lines = entry.body.replace(/\s+$/, '').split('\n');
        const head = `- **${formatEntryDate(entry.meta.date)}** — ${lines[0]}`;
        // Continuation lines are indented two spaces to sit under the bullet.
        // Blank lines stay blank rather than becoming trailing whitespace.
        const rest = lines.slice(1).map((line) => (line.trim() === '' ? '' : `  ${line}`));
        return [head, ...rest].join('\n');
      })
      // An entry that runs to more than one paragraph needs a blank line before
      // the next bullet, which is what prettier does to this list by hand. Join
      // them tightly and `--generate` writes a file that `format:check` then
      // rejects, so every status entry broke the build until someone reran
      // prettier — which the next `--generate` undid again. Single-paragraph
      // entries stay tight, because that is also what prettier leaves alone.
      .reduce(
        (out, block, i, blocks) =>
          i === 0 ? block : out + (blocks[i - 1].includes('\n\n') ? '\n\n' : '\n') + block,
        '',
      )
  );
}
