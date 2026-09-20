---
id: T-025
title: End-to-end tests for each period using a mocked clock
milestone: W3-4
priority: P2
status: todo
cut_candidate: false
blocked_by: T-023
---

# T-025 — End-to-end tests for each period using a mocked clock

Last of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

CI proves the right companion appears at the right time of day, without
anyone waiting until 6pm to find out.

## Acceptance criteria

- [ ] Playwright's clock API fixes the time before the app loads
- [ ] One assertion per period: morning shows Sprout, afternoon Ember, night
      Dusk
- [ ] A time inside a transition window shows both companions
- [ ] Advancing the clock across a boundary while the page is open swaps the
      companion without a reload
- [ ] A run with reduce-motion emulated still shows the right companion
- [ ] The existing critical-flow test still passes unchanged
- [ ] The suite stays under about five minutes in CI

## Tests to write first

`tests/e2e/time-of-day.spec.ts`.

- [ ] `page.clock.setFixedTime()` at 08:00 → Sprout
- [ ] 14:00 → Ember
- [ ] 21:00 → Dusk
- [ ] 23:30 and 02:00 → both Dusk (midnight wrap through the real UI)
- [ ] 11:45 (inside the morning→afternoon window) → both visible
- [ ] `page.clock.fastForward()` across 12:00 with the page open → swaps
- [ ] With `prefers-reduced-motion: reduce`, the right companion still shows

## Files likely touched

```
tests/e2e/time-of-day.spec.ts   (new)
playwright.config.ts            (maybe a reduce-motion project)
```

## Out of scope

- Unit-level boundary maths — that is T-020, and it belongs there. These
  tests check the wiring, not the arithmetic

## Notes

Install the clock **before** `page.goto`, or the app will already have read
the real time.

Emulate reduce motion with Playwright's `reducedMotion: 'reduce'` context
option rather than poking at CSS.

Keep this to wiring. Duplicating T-020's matrix at e2e speed would cost
minutes per run and find nothing new.

## Blockers

Needs T-023.
