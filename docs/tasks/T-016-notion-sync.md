---
id: T-016
title: Notion sync
milestone: W7-8
priority: P3
status: todo
cut_candidate: true
blocked_by: null
---

# T-016 — Notion sync

## Goal

Entries can optionally sync to a Notion database the owner controls.

**Cut list position 1. This is the first thing to drop.** It is also the only
planned feature that sends personal data off the device, so it carries the
most risk for the least certainty.

## Acceptance criteria

- [ ] Off by default; nothing happens until it is explicitly connected
- [ ] The integration token is held in the **OS keystore**, never in the
      database, never in a backup, never in git
- [ ] The person chooses what syncs — it is not all-or-nothing
- [ ] Plain wording before first sync saying what leaves the device and where
      it goes
- [ ] Disconnecting deletes the token and stops all network activity
- [ ] Failures are handled quietly; no data loss, no nagging
- [ ] `docs/PRIVACY.md` updated to describe it accurately **before** it ships
- [ ] Works offline: queued, not lost, and never blocking the UI

## Tests to write first

- [ ] With sync off, **no network call is made at all** — assert on a mocked
      fetch
- [ ] The token is written to the keystore and never to the database
- [ ] A backup export contains no token
- [ ] Disconnecting removes the token
- [ ] A failed request does not lose the local entry
- [ ] Only the selected fields are sent

## Files likely touched

```
src/features/integrations/notion.ts   (new)
src/features/settings/Settings.tsx
docs/PRIVACY.md
tests/
```

## Notes

Read `docs/SECURITY.md` before starting. This is the one place where "no
network call carries personal data" becomes conditional, so the conditions
have to be explicit, tested, and off by default.

If the schedule is tight, cut this. Nothing else depends on it.

## Blockers

None.
