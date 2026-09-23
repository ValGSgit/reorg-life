---
id: T-002
title: Move the unlockables picker into features/rewards
milestone: W3-4
priority: P3
status: cut
cut_candidate: true
blocked_by: null
---

# T-002 — Move the unlockables picker into features/rewards

## Goal

`src/features/rewards/` exists with a README and nothing else. The picker it
should own currently lives inside `Settings.tsx`, which is doing too much.

Pure refactor. No behaviour change.

## Acceptance criteria

- [ ] `src/features/rewards/UnlockablesPicker.tsx` owns the picker
- [ ] `Settings.tsx` renders it and is meaningfully shorter
- [ ] Behaviour is identical: locked items disabled, selection persists
- [ ] `src/features/rewards/README.md` describes what is now there
- [ ] Home's "next unlock" hint still works

## Tests to write first

Write these against the **current** behaviour first, so they prove the
refactor changed nothing.

- [ ] `tests/component/UnlockablesPicker.test.tsx` — locked items disabled,
      unlocked ones selectable, selecting calls through
- [ ] Nothing is ever presented as taken away

## Files likely touched

```
src/features/rewards/UnlockablesPicker.tsx  (new)
src/features/rewards/README.md
src/features/settings/Settings.tsx
tests/component/UnlockablesPicker.test.tsx  (new)
```

## Notes

Unlockables are cut-list position 3. If they are cut, this task goes with them.

## Blockers

None.

## Why this was cut

The unlockables picker it moves is being removed entirely by
[T-045](T-045-remove-xp-display.md). There is nothing left to extract.

Cut on 22 September 2026 in the re-planning session. See
[COMMERCIAL-PLAN.md](../COMMERCIAL-PLAN.md).
