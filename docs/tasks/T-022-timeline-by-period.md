---
id: T-022
title: Group the timeline by day and period
milestone: W3-4
priority: P1
status: done
cut_candidate: false
blocked_by: T-021
---

# T-022 — Group the timeline by day and period

Third of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

The timeline reads as Day → Morning / Afternoon / Night, each section showing
its companion, with filters by period and by life area. This is what "notes
organised by time" actually looks like to the person using it.

## Acceptance criteria

- [x] Entries group under a day heading, then a period sub-heading, in the
      order Morning, Afternoon, Night
- [x] Each period sub-heading shows that period's companion
- [x] A period with no entries is not rendered as an empty section
- [x] Filter by period (one, several, or all)
- [x] Filter by life area, combinable with the period filter
- [x] Filters read as a view, not a judgement — no empty-state text implying
      a gap is a failure
- [x] Every section has an accessible label naming the period
- [x] Period is never conveyed by colour alone
- [x] Search respects the active filters

## Tests to write first

- [x] `tests/unit/domain/grouping.test.ts` — the grouping is pure logic and
      belongs in `domain`: entries in, grouped structure out
- [x] Ordering: periods always Morning, Afternoon, Night regardless of insert
      order
- [x] A day with entries in only one period renders one section
- [x] Period filter narrows correctly; combined with a life-area filter,
      narrows on both
- [x] Clearing filters restores everything
- [x] `tests/component/Timeline.test.tsx` — headings render, each carries an
      accessible label
- [x] An entry from before the migration (period backfilled) still groups

## Files likely touched

```
src/domain/grouping.ts              (new — pure)
src/features/timeline/Timeline.tsx
tests/unit/domain/grouping.test.ts  (new)
tests/component/Timeline.test.tsx   (new)
```

## Out of scope

- Cross-fade animation (T-023)
- Settings for boundaries (T-024)

## Notes

Put the grouping in `src/domain`, not in the screen. It is the part worth
testing and the part most likely to be reused by search.

Timeline currently loads data in an effect without cancelling — T-014 covers
that. If this task touches the same lines, do T-014 first.

## Blockers

None. T-021 landed the stored period, which unblocked this.
