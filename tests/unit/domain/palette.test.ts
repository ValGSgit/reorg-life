import { CHARACTERS, DOMAINS, DARK, LIGHT, PERIOD_TINTS, contrastRatio, meetsAA } from '../../../src/domain';

/**
 * Every colour pair the app actually puts on screen, measured (T-033).
 *
 * Ratios are computed, never written down: a table of expected numbers goes
 * stale the moment somebody nudges a colour, and then the test agrees with
 * itself while the screen is unreadable.
 *
 * Both themes are asserted, so this catches a future change to either.
 */

const THEMES = [
  ['light', LIGHT],
  ['dark', DARK],
] as const;

/** Text pairs: foreground, background, and where it appears. */
const textPairs = (t: typeof LIGHT) => [
  [t.text, t.bg, 'body text on the page'],
  [t.text, t.card, 'body text on a card'],
  [t.sub, t.bg, 'muted text on the page'],
  [t.sub, t.card, 'muted text on a card'],
  [t.accent, t.bg, 'accent text on the page'],
  [t.accent, t.card, 'accent text on a card'],
  [t.buttonText, t.accent, 'label on the primary button'],
  [t.good, t.card, 'streak and progress text on a card'],
  [t.good, t.bg, 'streak and progress text on the page'],
];

describe.each(THEMES)('%s theme text', (name, theme) => {
  it.each(textPairs(theme))('%s on %s — %s — meets AA', (fg, bg, where) => {
    const ratio = contrastRatio(fg, bg);
    // The message carries the number, so a failure says how far off it is.
    expect(`${where}: ${ratio.toFixed(2)}`).toBe(
      `${where}: ${meetsAA(ratio) ? ratio.toFixed(2) : 'needs at least 4.50'}`,
    );
  });

  it('keeps the page and card backgrounds distinguishable', () => {
    expect(contrastRatio(theme.bg, theme.card)).toBeGreaterThan(1.01);
  });
});

/**
 * Non-text things that carry meaning need 3:1, not 4.5:1 (WCAG 1.4.11).
 * The life-area colours are the timeline's filter chips and dots: they are
 * how someone tells one area from another, so they have to be visible.
 */
describe.each(THEMES)('%s theme life-area colours', (name, theme) => {
  it.each(DOMAINS.map((d) => [d.id, d.color]))('%s is visible on a card', (id, color) => {
    expect(`${id}: ${contrastRatio(color, theme.card).toFixed(2)}`).toBe(
      `${id}: ${contrastRatio(color, theme.card) >= 3 ? contrastRatio(color, theme.card).toFixed(2) : 'needs at least 3.00'}`,
    );
  });

  it('gives every life area a colour of its own', () => {
    expect(new Set(DOMAINS.map((d) => d.color)).size).toBe(DOMAINS.length);
  });
});

/**
 * The period tints sit behind ordinary text, so text has to stay readable on
 * them — a wash that looks pleasant and drops the body text below AA is worse
 * than no wash at all.
 */
describe('period tints', () => {
  const periods = Object.keys(PERIOD_TINTS) as (keyof typeof PERIOD_TINTS)[];

  it.each(periods)('%s keeps light-theme text readable', (period) => {
    const ratio = contrastRatio(LIGHT.text, PERIOD_TINTS[period].light);
    expect(`${period}: ${ratio.toFixed(2)}`).toBe(
      `${period}: ${meetsAA(ratio) ? ratio.toFixed(2) : 'needs at least 4.50'}`,
    );
  });

  it.each(periods)('%s keeps dark-theme text readable', (period) => {
    const ratio = contrastRatio(DARK.text, PERIOD_TINTS[period].dark);
    expect(`${period}: ${ratio.toFixed(2)}`).toBe(
      `${period}: ${meetsAA(ratio) ? ratio.toFixed(2) : 'needs at least 4.50'}`,
    );
  });

  it('keeps muted text readable on a tint too', () => {
    for (const period of periods) {
      expect(meetsAA(contrastRatio(LIGHT.sub, PERIOD_TINTS[period].light))).toBe(true);
      expect(meetsAA(contrastRatio(DARK.sub, PERIOD_TINTS[period].dark))).toBe(true);
    }
  });
});

/**
 * Companion bodies are illustration, not information: the app never asks
 * anyone to read a value from them, and the name is always written alongside.
 * WCAG does not set a ratio for decorative images, so this only checks they
 * are distinguishable from the surface they sit on — a companion that
 * disappears into the card is a drawing bug, not a contrast failure.
 */
describe('companion body colours', () => {
  it.each(CHARACTERS.map((c) => [c.id, c.body]))('%s is visible against a card', (id, body) => {
    expect(contrastRatio(body, LIGHT.card)).toBeGreaterThan(1.2);
    expect(contrastRatio(body, DARK.card)).toBeGreaterThan(1.2);
  });
});
