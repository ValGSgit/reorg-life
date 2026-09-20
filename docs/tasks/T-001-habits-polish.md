---
id: T-001
title: Polish habits — edit, reorder and an archive view
milestone: W3-4
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-001 — Polish habits: edit, reorder and an archive view

## Goal

A habit can be changed after it is created. Today the only options are "put
aside" and "delete", so a typo in a habit's name costs you its history.

## Acceptance criteria

- [ ] Tapping a habit opens an editor for title, life area, schedule and
      reminder time
- [ ] Editing a habit keeps its logs and its streak
- [ ] Habits can be reordered, and the order persists
- [ ] An archive view lists put-aside habits and can restore one
- [ ] Restoring brings back its history; the gentle streak resumes from the
      real log rather than restarting at zero
- [ ] Deleting still asks first, and says plainly that history goes with it
- [ ] Changing a reminder time reschedules it; clearing the time unschedules

## Tests to write first

- [ ] `updateHabit` preserves logs when the schedule changes
- [ ] Reordering persists across a reload
- [ ] Archive then restore leaves the streak intact
- [ ] Setting `remind_at` schedules; clearing it cancels
- [ ] `tests/component/Habits.test.tsx` — the editor opens populated with the
      habit's current values

## Files likely touched

```
src/db/schema.ts        (sort_order column + migration)
src/db/repo.ts
src/features/habits/
tests/
```

## Out of scope

Per-period habits. That follows the time-of-day work, not this task.

## Blockers

None.
