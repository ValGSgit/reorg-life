---
id: T-013
title: Idle animations — breathing and a bounce on reward
milestone: W7-8
priority: P3
status: cut
cut_candidate: true
blocked_by: T-023
---

# T-013 — Idle animations: breathing and a bounce on reward

## Goal

The companion feels alive: a slow breathing idle, and a small bounce when
something is earned.

**Cut list position 4.** Drop this before anything else.

## Acceptance criteria

- [ ] Slow breathing idle, roughly 4s a cycle, subtle enough to ignore
- [ ] A short bounce on check-in saved, habit ticked, and level up
- [ ] Reduce motion on: no idle, no bounce, and no substitute flash either
- [ ] Animations stop when the screen is not focused, to save battery
- [ ] No animation blocks input
- [ ] The blob fallback animates too, since most companions still use it

## Tests to write first

- [ ] With reduce-motion on, no animated style is applied
- [ ] Unmounting mid-animation neither warns nor leaks
- [ ] The reward animation fires on the right events, once each

## Files likely touched

```
src/components/Character.tsx, Companion.tsx
src/features/            (reward triggers)
```

## Notes

Shares the reanimated setup with T-023, which is why it is blocked by it.

Restraint is the point — this is an app for calming down.

## Blockers

Needs T-023.

## Why this was cut

Post-launch polish. Nothing depends on it.

Cut on 22 September 2026 in the re-planning session. See
[COMMERCIAL-PLAN.md](../COMMERCIAL-PLAN.md).
