---
id: T-042
title: One named companion, with the period driving its environment
milestone: W3-4
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-042 — One named companion, with the period driving its environment

Implements [ADR 0007](../DECISIONS/0007-one-companion.md).

## Goal

Replace the three rotating creatures with one companion the user names, drawn
as a designed abstract character, with the three periods rendered as gradient
environments in code.

**This is the task that takes the artwork off the critical path.** Until it
lands, [T-019](T-019-store-listing.md) cannot be finished, and without the
listing there is no closed test.

## Acceptance criteria

- [ ] One companion, five mood expressions, no external image licence needed
- [ ] The user names it during onboarding; the name persists and is shown
- [ ] The period drives the **environment** — background gradient, light,
      posture — and never the identity
- [ ] `blend` from `src/domain/companion.ts` drives the environment cross-fade.
      **`companion.ts` is not modified**
- [ ] Reduce-motion switches the environment instantly, as before
- [ ] The Settings "Your companion" card becomes naming, not choosing
- [ ] No watermarked placeholder image is referenced anywhere any more
- [ ] Accumulated care still drives how grown the companion looks, and is
      **never** rendered as a number, level or bar

## Tests to write first

- [ ] The companion's rendered identity is the same at 07:00, 14:00 and 23:00
- [ ] The environment differs across those three times
- [ ] A named companion survives a restart and appears on Home
- [ ] Reduce-motion produces no intermediate blend frame
- [ ] `src/domain/companion.ts` tests still pass untouched — this is the
      regression that would mean the refactor went too deep
- [ ] Every expression asset resolves; a missing one fails the test, not Metro

## Files likely touched

```
src/characterArt.ts
src/features/home/
src/features/settings/Settings.tsx
src/db/schema.ts        (migration: companion name)
src/db/demo.ts
tests/component/
```

## Out of scope

Commissioned illustration. That is T-010, now post-launch, and it is a
drop-in replacement for the five expressions.

## Notes

ADR 0007 costs the unpick at 200–300 lines, almost all of it deletion. If it
is running well past that, stop and say so in the PR — that would mean the
period logic is more entangled with character identity than the ADR assumed,
and the estimate should be corrected rather than quietly exceeded.
