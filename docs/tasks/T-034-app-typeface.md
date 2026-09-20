---
id: T-034
title: Decide and wire the app typeface
milestone: W5-6
priority: P3
status: todo
cut_candidate: true
blocked_by: null
---

# T-034 — Decide and wire the app typeface

## Goal

The app renders in one deliberate typeface rather than whatever the platform
supplies.

## Context

The design mockups set **Figtree** on 334 elements. The app has no custom font
at all — the only `fontFamily` in `src/` is the monospace used for the
recovery key. So the mockups and the build do not currently look alike, and
the difference is not small.

## Acceptance criteria

- [ ] A decision recorded: ship Figtree, or keep the system font and update
      the mockups to match
- [ ] If shipping it: loaded with `expo-font`, bundled rather than fetched at
      runtime — the app makes no network requests
- [ ] Only the weights actually used are bundled, and the bundle-size cost is
      measured and written down
- [ ] Text still renders while the font loads; no invisible-text flash
- [ ] Falls back cleanly if loading fails
- [ ] **The licence is recorded in `docs/LICENSES.md`.** Figtree is OFL, which
      permits bundling, but it needs stating like every other dependency
- [ ] The monospace used for the recovery key is reviewed at the same time

## Tests to write first

- [ ] Screens render with the font unavailable — no crash, no blank text
- [ ] A test asserting the font files exist if they are referenced, so a
      missing file fails a test rather than the Metro build

## Files likely touched

```
App.tsx              (font loading)
src/theme.ts         (a type scale)
assets/fonts/        (new)
docs/LICENSES.md
package.json         (expo-font)
```

## Out of scope

The type scale itself belongs with the design-system work.

## Notes

Cut candidate. A system font is perfectly respectable and costs nothing; this
is polish, and the closed test does not depend on it. If the schedule tightens
before 2 November, drop it and update the mockups instead.

## Blockers

None.
