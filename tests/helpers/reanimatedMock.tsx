import React from 'react';
import { View } from 'react-native';

/**
 * A small stand-in for react-native-reanimated.
 *
 * Reanimated 4 needs a native worklets runtime, and the mock it ships pulls
 * that runtime in through its own index, so it cannot be used here. This
 * covers only the surface `Companion.tsx` actually touches.
 *
 * Animated styles resolve to their end value immediately, which is what the
 * component tests want: they assert the opacity a given blend produces, not
 * the frames on the way to it. Timing curves and the animation itself are
 * reanimated's job and are not re-tested here.
 */

const passthrough = (value: unknown) => value;

export const withTiming = passthrough;
export const withSpring = passthrough;
export const withDelay = (_delay: number, value: unknown) => value;

const easing = () => (t: number) => t;
export const Easing = {
  ease: easing(),
  linear: easing(),
  inOut: (fn: unknown) => fn,
  out: (fn: unknown) => fn,
  in: (fn: unknown) => fn,
  bezier: () => easing(),
};

export function useSharedValue<T>(initial: T): { value: T } {
  // useState rather than useRef: the value is read during render here, and a
  // ref read during render is exactly what the lint rule forbids.
  const [box] = React.useState(() => ({ value: initial }));
  return box;
}

export function useAnimatedStyle<T>(factory: () => T): T {
  return factory();
}

export function useDerivedValue<T>(factory: () => T): { value: T } {
  return { value: factory() };
}

export const runOnJS =
  (fn: (...args: unknown[]) => unknown) =>
  (...args: unknown[]) =>
    fn(...args);

const AnimatedView = React.forwardRef<View, React.ComponentProps<typeof View>>((props, ref) => (
  <View {...props} ref={ref} />
));
AnimatedView.displayName = 'Animated.View';

export default {
  View: AnimatedView,
  Text: View,
  Image: View,
  ScrollView: View,
  createAnimatedComponent: (C: unknown) => C,
};
