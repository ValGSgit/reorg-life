# ADR 0007 — One companion, and the period drives its world

- **Status:** accepted
- **Date:** 2026-09-22
- **Decided by:** the owner
- **Affects:** `src/characterArt.ts`, `src/features/home/`,
  `src/features/settings/Settings.tsx`, `src/db/demo.ts`, `docs/ASSETS.md`,
  `AGENTS.md`, tasks T-010, T-011, T-013, T-024
- **Supersedes:** the companion-identity half of
  [ADR 0001](0001-time-of-day-companions.md). Everything in ADR 0001 about
  _periods_ stands unchanged.

## Context

ADR 0001 rotates three creatures — Sprout, Ember, Dusk — by time of day. Two
problems, one product and one commercial.

**Attachment needs continuity.** Three creatures on a clock are weather, not a
companion. Nothing accumulates against any one of them, so there is nothing to
become attached to, which is the only durable reason to open the app on a day
when you do not feel like it.

**The artwork is the critical path, and it has no funding route.** Checked
against the repo on 22 September:

- Every character image in the repository is an unlicensed, watermarked
  placeholder that must not ship.
- **Dusk's source sheet is unusable** — "Stage 1…5" is baked into the image.
  There are two working creatures, not three.
- The generation credits that produced the placeholders are at zero.
- [T-019](../tasks/T-019-store-listing.md), the store listing, is blocked on
  [T-010](../tasks/T-010-replace-placeholder-art.md), the artwork. So artwork
  blocks the listing, which blocks the closed test, which blocks everything.

A 3 × 5 matrix is fifteen images. That is a €300–600 commission and two to
four weeks of lead time, against a closed test that must start on 2 November
and first-year revenue that may not reach €300 at all.

## Decision

**One companion.** Named by the user at onboarding. It grows as the app is
used.

**The period drives its environment, not its identity** — light, background,
posture, energy. The companion at 07:00 and at 23:00 is the same creature in a
different hour, which is what "companion" has to mean.

**It is drawn as a designed abstract character, not a commissioned
illustration.** One simple geometric form with five mood expressions, and the
three periods rendered as gradient environments in code rather than as painted
scenes.

### What this does to the art bill

|                                      | Images                         | Cost                |
| ------------------------------------ | ------------------------------ | ------------------- |
| ADR 0001 as built                    | 3 creatures × 5 moods = **15** | €300–600, 2–4 weeks |
| One companion, commissioned          | 1 × 5 moods + 3 scenes = **8** | €200–400, 2–4 weeks |
| **One companion, abstract (chosen)** | **5 expressions, 0 scenes**    | **€0, days**        |

The middle row was the owner's original proposal and is the better-looking
outcome. It was rejected on arithmetic: at 2% conversion a €300 commission
needs roughly 2,000 installs before it breaks even, which is more than this
app can be relied on to get in its first year. **The art bill was plausibly
larger than first-year revenue.** Taking it to zero is the single change that
makes the project cover its costs.

This is explicitly a **launch decision, not a forever decision.** Commissioned
art is a good thing to spend the first revenue on. The structure below is built
so that swapping five images upgrades the app without touching any logic.

## What survives untouched

This is the part worth being precise about, because it is why the decision is
cheap:

- **`src/domain/companion.ts` is unchanged.** `periodFor` still decides the
  period from the local clock. `MIN_AWAKE_MINUTES`, the smoothstep `blend`
  curve, DST and midnight-wrap handling all stand, with their 38 tests.
- **`blend` still drives a cross-fade** — it simply cross-fades the
  _environment_ rather than swapping the _character_. T-023 shipped that
  animation and it keeps working.
- **Periods on rows stand.** T-021's migration, T-022's grouped timeline and
  the three-check-ins-a-day rule are all about periods, and periods are not
  what changed.
- **Reduce-motion behaviour is unchanged**: instant switch, rotation never cut.

## What it costs to unpick

Estimated 200–300 lines, all of it deletion or simplification:

- `src/characterArt.ts` — one character's five moods instead of a 6 × 5 registry.
- Home — render one companion against a period environment.
- Settings — the "Your companion" picker becomes **naming**, not choosing.
- `src/db/demo.ts` and the component tests that assert on character identity.

**T-024 shrinks rather than growing.** Its pinning feature disappears entirely:
there is no rotation of identity left to pin, so the setting has nothing to do.
Only the period-boundary editor and per-period reminders remain.

This was costed honestly as the owner asked, including the possibility that
unpicking costs more than it saves. It does not: the saving is the entire art
commission and the removal of the critical-path blocker, and the cost is a few
hundred lines of simplification in code that has tests.

## Consequences

- **T-010 leaves the critical path.** It becomes a post-launch upgrade task
  instead of a release blocker, and [T-019](../tasks/T-019-store-listing.md)
  unblocks immediately. This is the single biggest schedule effect in the
  re-plan.
- **T-011 is cut.** It processes the watermarked sheets; there is nothing left
  to process.
- The blob fallback stops being a fallback and becomes the design. Its test
  stays, and gains the five expressions.
- `docs/ASSETS.md` needs rewriting: the licence problem is solved by not
  shipping licensed art at all.
- Sprout, Ember and Dusk leave the product. The names stay in
  `docs/ASSETS.md` history so the decision is visible later.
- The user naming their companion is new persisted state and needs a migration.

## Rejected alternatives

**Keep three creatures.** The outcome if unpicking had cost more than the art.
It does not, and the art has no funding route regardless.

**One commissioned companion plus three painted scenes.** The owner's original
Decision 3. Better-looking, and the right thing to buy with the first revenue.
Rejected for launch on the arithmetic above.

**Ship the closed test with the watermarked placeholders.** Not an option.
Closed-test builds go through Play review and the art has no distribution
licence. This would be a policy violation, not a shortcut.

**Let mood drive identity instead of time.** Already rejected in ADR 0001, for
a reason that applies with more force now: a rough week visibly taking your
friend away is the opposite of gentle.
