---
id: T-021
title: Store a period on check-ins and events
milestone: W3-4
priority: P1
status: done
cut_candidate: false
blocked_by: T-020
---

# T-021 — Store a period on check-ins and events

Second of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

Check-ins and timeline entries carry the period they happened in, so the
timeline can group by it without recomputing for every row — while the raw
timestamp stays authoritative, so the period can be recomputed if someone
changes their boundaries.

This also changes the check-in rule from one per day to one per period, up to
three a day.

## Acceptance criteria

- [x] Migration 3 adds `period TEXT` to `checkins` and `events`, raising
      `LATEST_VERSION`
- [x] Existing rows are backfilled from their timestamp, not left null
- [x] `checkins` allows **one row per period per day** (the old one-per-day
      unique constraint has to change)
- [x] The raw timestamp is still stored and still authoritative
- [x] `recomputePeriods(settings)` re-derives every stored period from its
      timestamp, for when boundaries change
- [x] **The first check-in of a day awards the normal XP; later ones award a
      smaller bonus**
- [x] **The streak counts any day with at least one check-in, and one missed
      day is still forgiven.** Three check-ins in a day is not a bigger streak
      than one
- [x] `exportSnapshot`/`importSnapshot` carry the new fields
- [x] **A backup taken before this migration still restores**, with periods
      derived on the way in
- [x] Coverage on `src/db` stays above the floor

## Tests to write first

`tests/unit/db/migrations.test.ts` (extend) and `tests/unit/db/repo.test.ts`.

- [x] Migration on an **empty** database reaches version 3
- [x] Migration on a **populated v2** database backfills every existing
      check-in and event, and loses nothing — this is the case that would
      destroy real data
- [x] Migration is still idempotent
- [x] Three check-ins in one day, one per period, all persist
- [x] A fourth check-in in an already-used period updates rather than inserts
- [x] First check-in of the day gives full XP; the second gives the smaller
      bonus
- [x] **Streak is unchanged by a second or third check-in on the same day**
- [x] **Streak still forgives exactly one missed day** (guard against a
      regression from the constraint change)
- [x] `recomputePeriods` moves a row to a different period when boundaries move
- [x] Round trip: export at v3, restore, everything matches
- [x] **Restore a v2-era backup** (no `period` field anywhere) and confirm
      periods are derived and nothing throws

## Files likely touched

```
src/db/schema.ts            (migration 3)
src/db/repo.ts              (check-in rules, period on write, recomputePeriods)
src/backup.ts               (bundle version, backward compatibility)
src/domain/xp.ts            (the smaller repeat-check-in award)
tests/unit/db/*.test.ts
```

## Out of scope

- Timeline grouping and filtering (T-022)
- Any UI for choosing a period — the period comes from the clock
- Changing the check-in screen's layout beyond what the new rule forces

## Notes

Never edit a shipped migration — add migration 3, leave 1 and 2 alone.

The unique constraint change on `checkins` is the risky part. SQLite cannot
drop a constraint in place: the migration will need the
create-new-table / copy / drop / rename dance, inside a transaction. That is
exactly why the populated-database test above is mandatory.

Backward compatibility for backups is a real requirement, not a nicety: the
owner may well restore a backup taken this week onto a build from next month.

## Blockers

Needs T-020 for `periodFor`.
