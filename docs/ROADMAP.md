# ReorgLife launch roadmap

**Target public release: Monday 14 December 2026. Hard deadline: 31 December 2026.**

Stack: Expo SDK 57 + TypeScript, encrypted SQLite (SQLCipher), local-first, no
backend, no AI API. Android first, iOS later. Gentle by design: forgiving
streaks, no penalties, quiet areas are not failures.

## The constraint that drives the dates

A new personal Google Play developer account must run a **closed test with 12+
testers for 14 continuous days** before it can apply for production access.

That single rule sets everything else. Working back from 14 December with room
for a production review, the closed test has to be **running by 2 November**,
ideally sooner. Recruiting 12 real testers is the part most likely to slip, so
it starts early.

> Verify this rule in Play Console Help before relying on it. Google changes it,
> and the whole schedule is built on top of it. See [RELEASE.md](RELEASE.md).

## Timeline

| Weeks | Dates          | Work                                                                                                                                                                                                                          |
| ----- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1–2  | 21 Sep – 4 Oct | Web preview **done**. Character art for the three creatures drawn and wired in **done** (placeholders — see below). Milestone 1 on the Android phone (dev build) **still open** — needs the owner's device                    |
| W3–4  | 5 – 18 Oct     | Habits with gentle streaks, richer reminders, avatar unlocks by level, settings, encrypted export/import. **Time-of-day companions and notes organised by period** (see [ADR 0001](DECISIONS/0001-time-of-day-companions.md)) |
| W5–6  | 19 Oct – 1 Nov | Device calendar sync (read-only). Create Play Console account and verify identity. Recruit 12+ testers. Installable builds testers can fetch and roll back (T-030, T-038–T-040). **Closed test must start by 2 Nov**          |
| W7–8  | 2 – 15 Nov     | Notion sync, digital footprint inventory, animations. Closed test running                                                                                                                                                     |
| W9–10 | 16 – 29 Nov    | Tester feedback, accessibility pass, privacy policy, store listing, screenshots. Closed test reaches 14 days ~16 Nov; apply for production access                                                                             |
| W11   | 30 Nov – 6 Dec | Feature freeze. Release candidate, backup/restore test on a real device, security review (gitleaks clean, no secrets)                                                                                                         |
| W12   | 7 – 13 Dec     | Submit to production, respond to review                                                                                                                                                                                       |
| —     | 14 – 31 Dec    | Launch and buffer. **No new features**                                                                                                                                                                                        |

Milestones 1 and 2 are already built (onboarding, check-in, timeline, home,
habits, reminders, unlockables, settings, encrypted backups). W3–4 now carries
the time-of-day companion work.

### Where W1–2 actually stands (checked against the repo, 21 Sep)

Checked by reading the repo rather than the planning doc, because the two had
drifted apart and the doc was the stale one.

- **Web dev preview — done.** `npm run export:web` builds, and it runs as part
  of `npm run verify`, so it cannot silently rot.
- **Character art wired in — done.** `src/characterArt.ts` registers all fifteen
  images: Sprout, Ember **and Dusk**, moods 1–5. Dusk no longer falls back to
  the blob.
- **Milestone 1 on a physical Android phone (dev build) — not done.** This is
  the only genuinely outstanding W1–2 item. It needs the owner's device and the
  owner's machine, so it stays with the owner rather than being agent work.

Two things that are easy to misread as progress:

- The art is **watermarked placeholder art** and must not ship. T-010 replaces
  it, and until it does T-019 (store listing) cannot be finished either — that
  puts a licence, not a drawing, on the critical path to 14 December.
- The blob fallback is still live and still tested. Comet, Moss and Blaze, the
  human avatars, have no art at all, so that path stays covered.

The project is **ahead** of this timeline rather than behind it: W3–4 work
(T-020 and the companion chain that follows it) is what is queued next.

## Cut list

If the schedule slips, drop in this order:

1. Notion sync
2. Digital footprint inventory
3. Avatar unlockables
4. Extra animations

Custom period boundaries in the time-of-day settings are also a cut candidate.
The basic companion rotation is **not** — it is the feature's whole point.

**Never cut:** encryption · check-in · reminders · export and backup · privacy
policy.

Anything cut gets its task file marked `status: cut` with a one-line reason,
not deleted, so the decision is still visible later.

## Weekly rhythm

- **Monday** — plan the week.
- **Friday** — review, commit, push.
- Keep the status log below current — add a file to `docs/status/`, never
  edit the generated log. One entry per session is plenty.

## Status log

<!-- Generated from docs/status/ by scripts/next-task.mjs --generate. Do not edit by hand. -->

- **20 Sep** — Milestone 1 scaffold built (onboarding, check-in, timeline, home,
  reminder, encrypted DB). Character art in progress on Higgsfield.
- **20 Sep** — Milestone 2 built: habits with gentle streaks, per-habit
  reminders, level unlockables, settings with encrypted export/import. Web dev
  preview working with non-secure fallbacks.
- **20 Sep** — Repo foundation: flattened layout, `src/domain` split out as pure
  logic, Jest + ESLint + Prettier + Playwright, 100 tests, CI, 20-task backlog,
  agent rules. Time-of-day companions designed and split into tasks (ADR 0001).
  Sprout and Ember wired in as placeholder art; Dusk still falls back to the
  blob. Next task: T-020.
- **21 Sep** — Reconciled this file against the repo. Dusk art landed after the
  line above was written, so all fifteen images are now wired in; corrected the
  same stale claim in ADR 0001. Web preview confirmed working and covered by
  `npm run verify`. Milestone 1 on a physical Android phone is the only W1–2
  item still open, and it stays with the owner. Noted in T-019 that the
  watermarked placeholder art blocks the store listing as well as T-010.
- **21 Sep** — T-020 done: `src/domain/companion.ts` decides the period and the
  cross-fading companion pair from the local clock, with 38 tests covering both
  daylight-saving days, the midnight wrap, a night-shift wake time and every
  nonsense setting. `src/domain` stays at 100% coverage; the Jest suite now pins
  `TZ=Europe/Vienna` so the DST cases are real. Nothing renders differently yet —
  that is T-023. Next task: T-021.
- **21 Sep** — Two capabilities scoped so work can be reviewed rather than
  taken on trust: a local web preview harness with seeded demo data (T-037,
  W3-4) and downloadable versioned builds (T-038, T-039, T-040, W5-6). T-030
  moved from W11 to W5-6 — T-031 is blocked by it and must be running by
  2 November, so a W11 dependency was impossible. Nothing implemented yet;
  this is scope only. Rollback warning added to RELEASE.md: uninstalling to
  downgrade wipes the encrypted database.
- **21 Sep** — Status log moved out of `docs/ROADMAP.md` into one file per
  entry under `docs/status/`, assembled by `next-task.mjs --generate`. Every task
  PR used to append to the same few lines, so every pair of open PRs conflicted,
  and resolving one of those conflicts had already dropped an entry into nothing
  on the way into main. A branch now adds a file and touches no shared line. The
  six existing entries were migrated and the assembled output is byte-identical
  to what was there. Also added `enables_review_of`, so the script — not a
  standing manual override — knows T-037 comes before T-022 and T-023.
- **21 Sep** — Biometric unlock scoped. T-041 covers unlocking the app
  with a fingerprint or face, with a device passcode always available as a
  fallback, off by default and failing locked rather than open. Decrypting an
  export with a fingerprint is a different problem: biometrics gate a stored
  key, and the recovery key is required to be stored nowhere, so it is written
  up as option (f) in ADR 0002 rather than built. Nothing implemented.
- **21 Sep** — T-021 done: check-ins and events carry the period they
  happened in. Migration 3 rebuilds `checkins` to move the UNIQUE constraint from
  `day` to `(day, period)`, backfilling every existing row from the timestamp it
  already had — tested against a populated v2 database, which is the case that
  would have destroyed real entries. The timestamp stays authoritative, so
  `recomputePeriods()` can rebuild the history if the boundaries move. Up to
  three check-ins a day now, the first worth full XP and later ones a smaller
  bonus; the streak still counts days rather than check-ins and still forgives
  one missed day. A backup taken before the migration restores with its periods
  derived on the way in. Next task: T-037.

## How this file is kept up to date

Every finished task adds one file to [status/](status/) and updates the task's
own file. See [../AGENTS.md](../AGENTS.md), "session end checklist".
