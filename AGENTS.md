# AGENTS.md

**The single source of truth for working in this repository.** Human or
Claude, the rules are the same. `CLAUDE.md` imports this file; nothing should
be duplicated there.

---

## Expo has changed

Read the versioned docs at <https://docs.expo.dev/versions/v57.0.0/> before
writing any Expo code. Do not rely on memory of older SDKs — the file-system,
notifications and crypto APIs have all changed shape recently, and this
project uses the new ones.

---

## Session start checklist

1. `git pull` and start a branch: `git checkout -b <type>/<short-name>`.
2. `git status -sb` — confirm `main` is **level with `origin`**, not behind. A
   `git pull` that fails on authentication says so once and is easily missed,
   and a session spent building on a stale base is expensive to unpick.
3. `npm ci` if `package-lock.json` has moved.
4. `node scripts/next-task.mjs` — this tells you what to work on.
5. Read the task file it names, in full, including "out of scope".
6. `npm run verify` to confirm you are starting from green. **If it is already
   red, fix that first or say so — never build on top of a red build.**

## Session end checklist

1. Acceptance criteria in the task file ticked — genuinely, not optimistically.
2. `status:` updated in the task front matter (`doing` → `done`).
3. Add one status entry as a **new file** in `docs/status/`, named
   `YYYY-MM-DD-NN-slug.md`. Never edit the log in `docs/ROADMAP.md` directly —
   it is generated, and appending to it by hand is what lost an entry in a
   merge on 21 September. See [docs/status/README.md](docs/status/README.md).
4. `node scripts/next-task.mjs --generate` to rewrite `docs/tasks/INDEX.md`
   and the ROADMAP status log together.
5. `npm run verify` green.
6. Commit, push the branch, open a pull request. **Never push to `main`.**

---

## What this project is

A local-first, privacy-first life tracker for the owner's mental health: past,
future, and digital footprint. Android first, iOS later, web as a development
preview only.

**Tone is a requirement, not decoration.** Calm and non-judgemental
throughout. Forgiving streaks. No penalties, no guilt, no nagging, no "don't
break your streak". A quiet week is information, not a failure. If a string
you are writing would make someone feel worse on a bad day, it is wrong.

---

## Architecture in one paragraph

One Expo app, no backend. `src/domain` is pure logic with no React or Expo
imports. `src/db` owns one schema for every platform, with SQLCipher on native
and an unencrypted browser database on web. `src/features/*` holds screens.
Dependencies point one way: features → db → domain. Full map in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Commands

| Command                     | What it does                                          |
| --------------------------- | ----------------------------------------------------- |
| `npm run verify`            | **The gate.** Lint, typecheck, coverage, both exports |
| `npm test`                  | All Jest suites                                       |
| `npm run test:coverage`     | With the 80% floor enforced                           |
| `npm run test:e2e`          | Playwright against the web build                      |
| `npm run typecheck`         | `tsc --noEmit`                                        |
| `npm run lint` / `lint:fix` | ESLint                                                |
| `npm run next-task`         | What to work on next                                  |
| `npm run android` / `web`   | Run the app                                           |

---

## TDD rules

**Red, green, refactor. Every behaviour change starts with a failing test.**

1. Write the test first. **Run it. See it fail, for the right reason.** A test
   that passes before the implementation exists is testing nothing.
2. Write the smallest code that makes it pass.
3. Refactor with the test green.

Where each kind of test goes:

| What          | Where                | How                                                         |
| ------------- | -------------------- | ----------------------------------------------------------- |
| Pure logic    | `tests/unit/domain/` | Plain Node. Fast. **Required** for anything in `src/domain` |
| Database      | `tests/unit/db/`     | Real in-memory SQLite via `node:sqlite`                     |
| Screens       | `tests/component/`   | React Native Testing Library (`render` is **async** in v14) |
| Critical flow | `tests/e2e/`         | Playwright against the web build                            |

**Coverage floor: 80%** on `src/domain`, `src/db` and `src/backup.ts`,
enforced by CI. Currently well above it. Raising it is welcome; lowering it
needs a sentence in the PR saying why.

### The failing-test commit

The definition of done asks for commit history showing the failing test. The
pre-commit hook runs the unit suite, so that commit is rejected. Use:

```sh
ALLOW_RED=1 git commit -m "test: ..."
```

`ALLOW_RED=1` skips **the unit-test step and nothing else**. The secret scan,
the personal-data guard, the placeholder-art guard, lint, formatting and
typecheck all still run. That narrowness is the entire point: the alternative
people were reaching for was `--no-verify`, which switches off the secret and
personal-data checks too, so the rule as written was quietly pushing everyone
towards the least safe option on the shelf.

It is legal for **a commit that adds a failing test and nothing else**. It is
not a way to land unfinished work — the next commit makes the test pass, and
CI runs the full suite regardless, so nothing red reaches `main` either way.

`tests/unit/scripts/pre-commit.test.ts` holds the hatch to this shape. If
someone widens it, those tests fail.

### Never weaken a test

Do not delete, skip, loosen or `.only` a test to get CI green. Do not widen a
matcher until it passes. Do not lower the coverage floor.

If a test seems wrong, it is telling you something — either the code is
broken, or a requirement is wrong. **If a requirement is wrong, stop and write
that in the pull request description.** Do not silently work around it. A
paused task with a clear explanation is a good outcome; a quietly disabled
test is not.

### Product rules the tests protect

Changing any of these needs an explicit decision from the owner, recorded in
an ADR.

- **Streaks forgive one missed day.** Two in a row stops a streak; one does
  not. Days a schedule does not ask for are skipped, not counted as misses.
- **No penalties.** The care you have put in is only ever added to. Unticking
  something is a correction, never a punishment. The accumulating value still
  exists in `src/domain` and drives how grown the companion looks; it is
  **never shown to the user as a number, a level or a bar**.
  ([ADR 0007](docs/DECISIONS/0007-one-companion.md))
- **Encryption on native is not optional.** SQLCipher, key in the OS keystore.
- **Backups are AES-256-GCM.** The recovery key is generated per export, shown
  **once**, and **never stored by the app**. The user may take a printable
  copy. ([ADR 0002](docs/DECISIONS/0002-backup-recovery.md),
  [ADR 0003](docs/DECISIONS/0003-recovery-key-format.md))
- **No analytics, no telemetry, no network call carrying personal data.**
  "Analytics" means **data leaving the device**. Rendering someone's own data
  back to them on their own phone — mood over time, by period, by life area,
  habit consistency — is **not** analytics, is explicitly allowed, and is a
  free feature. The measurement surface for the project is Play Console, which
  reports installs, uninstalls, ratings, country split and crash/ANR rates
  with no SDK and no code. ([PRIVACY.md](docs/PRIVACY.md))
- **One companion**, named by the user, which grows as the app is used. The
  period follows the local clock and drives its **environment** — light,
  background, posture — never its identity. The cross-fade is smooth, or
  instant under reduce-motion, and is never cut.
  ([ADR 0001](docs/DECISIONS/0001-time-of-day-companions.md) for the period
  model, [ADR 0007](docs/DECISIONS/0007-one-companion.md) for the companion)
- **Up to three check-ins a day**, one per period. The first counts for more
  than the rest, so a second is a welcome extra and never an obligation.
  **The streak counts any day with at least one, and still forgives one missed
  day.**
- **Reminder copy is written in the companion's voice and never induces
  guilt.**
- **Engaging, never coercive.** Retention comes from craft and warmth — the
  companion, art worth looking at, a timeline worth re-reading. It never
  comes from making it uncomfortable to leave. Specifically forbidden:
  streak-loss pressure, variable or random rewards, loss aversion, artificial
  scarcity, notifications designed to pull rather than remind, and social
  comparison. If asked to make the app "more engaging", build from the first
  list, not the second.
  ([ADR 0005](docs/DECISIONS/0005-engagement-model.md))
- **The core is never behind a paywall.** Check-in, notes, habits, timeline,
  local insights and charts, and **manual** export, backup and restore stay
  free forever. Anyone who stops paying keeps everything they have written and
  can still get all of it out by hand. Only **scheduling, automation and
  device-to-device transfer** are paid — the free tier can always export and
  import; the paid tier removes the remembering.
  ([ADR 0006](docs/DECISIONS/0006-monetisation.md))
- **Never a medical claim.** These words must not appear in the app, the store
  listing, the landing page or any post: _treat, cure, therapy, therapeutic,
  clinically proven, diagnose,_ "reduces anxiety", "manage your depression",
  or any other outcome or symptom-improvement claim — including a testimonial
  that implies one. Under EU MDR, qualification as a medical device turns on
  **intended purpose**: documenting mood without clinical interpretation, for
  wellbeing, is outside scope, and it is _claims_ that drag a product in.
  **Never add a scored clinical instrument** (PHQ-9, GAD-7 or similar), and
  never add risk scoring or mood-triggered detection. See
  [MARKETING.md](docs/MARKETING.md).

---

## How the next task is chosen

`node scripts/next-task.mjs` is **authoritative**. If its answer looks wrong,
fix the data, not the answer — a tool that gets overridden by hand every
session stops being trusted, and then nobody runs it.

Ordering is priority, then milestone, then id.

| Priority | Means                                                              |
| -------- | ------------------------------------------------------------------ |
| `P1`     | On the critical path to 14 December. Slipping it slips the release |
| `P2`     | Wanted for launch, but the release survives without it             |
| `P3`     | Worth doing. First to be cut, and usually `cut_candidate: true`    |

Three front-matter fields affect what comes next:

- **`blocked_by`** — a hard dependency. The task cannot be _built_ until those
  are `done`, and it is not offered until then.
- **`enables_review_of`** — a soft one. The task is not required to build the
  listed tasks, but it is required to **judge** them: T-037 builds the preview
  harness, and without it a timeline grouped by period (T-022) or a cross-fade
  (T-023) cannot be looked at and approved. An enabler is ordered immediately
  in front of the earliest task it enables. It never affects readiness, so it
  cannot deadlock.
- **`cut_candidate`** — shown in the index, so what goes first is visible
  before the schedule forces the decision.

## Definition of done

A task is done when **all** of these are true:

- [ ] Every acceptance criterion in the task file is ticked and actually true
- [ ] A failing test was written first, and the commit history shows it
      (commit it with `ALLOW_RED=1`; see "The failing-test commit")
- [ ] `npm run verify` passes
- [ ] `npm run test:e2e` passes, or the change cannot affect it
- [ ] No existing test was weakened
- [ ] Task file `status:` updated; `INDEX.md` regenerated
- [ ] A new entry file exists in `docs/status/`, and `--generate` has been run
- [ ] An ADR exists if a decision was made that constrains future work
- [ ] No secrets, no personal data, no `.db` files

---

## Pull requests

- **One task per pull request.**
- **Under about 400 changed lines.** If it is growing past that, stop and
  split the remainder into new task files. A large PR does not get reviewed
  properly, which defeats the point of having review.
- **That guide counts non-test lines.** Working test-first routinely lands a
  large specification beside a small implementation, and splitting the pair
  means landing a spec with nothing implementing it, or an implementation with
  nothing specifying it — both worse than one long PR. `T-020` is the case that
  prompted this: 350 lines of test against 249 of implementation. Say in the PR
  which part of the total is test.
- Conventional Commits: `feat:` `fix:` `test:` `refactor:` `chore:` `docs:`
  `style:` `perf:` `ci:`. Enforced by commitlint.
- The commit body says _why_, not what the diff already shows.
- Fill in the PR template honestly, including the "push back on this" section.
- **Never push to `main`. Never merge your own PR.**

---

## Blockers

If you cannot proceed — a missing credential, an ambiguous requirement, a
decision only the owner can make:

1. Write what is blocking you in the task file, under `## Blockers`, with
   enough detail that it can be acted on.
2. Set `status: blocked` and `blocked_by:` in the front matter.
3. Regenerate the index.
4. **Stop.** Say so clearly.

Do not guess at a product decision. Do not invent a credential. Do not build
something plausible and hope. Finish whatever else in the task is genuinely
unblocked first, then report exactly what is left and why.

---

## Security and privacy

- **No secret ever committed.** Not in code, `app.json`, a test fixture, or a
  workflow. Secrets live in GitHub repository secrets, and keys live in the OS
  keystore.
- **No personal data committed.** No `.db`, no `exports/`, no screenshots of
  real entries. `.gitignore` and the pre-commit hook both enforce this;
  neither is a substitute for paying attention.
- **No analytics, crash reporting or telemetry.** Adding any is a product
  decision requiring an ADR, and it would contradict
  [docs/PRIVACY.md](docs/PRIVACY.md).
- **No network call carrying personal data. There is no exception.** Notion
  sync was the one planned exception and was **cut** on 22 September, because
  it was the single feature that turned "nothing leaves your phone" into a
  sentence needing a footnote — in the store listing, in the Data Safety form
  and in the strongest claim the app has. See
  [T-016](docs/tasks/T-016-notion-sync.md).
- The web preview is **not** secure and must always say so.

Details in [docs/SECURITY.md](docs/SECURITY.md).

---

## Assets

Every character image currently in the repository is a **watermarked
placeholder** and must not ship. Do not remove or crop out a watermark to make
one look shippable — the fix is a licence, not an edit. See
[docs/ASSETS.md](docs/ASSETS.md).

---

## Where things are

|                                     |                                                    |
| ----------------------------------- | -------------------------------------------------- |
| What to do next                     | `node scripts/next-task.mjs`                       |
| All tasks                           | [docs/tasks/INDEX.md](docs/tasks/INDEX.md)         |
| Dates and cut order                 | [docs/ROADMAP.md](docs/ROADMAP.md)                 |
| How it fits together                | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)       |
| Why it is like that                 | [docs/DECISIONS/](docs/DECISIONS/)                 |
| Security rules and GitHub checklist | [docs/SECURITY.md](docs/SECURITY.md)               |
| Privacy policy draft                | [docs/PRIVACY.md](docs/PRIVACY.md)                 |
| Release and store steps             | [docs/RELEASE.md](docs/RELEASE.md)                 |
| Asset licensing                     | [docs/ASSETS.md](docs/ASSETS.md)                   |
| Claude on GitHub                    | [docs/CLAUDE_WORKFLOW.md](docs/CLAUDE_WORKFLOW.md) |
