import React from 'react';
import { render } from '@testing-library/react-native';
import { Character } from '../../src/components/Character';
import { NO_ITEM, UNLOCKABLES } from '../../src/domain';

/**
 * The fallback path matters more than it looks: Comet, Moss and Blaze still
 * have no artwork, so the blob is what people actually see for them. A
 * regression here is a blank space where the companion should be.
 *
 * `render` is asynchronous in React Native Testing Library 14, and the
 * UNSAFE_*ByType queries are gone, so these assert against the rendered tree.
 */

type Json = { type?: string; children?: unknown[] } | null;

/** Counts nodes of a given host type anywhere in the rendered tree. */
function countType(node: unknown, type: string): number {
  if (!node || typeof node !== 'object') return 0;
  const n = node as Json & { children?: unknown[] };
  const self = n.type === type ? 1 : 0;
  const kids = Array.isArray(n.children) ? n.children : [];
  return self + kids.reduce<number>((total, child) => total + countType(child, type), 0);
}

describe('Character', () => {
  it('renders without artwork, falling back to the blob', async () => {
    const { toJSON } = await render(<Character id="comet" color="#9DB8F0" mood={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders an image when artwork is supplied', async () => {
    const { toJSON } = await render(
      <Character id="sprout" color="#A8D5BA" mood={4} image={{ uri: 'https://example.test/x.png' }} />,
    );
    expect(countType(toJSON(), 'Image')).toBeGreaterThan(0);
  });

  it('draws no image at all when it has fallen back to the blob', async () => {
    const { toJSON } = await render(<Character id="comet" color="#9DB8F0" mood={3} />);
    expect(countType(toJSON(), 'Image')).toBe(0);
  });

  it('draws an image for a companion that now has art', async () => {
    const { toJSON } = await render(<Character id="dusk" color="#C4A8E0" mood={3} />);
    expect(countType(toJSON(), 'Image')).toBeGreaterThan(0);
  });

  it('renders every mood without throwing', async () => {
    for (const mood of [1, 2, 3, 4, 5]) {
      const { toJSON } = await render(<Character id="ember" color="#F4A97F" mood={mood} />);
      expect(toJSON()).toBeTruthy();
    }
  });

  it('renders every unlockable accessory without throwing', async () => {
    for (const item of UNLOCKABLES) {
      const { toJSON } = await render(<Character id="sprout" color="#A8D5BA" mood={3} item={item} />);
      expect(toJSON()).toBeTruthy();
    }
  });

  it('treats no accessory as a valid state rather than an error', async () => {
    const withNothing = (
      await render(<Character id="sprout" color="#A8D5BA" mood={3} item={NO_ITEM} />)
    ).toJSON();
    const withDefault = (await render(<Character id="sprout" color="#A8D5BA" mood={3} />)).toJSON();
    expect(withNothing).toEqual(withDefault);
  });
});
