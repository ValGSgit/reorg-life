---
id: T-020
title: Add time-of-day companion logic to src/domain
milestone: W3-4
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-020 — Add time-of-day companion logic to src/domain

First of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

`src/domain/companion.ts` can answer, for any moment and any settings, which
period it is and which companion or pair of companions to show. Pure logic, no
React, fully unit-tested — so that every later task in this set builds on
something already proven correct.

Nothing renders differently yet. That is deliberate: the hard part here is the
clock arithmetic, and it is far cheaper to get it right in a test than on a
device at 5am during a DST change.

## Acceptance criteria

- [ ] `periodFor(date, settings)` returns `'morning' | 'afternoon' | 'night'`
- [ ] `companionFor(date, settings)` returns `{ primary, secondary, blend }`
- [ ] `blend` is `0` outside a transition window and rises smoothly to `1`
      across it; `secondary` is the companion being faded **to**
- [ ] Default boundaries: morning 05:00–12:00 (Sprout), afternoon 12:00–18:00
      (Ember), night 18:00–05:00 (Dusk)
- [ ] The transition window defaults to 30 minutes either side of a boundary
      and is configurable
- [ ] Settings carry wake time and bedtime; a wake time later than the morning
      boundary shifts morning to start then
- [ ] A pinned companion overrides everything and returns `blend: 0` with
      `secondary` equal to `primary`
- [ ] All times read from the **local** clock at the moment of the call. No
      cached offset, no UTC arithmetic, no stored timezone
- [ ] `src/domain/index.ts` re-exports it; ESLint's no-React rule still passes
- [ ] Coverage on `src/domain` stays at 100%

## Tests to write first

`tests/unit/domain/companion.test.ts`, using `jest.setSystemTime` the way
`streaks.test.ts` does.

- [ ] Each period at its middle hour returns the right companion
- [ ] Every boundary exactly: 05:00, 12:00, 18:00 — which side does each land
      on? Decide, write it down, assert it
- [ ] Midnight wrap: 23:59 and 00:01 are both night, both Dusk
- [ ] `blend` is 0 at the centre of a period
- [ ] `blend` at the exact window edges is 0 and 1; halfway is ~0.5
- [ ] `primary`/`secondary` are the correct way round on both sides of a
      boundary
- [ ] A **spring-forward DST day** where 02:00–03:00 does not exist
- [ ] An **autumn DST day** where 01:00–02:00 happens twice
- [ ] Custom wake time of 09:00 moves the start of morning
- [ ] Custom bedtime of 02:00 keeps night running past midnight
- [ ] A pinned companion ignores the clock entirely
- [ ] Nonsense settings (bedtime before wake time, boundaries out of order) fall
      back to defaults rather than throwing

## Files likely touched

```
src/domain/companion.ts          (new)
src/domain/index.ts              (re-export)
tests/unit/domain/companion.test.ts (new)
```

## Out of scope

- Rendering, animation, settings UI (T-023, T-024)
- The database `period` column (T-021)
- Reminder copy (T-024)

## Notes

Test DST by constructing dates in a fixed zone via `TZ=Europe/Vienna` on the
Jest project, or by picking dates and asserting on local getters — but do
assert it. "Reads local time at the moment of use" is the whole correctness
argument in ADR 0001, and an untested claim is not a guarantee.

Human avatars (Alex, Jo) are **not** part of the rotation.

## Blockers

None.
