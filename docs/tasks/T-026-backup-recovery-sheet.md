---
id: T-026
title: Add a printed/PDF recovery sheet to backup export
milestone: W5-6
priority: P1
status: todo
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

## Was blocked, now settled

ADR 0002 was accepted on 22 September 2026: **option (b)**, the printed/PDF
recovery sheet. The protected rule in AGENTS.md has been reworded to "generated
per export, shown once, and **never stored by the app**. The user may take a
printable copy." This task is unblocked.

## Why this is launch-blocking

Same reasoning as [T-035](T-035-recovery-key-format.md): the everyday failure
is not a broken cipher, it is a person who wrote the key on the back of
something and threw it away. A sheet they can print and file reduces that
without changing who can decrypt anything.

It must say plainly, and without softening it, what happens if the key is
lost — and it must not imply the sheet solves the problem. A sheet kept beside
the phone is lost in the same flood as the phone.

**Second to be cut** if the sequence to 2 November does not fit, after the
landing page. T-035 is not cuttable; this is.
