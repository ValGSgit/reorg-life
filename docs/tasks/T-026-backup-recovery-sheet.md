---
id: T-026
title: Add a printed/PDF recovery sheet to backup export
milestone: Unscheduled
priority: P2
status: blocked
cut_candidate: false
blocked_by: null
---

# T-026 — Add a printed/PDF recovery sheet to backup export

## Goal

When exporting a backup, offer the recovery key as a printable/PDF sheet as
well as the on-screen string, so losing the one copy the user wrote down
somewhere ad hoc is less likely. This does not change who can decrypt a
backup — same key, same population — it only makes the user's own copy more
durable and findable. See
[ADR 0002](../DECISIONS/0002-backup-recovery.md) for the full comparison of
alternatives and why this one was recommended.

## Acceptance criteria

- [ ] Export flow offers a one-page PDF (recovery key as text and QR code, a
      short explanation, guidance to store it apart from the phone and the
      backup file)
- [ ] The existing on-screen recovery key display is unchanged
- [ ] No recovery key is written to app storage, logs, or any file the app
      controls beyond the one PDF the user explicitly saves or prints
- [ ] `docs/ARCHITECTURE.md`, `docs/PRIVACY.md`, `docs/SECURITY.md` updated
      to describe the sheet
- [ ] The protected rule in `AGENTS.md` ("the recovery key is ... shown once,
      and stored nowhere") reworded to describe the new design, with the
      owner's sign-off recorded

## Tests to write first

- [ ] `tests/component/` — export screen offers the PDF/print action and it
      contains the same recovery key shown on screen
- [ ] `tests/unit/` — the PDF/sheet content generator, given a key, produces
      the expected text (no live device print/share call in a unit test)

## Files likely touched

```
src/backup.ts
src/features/... (export screen)
docs/ARCHITECTURE.md
docs/PRIVACY.md
docs/SECURITY.md
AGENTS.md
tests/component/...
tests/unit/...
```

## Out of scope

Passphrase-derived keys, Shamir splitting across contacts, and cloud escrow —
all compared and rejected (for now) in [ADR 0002](../DECISIONS/0002-backup-recovery.md).
None of this task's work should read a password or reach the network.

## Notes

`expo-print` and `expo-sharing` are the likely APIs — confirm current shape
against <https://docs.expo.dev/versions/v57.0.0/> before writing code, per
the "Expo has changed" note in AGENTS.md.

## Blockers

Blocked on the owner reviewing [ADR 0002](../DECISIONS/0002-backup-recovery.md)
and signing off on amending the protected backup-recovery rule in AGENTS.md.
No code should be written against this task until that sign-off is recorded
in the ADR (status changed from "proposed").
