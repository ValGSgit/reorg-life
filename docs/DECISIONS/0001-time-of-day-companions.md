# ADR 0001 — Companions rotate with the time of day

- **Status:** accepted, and **partly superseded by [ADR 0007](0007-one-companion.md)**
- **Date:** 2026-09-20
- **Decided by:** the owner
- **Affects:** `src/domain/companion.ts` (new), `src/db/schema.ts`,
  timeline, settings, reminders, character art

> **Superseded in part, 22 September 2026.** [ADR 0007](0007-one-companion.md)
> replaces the three rotating creatures with **one** companion whose
> _environment_ changes by period. Everything in this ADR about **periods** —
> `periodFor`, the boundaries, the smoothstep `blend`, storing a period on
> rows, three check-ins a day, reduce-motion — **stands unchanged**. Only the
> table below, which maps a period to a _different creature_, and point 4
> (pinning) no longer apply. Read this ADR for the period model; read ADR 0007
> for what the companion is.

## Context

Until now a companion is chosen once during onboarding and never changes. That
makes the choice feel weighty for no reason, leaves five of six characters
unused, and gives the app no sense of the day having a shape.

Separately, check-ins and timeline entries are stored against a day only. A day
is a coarse bucket: "I felt rough" at 07:00 and at 23:00 are different facts,
and the timeline has no structure below the date heading.

## Decision

**The companion changes with the time of day instead of being picked once.**

| Period    | Default hours (local) | Companion              |
| --------- | --------------------- | ---------------------- |
| Morning   | 05:00 – 12:00         | Sprout, the mint plant |
| Afternoon | 12:00 – 18:00         | Ember, the fox         |
| Night     | 18:00 – 05:00         | Dusk, the owl          |

**Notes and check-ins are organised by the same three periods**, so the
timeline has a structure below the day.

Alongside that:

1. **Local time, always read at the moment of use.** Never a cached offset,
   never UTC. This is what makes DST changes and travel behave correctly: the
   app simply asks what time it is now, wherever it now is.
2. **Boundaries are configurable**, with wake time and bedtime settings, so a
   night-shift worker or a late sleeper still gets a sensible "morning".
3. **Transitions cross-fade.** `companionFor()` returns
   `{ primary, secondary, blend }`, where `blend` runs 0 → 1 across a
   30-minute window either side of a boundary. The UI can then show two
   companions dissolving into each other rather than one snapping to the next.
4. **A companion can be pinned**, turning rotation off entirely.
5. **Human avatars (Alex, Jo) are not part of the rotation.** They are a
   separate future feature.

## Why these choices

**Why three periods, not two or five?** Three matches how the day is actually
talked about, gives each of the three finished creatures a home, and keeps the
check-in cap (below) at a number that does not feel like a chore.

**Why pure logic in `src/domain/companion.ts`?** Every hard case here — DST
days, midnight wrap, custom boundaries, blend values at window edges — is
cheap to test and expensive to debug on a device. Keeping it React-free means
the whole matrix is a fast unit test. This is the same reason `streaks.ts`
lives there.

**Why store a period on the row _and_ keep the timestamp?** The period is
derived from the timestamp, so it is redundant — but grouping and filtering a
timeline by a stored column is far simpler than recomputing it for every row.
The timestamp stays authoritative: if someone changes their boundaries, the
stored period can be recomputed from it. Storing only the period would make
that impossible; storing only the timestamp would make every query do the work.

**Why up to three check-ins a day?** One per period. The first of the day gives
the normal XP and the others a smaller bonus, so a second check-in is a welcome
extra rather than an obligation. The streak counts any day with **at least
one** check-in, and the "one missed day is forgiven" rule is unchanged — the
existing streak promise must not get harder to keep just because the day now
has three slots.

**Why respect reduce-motion?** A cross-fade is decorative. For anyone who has
asked their OS for less motion, the companion switches instantly instead. The
same reasoning says the period must never be conveyed by colour alone — it
carries an accessible label too.

## Consequences

- A new migration adds `period` to `checkins` and `events`. It must be tested
  against a database that already has rows, since that is the case that would
  lose data.
- Backups gain the new fields and must still restore a backup taken before the
  migration. A backup from an older version is a normal thing to hand the app,
  not an error.
- `react-native-reanimated` is added for the cross-fade.
- The check-in screen changes from "today" to "this period", which is the
  largest single behavioural change in the set.
- The blob fallback stays on the critical path and is covered by a test. Dusk
  has placeholder art now, but Comet, Moss and Blaze — the human avatars — have
  none, so the fallback is still what they render.

## Accepted during implementation

Both of these came up while building T-020 and are **settled**. They are
recorded here so a later session does not reopen them.

**An awake span shorter than four hours falls back to the defaults — not
"bedtime earlier than wake time".** The original wording called bedtime before
wake time nonsense. Read literally that rejects wake 09:00 with bedtime 02:00,
which is precisely the night owl this ADR exists to support. So the rule is the
span, not the ordering: 09:00 to 02:00 is a seventeen-hour day and is honoured,
while 09:00 to 11:00 is a typo and falls back. See `MIN_AWAKE_MINUTES` in
`src/domain/companion.ts`.

**`blend` eases with a smoothstep curve rather than linearly.** It is still
exactly 0 and 1 at the window edges and 0.5 at the boundary, so every assertion
the contract makes still holds; only the shape in between differs. A linear
cross-fade reads as a mechanical wipe, which is not the tone this ADR asks for.

## Rejected alternatives

**Rotate on a fixed clock with no configuration.** Simplest, and wrong for
anyone who sleeps outside office hours — the group most likely to be using an
app about mental health at 03:00.

**Derive the period only at read time, storing nothing.** Cleaner in principle.
Rejected because every timeline query, filter and group-by would recompute it
for every row, and the backup format would carry no period at all.

**Let the companion follow mood instead of time.** Considered and rejected:
mood already drives the companion's expression. Making it drive identity too
would mean a rough week visibly takes your friend away, which is the opposite
of gentle.

## Tasks

`T-020` … `T-025` in [`../tasks/`](../tasks/), in that order. `T-024`
(settings) is a cut candidate **only** for the custom-boundary editor; the
basic rotation is never cut.
