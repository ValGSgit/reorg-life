import { contrastRatio, meetsAA, relativeLuminance } from '../../../src/domain';

/**
 * WCAG contrast, computed rather than asserted from a table.
 *
 * The palette test next door leans on this, so it has to be right for its own
 * reasons first: a contrast function that is quietly wrong would let the
 * palette test pass while the app stayed unreadable.
 */
describe('relativeLuminance', () => {
  it('runs from 0 at black to 1 at white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('weights green above red above blue, as the eye does', () => {
    const red = relativeLuminance('#FF0000');
    const green = relativeLuminance('#00FF00');
    const blue = relativeLuminance('#0000FF');
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
  });

  it('reads short hex and is not case sensitive', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#FFFFFF'), 5);
    expect(relativeLuminance('#6c8ebf')).toBeCloseTo(relativeLuminance('#6C8EBF'), 5);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white, the maximum', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('is 1 for a colour on itself', () => {
    expect(contrastRatio('#6C8EBF', '#6C8EBF')).toBeCloseTo(1, 5);
  });

  it('does not care which way round the pair is given', () => {
    expect(contrastRatio('#2B2A33', '#F7F4EF')).toBeCloseTo(contrastRatio('#F7F4EF', '#2B2A33'), 5);
  });

  it('agrees with the measurements recorded in the task', () => {
    // T-033 measured these on 20 September against the palette of the day.
    // If this drifts, the contrast maths is wrong, not the palette.
    expect(contrastRatio('#FFFFFF', '#6C8EBF')).toBeCloseTo(3.36, 1);
    expect(contrastRatio('#7DB88B', '#FFFFFF')).toBeCloseTo(2.31, 1);
    expect(contrastRatio('#2B2A33', '#F7F4EF')).toBeCloseTo(12.92, 1);
  });
});

describe('meetsAA', () => {
  it('wants 4.5 for normal text and 3 for large', () => {
    // 3.36 is the old accent: large-text pass, normal-text fail. That gap is
    // the entire reason this task exists.
    expect(meetsAA(3.36)).toBe(false);
    expect(meetsAA(3.36, 'large')).toBe(true);
    expect(meetsAA(4.5)).toBe(true);
    expect(meetsAA(4.49)).toBe(false);
  });
});
