---
id: T-044
title: A static offline crisis-resources screen
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-044 — A static offline crisis-resources screen

## Goal

Somebody using an app about their mental health at 03:00 should be able to
find a phone number without leaving the app or having a signal.

**Launch-blocking.** This protects users rather than adding a feature, and
shipping a mood tracker without it is not defensible.

## Acceptance criteria

- [ ] Reachable from Settings, always, in at most two taps
- [ ] Works fully **offline** — the numbers are in the bundle, not fetched
- [ ] Lists international and EU-wide options, and says plainly that the list
      is not exhaustive
- [ ] Tapping a number offers to dial; nothing dials automatically
- [ ] **No detection, no mood triggering, no risk scoring.** The screen never
      appears because of something the user wrote
- [ ] Copy contains no medical claim and does not tell anyone how they feel
- [ ] Says what it is: a list of places to call, not a service the app provides
- [ ] Accessible — screen-reader labels on every number, real tap targets

## Tests to write first

- [ ] The screen is reachable from Settings
- [ ] Every listed entry has a number and a region label
- [ ] No resource lookup performs a network request
- [ ] Nothing in the app can surface this screen automatically — assert there
      is no caller other than the explicit navigation

## Files likely touched

```
src/features/crisis/            (new)
src/features/settings/Settings.tsx
tests/component/Crisis.test.tsx
```

## Out of scope

Anything adaptive. Detection and risk scoring are **deliberately excluded**:
scoring someone's writing for risk pushes the app toward being a medical
device under EU MDR, which is a line this project does not cross. See the
medical-claim rule in AGENTS.md.

## Notes

Verify every number before shipping, and record where each was checked and
when. A wrong crisis number is worse than no screen at all. Re-check them at
each release — this is on the release checklist, not a one-off.
