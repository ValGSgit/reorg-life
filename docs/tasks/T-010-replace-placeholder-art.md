---
id: T-010
title: Replace the watermarked placeholder character art
milestone: Unscheduled
priority: P3
status: todo
cut_candidate: true
blocked_by: null
---

# T-010 — Replace the watermarked placeholder character art

## Goal

Every shipped image has a recorded licence permitting distribution. Right now
none of the character art does. **This blocks release.**

## Acceptance criteria

- [ ] All six companions have art, or a documented decision to ship fewer
- [ ] Sprout, Ember and Dusk exist at minimum — they are the three the
      time-of-day rotation needs (ADR 0001)
- [ ] Five moods each (1 rough to 5 thriving), transparent, about 512px
- [ ] One consistent soft 3D-illustrated style across all of them
- [ ] **No watermark, because the source is licensed — not because a
      watermark was removed**
- [ ] No text in any image, no real-world brands, no existing characters
- [ ] The licence for each asset is recorded in `docs/ASSETS.md`
- [ ] `src/characterArt.ts` entries uncommented for every character with art
- [ ] Characters without art still fall back to the blob, and that still has
      a test

## Tests to write first

- [ ] Every path in `characterArt.ts` resolves — a missing file must fail the
      test rather than the Metro build
- [ ] Fallback to the blob still works for any character left without art
- [ ] Every registered image is under a size budget, so the bundle does not
      quietly balloon

## Files likely touched

```
assets/characters/*.png
src/characterArt.ts
docs/ASSETS.md
tests/unit/characterArt.test.ts   (new)
```

## Out of scope

Processing the existing watermarked sheets — that is T-011, and it produces
placeholders, not shippable art.

## Notes

Read `docs/ASSETS.md` first. Current state: Sprout and Ember have usable
sheets, Dusk's has "Stage 1..5" baked into the image, and Comet, Moss and
Blaze have nothing. Two of the five sheets are unrelated human figures.

**Do not remove or crop out a watermark to make an asset look shippable.**
The watermark is the licence status made visible. The fix is a licence, not an
edit.

## Blockers

Needs a decision from the owner on how the final art is sourced and licensed.

## Moved off the critical path — 22 September 2026

[ADR 0007](../DECISIONS/0007-one-companion.md) replaces the three creatures
with one companion drawn as a designed abstract character, needing no external
licence. [T-042](T-042-one-companion.md) delivers that.

This task therefore stops being a release blocker and becomes a **post-launch
upgrade**: commissioning a proper illustrator for the five expressions. It is
a drop-in replacement and touches no logic.

It is also the **best thing to spend the first revenue on**. At 2% conversion a
€300 commission needs roughly 2,000 installs to break even, which is why it
could not be bought up front — but it is exactly what a profitable first year
should buy.

The acceptance criteria above still describe six companions and are stale;
rewrite them when this is picked up, against one companion and five moods.
