---
id: T-020
title: Add time-of-day companion logic to src/domain
milestone: W3-4
priority: P1
status: done
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

- [x] `periodFor(date, settings)` returns `'morning' | 'afternoon' | 'night'`
- [x] `companionFor(date, settings)` returns `{ primary, secondary, blend }`
- [x] `blend` is `0` outside a transition window and rises smoothly to `1`
      across it; `secondary` is the companion being faded **to**
- [x] Default boundaries: morning 05:00–12:00 (Sprout), afternoon 12:00–18:00
      (Ember), night 18:00–05:00 (Dusk)
- [x] The transition window defaults to 30 minutes either side of a boundary
      and is configurable
- [x] Settings carry wake time and bedtime; a wake time later than the morning
      boundary shifts morning to start then
- [x] A pinned companion overrides everything and returns `blend: 0` with
      `secondary` equal to `primary`
- [x] All times read from the **local** clock at the moment of the call. No
      cached offset, no UTC arithmetic, no stored timezone
- [x] `src/domain/index.ts` re-exports it; ESLint's no-React rule still passes
- [x] Coverage on `src/domain` stays at 100%

## Tests to write first

`tests/unit/domain/companion.test.ts`, using `jest.setSystemTime` the way
`streaks.test.ts` does.

- [x] Each period at its middle hour returns the right companion
- [x] Every boundary exactly: 05:00, 12:00, 18:00 — which side does each land
      on? Decide, write it down, assert it
- [x] Midnight wrap: 23:59 and 00:01 are both night, both Dusk
- [x] `blend` is 0 at the centre of a period
- [x] `blend` at the exact window edges is 0 and 1; halfway is ~0.5
- [x] `primary`/`secondary` are the correct way round on both sides of a
      boundary
- [x] A **spring-forward DST day** where 02:00–03:00 does not exist
- [x] An **autumn DST day** where 01:00–02:00 happens twice
- [x] Custom wake time of 09:00 moves the start of morning
- [x] Custom bedtime of 02:00 keeps night running past midnight
- [x] A pinned companion ignores the clock entirely
- [x] Nonsense settings (bedtime before wake time, boundaries out of order) fall
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

## Decisions made here

Both were left open by the task and are now settled in code and tests:

- **A boundary minute belongs to the period it starts.** 12:00 is afternoon,
  11:59:59 is still morning. Asserted at all three boundaries.
- **The fading pair does not swap at the boundary.** `primary` stays the
  outgoing companion for the whole window while `blend` climbs 0 → 1. Swapping
  them at the midpoint would make the cross-fade jump at exactly the moment it
  is meant to be smooth.
- **`bedtime` does not move a boundary.** `wake` extends night until you are
  awake; bedtime is carried for the per-period reminders in T-024. The evening
  before bed is night whichever hour you go to sleep.
- **Window clamping.** A configurable window is clamped to just under half the
  shortest period, so two fades can never overlap and leave the pair ambiguous.

## Read this before T-024

`resolvePeriodSettings` returns the values that will actually be used, including
ones it quietly corrected (an out-of-order boundary set, an implausible awake
span, a pin to a companion that does not exist). The settings screen should show
what came back rather than what was typed, or a corrected value will look like
it was accepted.

## Blockers

None.
