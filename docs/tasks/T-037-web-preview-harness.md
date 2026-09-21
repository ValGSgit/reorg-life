---
id: T-037
title: Web preview harness — static serve and seeded demo data
milestone: W3-4
priority: P1
status: todo
cut_candidate: false
blocked_by: T-021
---

# T-037 — Web preview harness: static serve and seeded demo data

## Goal

The owner can look at the app in a browser, with enough data in it to see the
timeline, the companion rotation and the reward states, without typing entries
for ten minutes and without a Metro dev server running.

This exists because work has been getting approved that nobody could look at.
It is a **testing surface**, never a real journal.

## Acceptance criteria

- [ ] `npm run web:build` produces the static export
- [ ] `npm run web:serve` serves that export over plain HTTP, with no Metro
      dev server running, and prints the URL to open
- [ ] A seed command fills the preview with obviously fictional data:
      check-ins across **all three periods**, at least two habits with streaks
      in progress, timeline entries spanning several days, and XP partway to a
      level so the reward states are visible
- [ ] The seeded content is **unmistakably demo data** on sight — no text that
      could be mistaken for a real entry
- [ ] Wipeable in one command or one button, and the wipe is obvious to find
- [ ] **Impossible to run in a release build.** Guarded so the seed and wipe
      cannot be reached from a production bundle, and a test proves it
- [ ] The existing non-secure banner stays, and stays prominent: the web
      database is unencrypted by design
- [ ] Nothing is deployed anywhere. Local only

## Tests to write first

- [ ] `tests/unit/` — the seed guard refuses to run when the build is not a
      development build. This is the one that matters: it is what stops demo
      data reaching a real install
- [ ] The seed produces data in all three periods, derived with `periodFor()`
      rather than hardcoded hours, so it stays correct if boundaries change
- [ ] The wipe leaves the database empty and leaves no orphaned rows
- [ ] `tests/e2e/` — the served static build loads and shows seeded content,
      and the non-secure banner is visible

## Files likely touched

```
package.json                 (web:build, web:serve scripts)
scripts/seed-demo-data.mjs   (new — also used by T-019)
src/db/                      (seed and wipe, dev-guarded)
src/features/settings/       (wipe button, behind the same guard)
tests/
```

## Out of scope

- Deploying this anywhere, including GitHub Pages. Local only. If hosting is
  ever wanted it needs its own task and an argument in a PR first.
- Making the web build secure. It is unencrypted by design and says so.
- Reading real backups in a browser — that is **T-036**, which is a different
  thing entirely.

## Notes

The seed script is deliberately the same one **T-019** needs for reproducible
store screenshots that contain no personal data. Building it once, here, is
why T-019 now lists this task as a blocker instead of creating its own.

Derive periods with `periodFor()` from `src/domain/companion.ts`. Do not
reimplement clock arithmetic to place seeded entries.

## Blockers

None. Ordered after T-021 so that seeded check-ins carry a `period` and the
harness shows the real grouping rather than a version that has to be redone.
