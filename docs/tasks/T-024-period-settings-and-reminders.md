---
id: T-024
title: Settings for period boundaries and per-period reminders
milestone: W7-8
priority: P2
status: todo
cut_candidate: true
blocked_by: T-020
---

# T-024 — Settings for period boundaries and per-period reminders

Fifth of the six time-of-day tasks. See
[ADR 0001](../DECISIONS/0001-time-of-day-companions.md).

## Goal

The rotation fits the person's actual day: pin one companion if the rotation
is unwanted, adjust the boundaries if you sleep at odd hours, and get one
gentle reminder per period written in that companion's voice.

## Cut scope — read before cutting

**Only the custom-boundary editor is a cut candidate.** If the schedule
slips, ship fixed default boundaries and drop the editing UI.

The basic rotation is **never** cut — it is the feature. Pinning is cheap and
should survive a cut too, since it is the escape hatch for anyone the default
boundaries suit badly.

## Acceptance criteria

- [ ] "Pin one companion" turns rotation off and picks which one
- [ ] Wake time and bedtime settings, with sensible defaults
- [ ] Period boundaries editable _(cut candidate)_
- [ ] Changing boundaries calls `recomputePeriods` so existing entries regroup
- [ ] Per-period reminder times, defaulting to 08:00 Sprout, 14:00 Ember,
      21:00 Dusk
- [ ] Each reminder is written in its companion's voice: Sprout calm and
      gentle, Ember warm and energetic, Dusk soft and reflective
- [ ] **No reminder implies guilt, falling behind, or a broken streak**
- [ ] Reminders can be turned off individually or all at once
- [ ] Refusing the notification permission is handled as a normal answer, and
      the app keeps working
- [ ] Invalid input (bedtime before wake time, overlapping boundaries) is
      refused in the UI with a plain explanation
- [ ] All settings persist and survive a restart

## Tests to write first

- [ ] `tests/unit/domain/reminderCopy.test.ts` — copy for each period exists,
      and **no string matches a guilt word list** (`forgot`, `missed`,
      `failed`, `broken`, `don't lose`, `streak at risk`). Assert the tone,
      do not hope for it
- [ ] Pinning makes `companionFor` ignore the clock
- [ ] Custom boundaries change which period a given time falls in
- [ ] Invalid boundary combinations are rejected by the validator
- [ ] `tests/unit/db/repo.test.ts` — settings round-trip
- [ ] Changing boundaries triggers `recomputePeriods`
- [ ] `tests/component/Settings.test.tsx` — three reminder rows, each
      toggleable
- [ ] Permission refused: the screen explains and stays usable

## Files likely touched

```
src/domain/companion.ts             (settings type, validation)
src/domain/reminderCopy.ts          (new)
src/features/settings/Settings.tsx
src/reminders.ts                    (three scheduled reminders)
tests/...
```

## Out of scope

- The rotation itself (T-020, T-023)
- Timeline grouping (T-022)

## Notes

`reminders.ts` already rebuilds all schedules from stored rows rather than
tracking them incrementally. Keep that: it is why reminders and data cannot
drift apart.

Tone is a product rule here, not a preference. See AGENTS.md.

## Blockers

Needs T-020.

## Reduced in scope — 22 September 2026

[ADR 0007](../DECISIONS/0007-one-companion.md) removes companion **pinning**
entirely: there is one companion, so there is no rotation of identity left to
pin. Drop that acceptance criterion and the Settings control for it.

What remains is the period-boundary editor and per-period reminders.

Two things that still need doing here, carried from the companion chain:

- The Settings "Your companion" card no longer changes what Home shows, since
  the period follows the clock. Under ADR 0007 that card becomes **naming**,
  which [T-042](T-042-one-companion.md) delivers — so this task no longer owns
  it.
- `saveCheckin` and `getCurrentCheckin` take period settings as an argument.
  This task must pass the user's real settings through and call
  `recomputePeriods()` when a boundary changes, or changing a boundary
  re-describes nothing that was already written.

Moved to W7-8: post-launch, but before the public release.
