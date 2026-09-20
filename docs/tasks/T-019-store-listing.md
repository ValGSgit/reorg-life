---
id: T-019
title: Store listing and screenshots
milestone: W9-10
priority: P1
status: todo
cut_candidate: false
blocked_by: T-010
---

# T-019 — Store listing and screenshots

## Goal

Everything Play Console needs, ready to paste: text, images, ratings and
declarations.

## Acceptance criteria

- [ ] Title, short description (80 chars), full description (4000)
- [ ] Phone screenshots, at least 4, from a real device
- [ ] Feature graphic 1024x500
- [ ] App icon 512x512 — **not the Expo placeholder**
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed, matching `docs/PRIVACY.md`
- [ ] Target audience and content settings
- [ ] Privacy policy URL from T-018
- [ ] Screenshots contain **no real personal data** — seeded demo content only
- [ ] Copy matches the app's tone: calm, non-judgemental, no streak-shaming,
      no "don't break your streak" language

## Tests to write first

Not testable. Instead:

- [ ] A demo-data script so screenshots are reproducible and contain nothing
      personal

## Files likely touched

```
scripts/seed-demo-data.mjs   (new)
docs/store-listing.md        (new — the copy, so it is reviewable in git)
assets/
```

## Notes

The screenshot rule matters: this is a mental health app, and real check-in
text must never end up on a store page. The seed script is the safeguard.

Blocked by T-010 because screenshots with placeholder art would have to be
retaken.

## Blockers

Needs T-010 (final art).
