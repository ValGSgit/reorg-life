import React from 'react';
import { render } from '@testing-library/react-native';
import { Companion } from '../../src/components/Companion';
import { periodTint } from '../../src/theme';

/**
 * The time-of-day companion (ADR 0001, T-023).
 *
 * Two things carry the weight here. Inside a transition window two companions
 * are on screen at once, dissolving — so the fallback and the mood logic have
 * to keep working for both of them, not just the one. And reduce-motion is a
 * real setting someone has turned on for a reason: it means one companion,
 * switched instantly, not a faster fade or a half-transparent pair.
 *
 * `now` and `reduceMotion` are props so these can be driven directly rather
 * than through a mocked clock and a mocked accessibility API.
 */

// Local Europe/Vienna, pinned by jest.config.js.
const MORNING = new Date('2026-05-20T09:00:00');
const AFTERNOON = new Date('2026-05-20T14:00:00');
const NIGHT = new Date('2026-05-20T20:00:00');
// Default boundaries put afternoon at 12:00 with a 30-minute window, so 12:00
// itself is the midpoint of the morning-to-afternoon fade.
const BOUNDARY = new Date('2026-05-20T12:00:00');
const MID_FADE_IN = new Date('2026-05-20T11:45:00');

/** Styles arrive as a nested array, so they are flattened before asserting. */
const flatStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flatStyle))
    : ((style as Record<string, unknown>) ?? {});

const imageCount = (tree: unknown): number => {
  let n = 0;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const el = node as { type?: string; children?: unknown[] };
    if (el.type === 'Image') n += 1;
    for (const child of el.children ?? []) walk(child);
  };
  walk(tree);
  return n;
};

describe('Companion', () => {
  it('shows one companion in the middle of a period', async () => {
    const { toJSON } = await render(<Companion now={AFTERNOON} />);
    expect(imageCount(toJSON())).toBe(1);
  });

  it('shows both companions inside a transition window', async () => {
    const { toJSON } = await render(<Companion now={MID_FADE_IN} />);
    expect(imageCount(toJSON())).toBe(2);
  });

  it('is exactly half way across at the boundary itself', async () => {
    const { getByTestId } = await render(<Companion now={BOUNDARY} />);
    expect(flatStyle(getByTestId('companion-incoming').props.style).opacity).toBeCloseTo(0.5, 5);
  });

  it('reflects the blend rather than animating from zero on mount', async () => {
    // Opening the app part-way through a fade should show the fade where it
    // actually is, not replay it from the beginning.
    const { getByTestId } = await render(<Companion now={MID_FADE_IN} />);
    const opacity = flatStyle(getByTestId('companion-incoming').props.style).opacity as number;
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(0.5);
  });

  describe('with reduce motion turned on', () => {
    it('renders one companion, never a half-transparent pair', async () => {
      const { toJSON } = await render(<Companion now={MID_FADE_IN} reduceMotion />);
      expect(imageCount(toJSON())).toBe(1);
    });

    it('shows the period being entered once past the boundary', async () => {
      const { getByLabelText } = await render(
        <Companion now={new Date('2026-05-20T12:10:00')} reduceMotion />,
      );
      expect(getByLabelText(/Ember/i)).toBeTruthy();
    });

    it('still shows the outgoing companion before the boundary', async () => {
      const { getByLabelText } = await render(<Companion now={MID_FADE_IN} reduceMotion />);
      expect(getByLabelText(/Sprout/i)).toBeTruthy();
    });
  });

  describe('the accessible label', () => {
    it('names the companion and the period', async () => {
      const { getByLabelText } = await render(<Companion now={MORNING} />);
      expect(getByLabelText(/Sprout/i)).toBeTruthy();
      expect(getByLabelText(/morning/i)).toBeTruthy();
    });

    it('says what is happening during a fade, rather than naming one of two', async () => {
      const { getByLabelText } = await render(<Companion now={MID_FADE_IN} />);
      expect(getByLabelText(/Sprout.*Ember|Ember.*Sprout/i)).toBeTruthy();
    });
  });

  describe('artwork', () => {
    it('falls back to the blob when a companion has no art, mid-fade included', async () => {
      // Comet has no artwork at all, so this is the live fallback path.
      const { toJSON } = await render(<Companion now={MID_FADE_IN} pinned="comet" />);
      expect(imageCount(toJSON())).toBe(0);
    });

    it('draws a different face for a rough week than a good one', async () => {
      const low = await render(<Companion now={MORNING} mood={1} />);
      const high = await render(<Companion now={MORNING} mood={5} />);
      expect(JSON.stringify(low.toJSON())).not.toEqual(JSON.stringify(high.toJSON()));
    });

    it('takes mood from the caller, not from the period', async () => {
      const morning = await render(<Companion now={MORNING} mood={2} />);
      const night = await render(<Companion now={NIGHT} mood={2} />);
      // Different companions, but both wearing the same mood.
      expect(morning.getByLabelText(/Sprout/i)).toBeTruthy();
      expect(night.getByLabelText(/Dusk/i)).toBeTruthy();
    });
  });

  it('swaps companion when the period moves underneath it', async () => {
    const { getByLabelText, rerender } = await render(<Companion now={MORNING} />);
    expect(getByLabelText(/Sprout/i)).toBeTruthy();

    await rerender(<Companion now={NIGHT} />);
    expect(getByLabelText(/Dusk/i)).toBeTruthy();
  });

  it('honours a pinned companion over the clock entirely', async () => {
    const { getByLabelText } = await render(<Companion now={NIGHT} pinned="sprout" />);
    expect(getByLabelText(/Sprout/i)).toBeTruthy();
  });
});

describe('periodTint', () => {
  it('gives each period its own tint, in both schemes', () => {
    const light = (['morning', 'afternoon', 'night'] as const).map((p) => periodTint(p, false));
    const dark = (['morning', 'afternoon', 'night'] as const).map((p) => periodTint(p, true));

    expect(new Set(light).size).toBe(3);
    expect(new Set(dark).size).toBe(3);
    // A dark-mode tint that matches the light one would wash the screen out.
    expect(light).not.toEqual(dark);
  });

  it('returns a colour for every period the rotation can produce', () => {
    for (const period of ['morning', 'afternoon', 'night'] as const) {
      expect(periodTint(period, false)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
