---
id: T-014
title: Make screen data loading cancel-safe and re-enable the lint rule
milestone: W3-4
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-014 — Make screen data loading cancel-safe

## Goal

Four screens load data with an async `useCallback` called from an effect, and
none of them cancel on unmount. If a screen is left before its query finishes,
it calls `setState` on an unmounted component.

`react-hooks/set-state-in-effect` is currently switched **off** for
`src/features/**` because of this. This task fixes the cause and turns it back
on.

## Acceptance criteria

- [ ] Home, Habits, Timeline and Settings each cancel their in-flight load on
      unmount
- [ ] No `setState` after unmount, under any navigation order
- [ ] The `react-hooks/set-state-in-effect` override is **removed** from
      `eslint.config.js`, and `npm run lint` passes without it
- [ ] Refresh-on-change still works: ticking a habit still updates Home
- [ ] No other visible behaviour change

## Tests to write first

Write these before touching the screens. They must fail first.

- [ ] Mount a screen, unmount before its promise resolves, assert no state
      update warning is emitted
- [ ] Each of the four screens still renders its data once loaded
- [ ] `refreshKey` still triggers a reload
- [ ] A rejected query leaves the screen usable rather than blank

## Files likely touched

```
src/features/home/Home.tsx
src/features/habits/Habits.tsx
src/features/timeline/Timeline.tsx
src/features/settings/Settings.tsx
eslint.config.js                  (remove the override)
tests/component/                  (new)
```

## Out of scope

Any change to what the screens display. This is about when state is set, not
what is in it.

## Notes

The lint override in `eslint.config.js` names this task. Removing it is part
of finishing — leaving it means the next person inherits the same blind spot.

Likely shape:

```tsx
useEffect(() => {
  let alive = true;
  (async () => {
    const data = await load();
    if (alive) setState(data);
  })();
  return () => {
    alive = false;
  };
}, [deps]);
```

A shared `useLoader` hook would suit all four, but only if it does not make
the cancellation harder to see at the call site.

## Blockers

None. Worth doing before T-022, which touches Timeline.
