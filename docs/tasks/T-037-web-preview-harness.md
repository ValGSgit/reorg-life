---
id: T-037
title: Web preview harness — one command to launch, seed and test
milestone: W3-4
priority: P1
status: done
cut_candidate: false
blocked_by: T-021
enables_review_of: T-022, T-023
---

# T-037 — Web preview harness: one command to launch, seed and test

## Goal

The owner can look at the app in a browser, with enough data in it to see the
timeline, the companion rotation and the reward states, without typing entries
for ten minutes and without a Metro dev server running.

This exists because work has been getting approved that nobody could look at.
It is a **testing surface**, never a real journal.

## Acceptance criteria

- [x] **One obvious command launches the app**, so looking at a change does
      not mean remembering four scripts. It should be able to start the web
      preview, seed it, wipe it, and run the tests, and it should say what it
      is doing and print the URL
- [x] It works on Windows, since that is the development machine
- [x] `npm run web:build` produces the static export
- [x] `npm run web:serve` serves that export over plain HTTP, with no Metro
      dev server running, and prints the URL to open
- [x] A seed command fills the preview with obviously fictional data:
      check-ins across **all three periods**, at least two habits with streaks
      in progress, timeline entries spanning several days, and XP partway to a
      level so the reward states are visible
- [x] The seeded content is **unmistakably demo data** on sight — no text that
      could be mistaken for a real entry
- [x] Wipeable in one command or one button, and the wipe is obvious to find
- [x] **Impossible to run in a release build.** Guarded so the seed and wipe
      cannot be reached from a production bundle, and a test proves it
- [x] The existing non-secure banner stays, and stays prominent: the web
      database is unencrypted by design
- [x] Nothing is deployed anywhere. Local only

## Tests to write first

- [x] `tests/unit/` — the seed guard refuses to run when the build is not a
      development build. This is the one that matters: it is what stops demo
      data reaching a real install
- [x] The seed produces data in all three periods, derived with `periodFor()`
      rather than hardcoded hours, so it stays correct if boundaries change
- [x] **The wipe genuinely empties the database** — asserted against a
      seeded database, row counts back to zero across every table, with no
      orphaned rows left behind. Proven by a test, never by looking at the
      screen: demo moods stranded in a real timeline would be worse than
      having no demo data at all
- [x] `tests/e2e/` — the served static build loads and shows seeded content,
      and the non-secure banner is visible

## Files likely touched

```
scripts/dev.mjs              (new — the one command)
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

The launcher is a convenience over the existing scripts, not a replacement for
them. `npm run web`, `npm test` and the rest keep working on their own, so CI
and anyone reading `package.json` are unaffected.

`enables_review_of: T-022, T-023` is why this is offered before them despite a
higher id: neither a timeline grouped by period nor a cross-fade can be
_judged_ without something to look at. See "How the next task is chosen" in
AGENTS.md.

## Blockers

None. Ordered after T-021 so that seeded check-ins carry a `period` and the
harness shows the real grouping rather than a version that has to be redone.
