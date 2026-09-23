---
id: T-047
title: Continuity — scheduled encrypted backup, restore and transfer, as a paid unlock
milestone: Unscheduled
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-047 — Continuity

Implements [ADR 0006](../DECISIONS/0006-monetisation.md).

## Goal

The one paid unlock: €8.99, one-off. Automatic scheduled encrypted backup to a
folder the user picks, restore onto a new device, and device-to-device
transfer.

**Deliberately after the closed test.** Billing near the 2 November deadline
complicates Play review, confuses testers and puts revenue code on a critical
path that is already tight.

## Acceptance criteria

- [ ] Scheduled encrypted backup to a user-chosen folder via the Android
      Storage Access Framework, with a persisted folder grant
- [ ] The file is encrypted before it leaves the app, exactly as a manual
      export is
- [ ] Restore onto a new device
- [ ] Direct device-to-device transfer
- [ ] Optional supporter tip, one-off, unlocking nothing functional, given
      **equal billing in the UI** rather than being buried
- [ ] Entitlement checked **locally** against the Play Billing purchase.
      No server. See the reasoning in ADR 0006 and do not "fix" it
- [ ] **Manual export, backup and restore stay free and unchanged**
- [ ] Losing the entitlement never locks anyone out of anything they wrote
- [ ] A purchase failure is calm and says nothing was charged
- [ ] No streak pressure, scarcity, countdown or "limited offer" anywhere near
      the purchase — ADR 0005 applies to the shop as much as the app

## Tests to write first

- [ ] Entitlement absent: scheduling is off, manual export still works
- [ ] Entitlement present: a schedule persists across a restart
- [ ] A scheduled backup produces a file that the existing restore path opens
- [ ] Revoking the entitlement leaves every existing backup readable
- [ ] The tip grants nothing

## Out of scope

Server-side receipt verification. Subscriptions. iOS.

## Notes

Refund and EU withdrawal policy must be written **before** the first sale, not
after the first complaint. See [COMMERCIAL.md](../COMMERCIAL.md).

`PRIVACY.md` already describes what Google learns from a purchase; keep it
accurate if this changes.
