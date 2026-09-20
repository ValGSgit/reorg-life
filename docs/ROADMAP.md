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
| W1–2  | 21 Sep – 4 Oct | Milestone 1 on the Android phone (dev build), web preview, character art for the three creatures, wire images in                                                                                                              |
| W3–4  | 5 – 18 Oct     | Habits with gentle streaks, richer reminders, avatar unlocks by level, settings, encrypted export/import. **Time-of-day companions and notes organised by period** (see [ADR 0001](DECISIONS/0001-time-of-day-companions.md)) |
| W5–6  | 19 Oct – 1 Nov | Device calendar sync (read-only). Create Play Console account and verify identity. Recruit 12+ testers. **Closed test must start by 2 Nov**                                                                                   |
| W7–8  | 2 – 15 Nov     | Notion sync, digital footprint inventory, animations. Closed test running                                                                                                                                                     |
| W9–10 | 16 – 29 Nov    | Tester feedback, accessibility pass, privacy policy, store listing, screenshots. Closed test reaches 14 days ~16 Nov; apply for production access                                                                             |
| W11   | 30 Nov – 6 Dec | Feature freeze. Release candidate, backup/restore test on a real device, security review (gitleaks clean, no secrets)                                                                                                         |
| W12   | 7 – 13 Dec     | Submit to production, respond to review                                                                                                                                                                                       |
| —     | 14 – 31 Dec    | Launch and buffer. **No new features**                                                                                                                                                                                        |

Milestones 1 and 2 are already built (onboarding, check-in, timeline, home,
habits, reminders, unlockables, settings, encrypted backups). W3–4 now carries
the time-of-day companion work.

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
- Keep the status log below current. One line per session is plenty.

## Status log

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

## How this file is kept up to date

Every finished task appends one line to the status log and updates the task's
own file. See [../AGENTS.md](../AGENTS.md), "session end checklist".
