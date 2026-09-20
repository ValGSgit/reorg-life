---
id: T-023
title: Cross-fade the companion when the period changes
milestone: W3-4
priority: P1
status: todo
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

- [ ] Two companion images cross-fade using `react-native-reanimated`
- [ ] A change while the app is open animates over ~1.5s, ease in-out
- [ ] Opening the app **inside** a transition window shows the static blend
      from `companionFor().blend` — no animation replaying on launch
- [ ] A soft background tint per period (warm sunrise, bright afternoon, deep
      dusk) fades on the same curve
- [ ] **Reduce motion on: switch instantly, no animation, no partial opacity**
- [ ] A period change is noticed while the app is open — a timer or
      `AppState` listener, whichever proves reliable — and on resume
- [ ] The companion carries an accessible label naming the companion and the
      period
- [ ] A companion with no artwork falls back to the blob, including mid-fade.
      **Dusk has no usable art, so this path is live**
- [ ] Mood still comes from recent check-ins, independent of period

## Tests to write first

- [ ] `tests/component/Companion.test.tsx` — renders both companions during a
      blend, and only one outside a window
- [ ] Opacity reflects `blend` for a static mid-window render
- [ ] With reduce-motion mocked on, only one companion renders and no
      animation is started
- [ ] Accessible label names companion and period
- [ ] Falls back to the blob when art is missing, **including during a blend**
- [ ] Mood 1 and mood 5 render differently for the same period
- [ ] A simulated period change while mounted swaps the companion

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

`react-native-reanimated` needs its Babel plugin, and `babel.config.js` must
list it **last**. Adding it will need `jest.config.js` to mock it in the
component project — reanimated ships a mock for exactly this.

Use `AccessibilityInfo.isReduceMotionEnabled()` and subscribe to changes;
someone can turn it on while the app is open.

Check the SDK 57 docs for the supported reanimated version rather than taking
latest: <https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/>

## Blockers

Needs T-020 for `companionFor`.
