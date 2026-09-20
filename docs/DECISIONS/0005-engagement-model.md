# ADR 0005 — Engaging, not coercive

- **Status:** proposed — needs the owner's sign-off
- **Date:** 2026-09-20
- **Affects:** every screen, notification copy, unlockables, `AGENTS.md`

## Context

The owner wants the app to be **engaging** — people should want to come back,
and the current build is plainer than it needs to be. That is a fair ask: an
app nobody opens helps nobody, and there is real room between "gentle" and
"forgettable".

The word used was "addictive", which is worth pulling apart before building
anything, because the two available routes have the same short-term metric and
opposite long-term outcomes.

**Engaging**: people return because it is worth returning to. Craft, warmth, a
companion they like, a timeline worth re-reading.

**Coercive**: people return because leaving has been made uncomfortable.
Streak-loss anxiety, variable rewards, loss aversion, notification hooks.

The second is easier to build, measurably works in the short term, and is
already forbidden by `AGENTS.md` — "no guilt, no nagging, no _don't break your
streak_". This ADR exists because "make it addictive" and that rule cannot
both stand, and the conflict should be settled deliberately rather than
resolved screen by screen by whoever is writing copy that day.

## Decision

**Pursue engagement through craft and warmth. Do not adopt coercive
mechanics.** The existing product rules stand unchanged.

This is not a decision to stay plain. Several things below are more
interesting than what is built today.

### What we will build

- **The companion rotation** (ADR 0001). Three characters who arrive at
  different times of day is already the most engaging thing here and is barely
  exploited. Cross-fades, per-period background tints, expressions that follow
  recent check-ins.
- **Craft**: idle animation, tactile feedback, a considered sound or two, art
  worth looking at. All with a reduced-motion path.
- **A timeline worth re-reading.** For a journal this is the real retention
  engine — "a year ago today" is engaging precisely because it is _your own
  material_, not a mechanic.
- **Unlockables that arrive with time, not performance** — already the rule,
  and the design copy states it well: "Accessories arrive with time spent, not
  with performance."
- **Honest progress.** "You have written 40 times" is a fact and can feel
  good. It is not a score and nothing is compared to anyone.
- **Reminders in the companion's voice**, easy to turn off, that do not
  reference what was missed.

### What we will not build

- Streak-loss pressure of any kind. No "don't break your streak", no countdown,
  no at-risk state, no fire icons.
- Variable or random rewards. No loot boxes, no surprise drops timed to pull
  someone back.
- Loss aversion. Nothing earned is ever taken away.
- Artificial scarcity or limited-time anything.
- Notifications designed to pull rather than remind.
- Social comparison, leaderboards, friend streaks.
- Guilt copy anywhere, including the empty states, which is where it usually
  creeps in.

## Why

**The product is for people having a hard time.** Coercive mechanics work by
generating a small amount of anxiety and then relieving it. Aiming that at
someone using a mental-health app on a bad week is the specific harm this app
was built to avoid, and it is what makes the forgiving streak the whole point
rather than a nicety.

**It is also the weaker commercial choice.** Pressure-based retention produces
resentment, and resentment produces uninstalls, one-star reviews and — once
there is a subscription (ADR 0006) — refunds and chargebacks. Warmth retains
more durably in a category people quit precisely because it started nagging.

**And it is a concrete store and press risk.** Coercive mechanics plus streaks
plus a mental-health category plus a subscription is the combination that
attracts Play policy attention and unflattering coverage. Not a reason on its
own, but worth knowing while there is still a choice.

## Consequences

- `AGENTS.md` gains an engagement rule so the distinction is testable, not a
  matter of taste, and so a future contributor told to "make it more engaging"
  has this list rather than their instincts.
- Some proven mechanics are off the table. Retention will likely be lower than
  a coercive design would produce in the first month. That is the trade being
  made, deliberately.
- Reminder copy already needs a guilt-word test (T-024). That test becomes the
  enforcement point for part of this.
- No measurement change. The app has no analytics (`PRIVACY.md`) and this
  decision does not introduce any, so "engaging" will be judged by tester
  feedback and reviews rather than a retention curve.

## Rejected alternatives

**Adopt coercive mechanics for launch and soften later.** Rejected: it is the
opposite of how trust works, the first cohort is the one whose word of mouth
matters most, and nothing in the roadmap forces the tradeoff.

**A middle path — keep streaks pressure-free but add variable rewards.**
Rejected as the same mechanism wearing different clothes. Randomised reward
timing is the core of compulsion-loop design; it would be the one thing here
genuinely engineered to override someone's judgement about when to stop.

**Leave it unresolved and decide per screen.** Rejected. That is what produced
this conflict, and copy written under a deadline defaults to the pushy option.

## Open question for the owner

If the intent really was compulsion-loop mechanics rather than "make it less
plain", say so and this ADR gets rewritten to record that instead. It would
mean amending the protected product rules in `AGENTS.md`, and the tone tests
would need to change with them — which is exactly the kind of change that
should be explicit rather than arrived at.
