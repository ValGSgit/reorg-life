---
id: T-015
title: Read-only device calendar sync
milestone: W5-6
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-015 — Read-only device calendar sync

## Goal

The timeline can show what is actually coming up, by reading the device
calendar. Read-only, on-device, nothing written back and nothing uploaded.

## Acceptance criteria

- [ ] `expo-calendar` reads events within a chosen window
- [ ] Permission is requested with a plain explanation; refusing is a normal
      answer and the app keeps working
- [ ] Which calendars to include is a choice, defaulting to none until picked
- [ ] Calendar events appear in the timeline marked `source = 'calendar'` and
      visually distinct from entries you wrote
- [ ] **Nothing is ever written to the calendar.** No create, no update, no
      delete
- [ ] Calendar events are not stored in the database — they are read at
      display time, so the app is not quietly accumulating a copy
- [ ] Sync can be turned off, and turning it off removes them from the view
      immediately
- [ ] Works when the permission is later revoked in system settings

## Tests to write first

- [ ] Permission refused: timeline still renders, with an explanation
- [ ] Permission granted: events appear, tagged as calendar-sourced
- [ ] No write method of `expo-calendar` is ever called — assert on the mock
- [ ] Disabling sync removes them from the view
- [ ] Permission revoked between launches is handled without a crash
- [ ] An all-day event and a multi-day event both land in a sensible place

## Files likely touched

```
src/features/integrations/calendar.ts   (new)
src/features/timeline/Timeline.tsx
app.json                                 (permission copy)
tests/
```

## Notes

`expo-calendar` is already a dependency and the permission string is already
in `app.json`.

The read-only promise is in `docs/PRIVACY.md`. The "no write method is ever
called" test is what turns that promise into something enforced.

Keeping events out of the database is deliberate: a copy would end up in
backups, which would mean exporting calendar data the person never chose to
put in the app.

## Blockers

None.
