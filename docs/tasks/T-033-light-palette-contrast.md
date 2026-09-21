---
id: T-033
title: Fix the three WCAG failures in the light palette
milestone: W3-4
priority: P1
status: done
cut_candidate: false
blocked_by: null
---

# T-033 — Fix the three WCAG failures in the light palette

## Goal

Every text and control colour in the light theme meets WCAG AA. Three pairs
currently do not, including the primary button, which appears on nearly every
screen.

Do this **before** more screens are designed or built. Everything drawn on top
of these tokens inherits the problem, and retrofitting contrast across a
finished interface is far more work than changing it now.

## The measurements

Computed from `src/theme.ts`, 20 September 2026:

| Pair                                                | Ratio    | AA normal (4.5) | AA large (3.0) |
| --------------------------------------------------- | -------- | --------------- | -------------- |
| `#FFFFFF` on accent `#6C8EBF` — primary button      | **3.36** | **FAIL**        | pass           |
| accent `#6C8EBF` as text on `#FFFFFF`               | **3.36** | **FAIL**        | pass           |
| positive `#7DB88B` on `#FFFFFF` — streak indicators | **2.31** | **FAIL**        | **FAIL**       |
| `#2B2A33` on bg `#F7F4EF`                           | 12.92    | pass            | pass           |
| muted `#6E6B78` on bg `#F7F4EF`                     | 4.74     | pass            | pass           |
| muted `#6E6B78` on card `#FFFFFF`                   | 5.20     | pass            | pass           |

**The dark theme passes everything** (6.15 to 15.90) and should not be
changed.

## Acceptance criteria

- [x] Light `accent` reaches at least 4.5:1 against both `#FFFFFF` and the
      card background, for white button text and for accent-coloured text
- [x] Light `positive` reaches at least 4.5:1 on `#FFFFFF`
- [x] The dark palette is untouched and still passes
- [x] The palette still reads calm — darkening for contrast must not make it
      loud. Adjust lightness before reaching for saturation
- [x] Companion body colours and the six domain colours are reviewed for the
      same problem wherever they carry text or meaning
- [x] `docs/DESIGN.md` records the new values and why they changed

## Tests to write first

- [x] `tests/unit/theme.test.ts` — a contrast function, then an assertion that
      **every** foreground/background pair the app actually uses meets AA.
      Compute the ratios; do not hard-code the expected numbers
- [x] The test must fail against today's palette before the fix. That is the
      proof it is measuring the right thing
- [x] Assert both themes, so a future change to either is caught

## Files likely touched

```
src/theme.ts
tests/unit/theme.test.ts   (new)
docs/DESIGN.md
```

## Out of scope

Touch targets, screen-reader labels and the rest of the accessibility pass —
those stay in T-012. This is colour only, pulled forward because it blocks
design work.

## Notes

The design mockups used these tokens faithfully, so they inherited the
failures. Once the palette is fixed the mockups need re-exporting, not
redrawing.

## Blockers

None.
