---
id: T-017
title: Digital footprint inventory
milestone: W7-8
priority: P3
status: todo
cut_candidate: true
blocked_by: null
---

# T-017 — Digital footprint inventory

## Goal

A place to list the accounts, subscriptions and services you have, so the
"digital" life area has something real behind it.

**Cut list position 2.**

## Acceptance criteria

- [ ] Add an entry: service name, category, what it holds, a note
- [ ] Mark an entry as active, dormant, or closed
- [ ] Optional reminder to review an entry
- [ ] Entries appear under the Digital footprint life area
- [ ] **No passwords, ever.** This is not a password manager and must not
      invite being used as one
- [ ] Included in encrypted backups
- [ ] Edit and delete

## Tests to write first

- [ ] CRUD round trip through the repository
- [ ] Migration adds the table without disturbing existing rows
- [ ] Entries are included in export and restore
- [ ] There is no password field anywhere in the schema or the form

## Files likely touched

```
src/db/schema.ts         (migration)
src/db/repo.ts
src/features/integrations/  or a new footprint feature folder
tests/
```

## Notes

The no-passwords rule is not a nicety. Storing credentials would change the
threat model completely and invite a security review this project cannot
support. Say so in the UI.

## Blockers

None.
