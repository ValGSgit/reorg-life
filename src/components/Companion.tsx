import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Character } from './Character';
import {
  CHARACTERS,
  NO_ITEM,
  companionFor,
  periodFor,
  periodLabel,
  type CharacterId,
  type PeriodSettings,
  type Unlockable,
} from '../domain';

/** How long a companion takes to dissolve into the next one (ADR 0001). */
export const CROSSFADE_MS = 1500;

/** How often the clock is re-read while the app is open. */
const TICK_MS = 30_000;

type Props = {
  mood?: number;
  size?: number;
  item?: Unlockable;
  settings?: Partial<PeriodSettings>;
  /** Keeps one companion all day, ignoring the clock. */
  pinned?: CharacterId | null;
  /** Injected by tests and previews; otherwise the real clock, re-read on a timer. */
  now?: Date;
  /** Injected by tests; otherwise read from the OS and watched for changes. */
  reduceMotion?: boolean;
};

const nameOf = (id: CharacterId): string => CHARACTERS.find((c) => c.id === id)?.name ?? id;
const bodyOf = (id: CharacterId): string => CHARACTERS.find((c) => c.id === id)?.body ?? '#9DB8F0';

/**
 * Watches the OS reduce-motion setting, which someone can turn on while the
 * app is open — so it is subscribed to rather than read once.
 */
function useReduceMotion(override?: boolean): boolean {
  const [enabled, setEnabled] = useState(override ?? false);

  useEffect(() => {
    if (override !== undefined) return;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setEnabled(v))
      // An unavailable accessibility API must not take the screen down. The
      // safe default is to animate, which is what the app does anyway.
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setEnabled);
    return () => {
      alive = false;
      sub.remove();
    };
  }, [override]);

  return override ?? enabled;
}

/** Re-reads the clock on a timer so a period change is noticed while on screen. */
function useNow(override?: Date): Date {
  const [now, setNow] = useState(() => override ?? new Date());

  useEffect(() => {
    if (override) return;
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [override]);

  return override ?? now;
}

/**
 * The companion for the time of day, dissolving into the next one.
 *
 * Inside a transition window both companions are drawn, the outgoing one
 * underneath and the incoming one fading in over it. `companionFor` keeps the
 * pair stable for the whole window — the two do not swap over at the midpoint
 * — so the fade never jumps.
 *
 * On mount it shows the blend where it actually is rather than replaying the
 * fade from the start: opening the app at 11:50 should look like ten minutes
 * before noon, not like the morning beginning again.
 */
export function Companion({
  mood = 3,
  size = 160,
  item = NO_ITEM,
  settings = {},
  pinned = null,
  now: nowProp,
  reduceMotion: reduceMotionProp,
}: Props) {
  const now = useNow(nowProp);
  const reduceMotion = useReduceMotion(reduceMotionProp);

  const { primary, secondary, blend } = companionFor(now, { ...settings, pinnedCompanion: pinned });
  const period = periodFor(now, settings);

  const progress = useSharedValue(blend);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // First paint: land on the current blend without animating to it.
      mounted.current = true;
      progress.value = blend;
      return;
    }
    progress.value = reduceMotion
      ? blend
      : withTiming(blend, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.ease) });
  }, [blend, reduceMotion, progress]);

  const incomingStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const outgoingStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  const fading = !reduceMotion && primary !== secondary && blend > 0;

  // With reduce motion on there is no fade at all, so one companion is drawn:
  // whichever one the clock has actually arrived at.
  const solo = blend >= 0.5 ? secondary : primary;

  const label = fading
    ? `${nameOf(primary)} turning into ${nameOf(secondary)}, ${periodLabel(period).toLowerCase()}`
    : `${nameOf(solo)}, ${periodLabel(period).toLowerCase()}`;

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="image"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {fading ? (
        <>
          <Animated.View testID="companion-outgoing" style={[{ position: 'absolute' }, outgoingStyle]}>
            <Character id={primary} color={bodyOf(primary)} mood={mood} size={size} item={item} />
          </Animated.View>
          <Animated.View testID="companion-incoming" style={[{ position: 'absolute' }, incomingStyle]}>
            <Character id={secondary} color={bodyOf(secondary)} mood={mood} size={size} item={item} />
          </Animated.View>
        </>
      ) : (
        <Character id={solo} color={bodyOf(solo)} mood={mood} size={size} item={item} />
      )}
    </View>
  );
}
