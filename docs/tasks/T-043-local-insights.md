---
id: T-043
title: Local insights — mood over time, by period, by life area, habit consistency
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-043 — Local insights

## Goal

Show people their own patterns, computed on the device, transmitted nowhere.

This is the feature that beats a paper notebook, and it is the reason someone
tells a friend about the app. **It is free, permanently** — see
[ADR 0006](../DECISIONS/0006-monetisation.md). Charging for it would be
charging for the only organic growth loop the project has.

## Acceptance criteria

- [ ] Mood over time
- [ ] Mood by period — the question ADR 0001's period model exists to answer,
      and the one a competitor grouping only by day cannot
- [ ] Mood by life area
- [ ] Habit consistency, shown without a streak-pressure framing
- [ ] Every figure computed on device from the local database. **No network
      call of any kind**
- [ ] Readable in both light and dark, and at phone width
- [ ] Colour is never the only carrier of meaning
- [ ] A sparse or empty history renders calmly and says something kind, not
      "no data"
- [ ] No outcome or symptom claim anywhere in the copy — see the medical-claim
      rule in AGENTS.md

## Tests to write first

- [ ] Aggregation is pure logic in `src/domain/insights.ts`, tested in plain
      Node: empty history, one entry, a single period only, a life area with
      no entries, and a month that crosses a DST boundary
- [ ] A day with three check-ins is counted once where the chart is per-day
- [ ] Component test: the screen renders with demo data and with none

## Files likely touched

```
src/domain/insights.ts          (new, pure)
src/features/insights/          (new)
tests/unit/domain/insights.test.ts
tests/component/Insights.test.tsx
```

## Out of scope

Export of charts as images. Post-launch.

## Notes

The aggregation belongs in `src/domain` with no React or Expo imports, like
`streaks.ts` and `companion.ts`. Date bucketing across DST is the case that is
cheap to test and expensive to debug on a device.

Use the session's dataviz guidance for the chart design if it is offered.
Tone matters as much here as anywhere: a quiet month is information, not a
failure, and the empty state is the screen most likely to be seen on a bad day.
