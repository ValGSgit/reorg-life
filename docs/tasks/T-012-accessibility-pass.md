---
id: T-012
title: Accessibility pass over every screen
milestone: W9-10
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-012 — Accessibility pass over every screen

## Goal

The app is usable with a screen reader, at large text sizes, and without
relying on colour. This is an app for people having a hard time; it should not
also be an obstacle.

Not a cut candidate.

## Acceptance criteria

- [ ] Every interactive element has an accessible label saying what it does
- [ ] Every element reports an appropriate role and state — checkboxes report
      checked, tabs report selected
- [ ] Touch targets are at least 44x44
- [ ] No meaning is carried by colour alone: mood, life area, period and habit
      state each have a text or shape cue as well
- [ ] Text contrast meets WCAG AA in both light and dark themes
- [ ] The layout survives the OS largest font size without clipping or
      overlapping
- [ ] Focus order follows reading order
- [ ] Errors are announced, not only shown
- [ ] Verified by hand with TalkBack on the Android device

## Tests to write first

- [ ] A component test per screen asserting labels and roles on every control
- [ ] Mood buttons expose their value **and** their word, not just a number
- [ ] Habit checkboxes report `checked` state
- [ ] Tabs report `selected` state
- [ ] A unit test over the theme palettes that **computes** contrast ratios
      rather than trusting the eye

## Files likely touched

```
src/components/, src/features/   (labels, roles, hit targets)
src/theme.ts                     (contrast fixes)
tests/component/
```

## Out of scope

Reduce-motion behaviour, which belongs with the animation tasks (T-013,
T-023).

## Notes

Automated tests cannot tell you whether TalkBack is bearable in practice. Do
the manual pass too, and write what you found into the PR.

Some colours may have to change to meet contrast. That is fine — calm and
low-contrast are not the same thing.

## Blockers

None.
