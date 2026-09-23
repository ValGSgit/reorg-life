---
id: T-045
title: Remove XP, levels and unlockables from the UI
milestone: W3-4
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-045 — Remove XP, levels and unlockables from the UI

## Goal

Delete the visible points economy. Keep the accumulating value that drives how
grown the companion looks.

## Why

Under [ADR 0005](../DECISIONS/0005-engagement-model.md) every mechanic that
would make points _mean_ something is banned — no variable rewards, no
scarcity, no comparison, no loss. What is left is an inert number that reads as
"gamified app" to precisely the audience this is built for, and that costs
trust at the exact moment someone is deciding whether to write something honest
in it.

"Care accumulates" is kept, and is shown by the companion's environment
visibly growing instead. ([ADR 0007](../DECISIONS/0007-one-companion.md))

## Acceptance criteria

- [ ] No XP number, level, progress bar or unlock notification anywhere in the
      UI
- [ ] `src/domain/xp.ts` and its tests **survive**, renamed to reflect what it
      now does — it is the growth signal behind the companion
- [ ] The companion's appearance reflects accumulated use
- [ ] Nothing regresses in streaks, which are a separate rule and stay
- [ ] The unlockables picker is removed, and T-002 is cut

## Tests to write first

- [ ] No screen renders a level, an XP total or a progress bar
- [ ] The growth signal still increases after a check-in, and never decreases
      when something is unticked — the "no penalties" rule is unchanged
- [ ] Existing databases with XP rows still open

## Files likely touched

```
src/domain/xp.ts          (renamed, logic unchanged)
src/features/home/
src/features/rewards/     (removed)
src/features/settings/Settings.tsx
tests/unit/domain/
```

## Out of scope

Deleting the accumulation logic. **Do not.** The companion's growth needs a
quantity behind it, that quantity already exists and is tested, and rebuilding
it later would be pure waste. This task removes a _display_, not a mechanism.

## Notes

This was the one part of the owner's 22 September re-scope that got pushed
back on, and the push-back was accepted: the brief said "delete the number from
the UI", which is exactly this, but read as though the domain logic went too.
It does not.
