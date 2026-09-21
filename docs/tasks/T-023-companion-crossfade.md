---
id: T-023
title: Cross-fade the companion when the period changes
milestone: W3-4
priority: P1
status: done
cut_candidate: false
blocked_by: T-020
---

# T-023 — Cross-fade the companion when the period changes

Fourth of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

The companion dissolves into the next one instead of snapping, and the
background tint shifts with it. Anyone who has asked their system for less
motion gets an instant switch instead.

## Acceptance criteria

- [x] Two companion images cross-fade using `react-native-reanimated`
- [x] A change while the app is open animates over ~1.5s, ease in-out
- [x] Opening the app **inside** a transition window shows the static blend
      from `companionFor().blend` — no animation replaying on launch
- [x] A soft background tint per period (warm sunrise, bright afternoon, deep
      dusk) fades on the same curve
- [x] **Reduce motion on: switch instantly, no animation, no partial opacity**
- [x] A period change is noticed while the app is open — a timer or
      `AppState` listener, whichever proves reliable — and on resume
- [x] The companion carries an accessible label naming the companion and the
      period
- [x] A companion with no artwork falls back to the blob, including mid-fade.
      **Dusk has art now; Comet, Moss and Blaze have none, so the path is
      still live and is tested with one of them**
- [x] Mood still comes from recent check-ins, independent of period

## Tests to write first

- [x] `tests/component/Companion.test.tsx` — renders both companions during a
      blend, and only one outside a window
- [x] Opacity reflects `blend` for a static mid-window render
- [x] With reduce-motion mocked on, only one companion renders and no
      animation is started
- [x] Accessible label names companion and period
- [x] Falls back to the blob when art is missing, **including during a blend**
- [x] Mood 1 and mood 5 render differently for the same period
- [x] A simulated period change while mounted swaps the companion

## Files likely touched

```
src/components/Companion.tsx        (new — wraps Character)
src/features/home/Home.tsx
src/theme.ts                        (per-period tints)
package.json                        (react-native-reanimated)
tests/component/Companion.test.tsx  (new)
```

## Out of scope

- Breathing / bounce idle animations (T-013)
- Settings (T-024)

## Notes

**Superseded:** on SDK 57 with reanimated 4, `babel-preset-expo` adds
`react-native-worklets/plugin` automatically when the package is installed, so
`babel.config.js` needs no change at all. Adding it will need `jest.config.js` to mock it in the
component project — reanimated ships a mock for exactly this.

Use `AccessibilityInfo.isReduceMotionEnabled()` and subscribe to changes;
someone can turn it on while the app is open.

Check the SDK 57 docs for the supported reanimated version rather than taking
latest: <https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/>

## Blockers

Needs T-020 for `companionFor`.
