/**
 * WCAG contrast, so the palette can be measured rather than guessed at.
 *
 * Pure arithmetic on hex strings: no React, no Expo, no colour library. The
 * formulas are from WCAG 2.1 — relative luminance (1.4.3) and the contrast
 * ratio built from it.
 */

/** #rgb or #rrggbb to three 0-255 channels. */
function channels(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/**
 * Relative luminance: 0 for black, 1 for white.
 *
 * The per-channel curve undoes sRGB's gamma encoding, and the weights are the
 * eye's own — green carries most of the perceived brightness, blue almost
 * none. This is why darkening a blue for contrast moves the ratio far less
 * than darkening a green does.
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast between two colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Whether a ratio clears WCAG AA.
 *
 * "Large" is 18.66px bold or 24px regular and upwards. Most text in this app
 * is neither, so `normal` is the default and the one that matters.
 */
export const meetsAA = (ratio: number, size: 'normal' | 'large' = 'normal'): boolean =>
  ratio >= (size === 'large' ? 3 : 4.5);
