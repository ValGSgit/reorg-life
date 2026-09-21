import { assembleStatusLog, formatEntryDate, parseEntryName } from '../../../scripts/lib/status-log.mjs';

/**
 * The status log used to be one list in docs/ROADMAP.md that every task PR
 * appended to. Two PRs touching the same few lines conflict, and resolving
 * that conflict by hand already lost an entry once, silently, on the way into
 * main (#20's line, dropped when #21's branch was updated).
 *
 * So entries now live one-per-file in docs/status/ and are assembled here.
 * These tests guard the two things that matter: the assembled output is
 * exactly what a human would have written, and the ordering is total and
 * deterministic so two branches can never disagree about it.
 */
describe('parseEntryName', () => {
  it('reads the date, sequence and slug out of a filename', () => {
    expect(parseEntryName('2026-09-21-02-t020-companion-logic.md')).toEqual({
      date: '2026-09-21',
      seq: '02',
      slug: 't020-companion-logic',
    });
  });

  it('rejects anything that is not a dated entry, rather than guessing', () => {
    expect(parseEntryName('README.md')).toBeNull();
    expect(parseEntryName('2026-09-21.md')).toBeNull();
    expect(parseEntryName('notes.txt')).toBeNull();
  });
});

describe('formatEntryDate', () => {
  it('renders the short form the log has always used', () => {
    expect(formatEntryDate('2026-09-20')).toBe('20 Sep');
    expect(formatEntryDate('2026-12-14')).toBe('14 Dec');
  });

  it('does not drop the leading zero into a different day', () => {
    expect(formatEntryDate('2026-11-02')).toBe('2 Nov');
  });
});

describe('assembleStatusLog', () => {
  const entry = (name: string, body: string) => ({ name, body });

  it('renders one bullet per entry, continuation lines indented by two', () => {
    const out = assembleStatusLog([
      entry(
        '2026-09-20-01-first.md',
        'Milestone 1 scaffold built (onboarding, check-in),\nand the encrypted DB.',
      ),
    ]);
    expect(out).toBe(
      '- **20 Sep** — Milestone 1 scaffold built (onboarding, check-in),\n  and the encrypted DB.',
    );
  });

  it('orders by date, then sequence, then slug — never by read order', () => {
    const out = assembleStatusLog([
      entry('2026-09-21-03-third.md', 'C'),
      entry('2026-09-20-01-first.md', 'A'),
      entry('2026-09-21-02-second.md', 'B'),
    ]);
    expect(out.split('\n')).toEqual(['- **20 Sep** — A', '- **21 Sep** — B', '- **21 Sep** — C']);
  });

  it('keeps same-day entries in sequence order, not alphabetical by slug', () => {
    // This is the case that made a plain YYYY-MM-DD-slug scheme unusable:
    // the real 21 Sep entries are reconcile, t020, scope — which alphabetical
    // ordering would have silently reshuffled.
    const out = assembleStatusLog([
      entry('2026-09-21-01-reconcile.md', 'reconcile'),
      entry('2026-09-21-03-scope.md', 'scope'),
      entry('2026-09-21-02-t020.md', 't020'),
    ]);
    expect(out).toBe('- **21 Sep** — reconcile\n- **21 Sep** — t020\n- **21 Sep** — scope');
  });

  it('ignores files that are not entries instead of throwing', () => {
    const out = assembleStatusLog([entry('README.md', 'not an entry'), entry('2026-09-20-01-a.md', 'A')]);
    expect(out).toBe('- **20 Sep** — A');
  });

  it('trims trailing whitespace so the output is stable under prettier', () => {
    const out = assembleStatusLog([entry('2026-09-20-01-a.md', 'A\n\n')]);
    expect(out).toBe('- **20 Sep** — A');
  });
});
