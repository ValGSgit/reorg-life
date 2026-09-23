# ADR 0006 — How the app charges money

- **Status:** accepted
- **Date:** 2026-09-20, revised and accepted 2026-09-22
- **Decided by:** the owner
- **Affects:** `app.json`, a future billing module, `PRIVACY.md`, `AGENTS.md`
  (one protected product rule — see below), store listing
- **Builds on:** [COMMERCIAL.md](../COMMERCIAL.md), which covers Play billing
  policy, EU consumer law and VAT
- **Supersedes:** the recommendation in the 20 September draft of this ADR,
  which said to charge for cosmetics only. See "What changed and why".

## Context

Two constraints shape every option, and they are unusual enough that the
normal answer does not apply.

**There is no backend.** Play Billing hands the app a purchase token.
Verifying it properly means a server call to the Play Developer API. With no
server, the app can only check locally.

**There are no running costs.** No servers, no storage, no API bills. A
monthly charge invites a fair question — what is the money for? — that a
local-first app cannot answer the usual way.

A third constraint arrived on 22 September, from a business review: as
previously scoped the project earns approximately nothing, because cosmetics
in a category nobody buys cosmetics in is not a product. That review is the
reason this ADR was reopened.

## Decision

**One paid unlock, called Continuity. €8.99, one-off, no subscription.**

Continuity contains:

- Automatic scheduled encrypted backup to a folder the user chooses in their
  own storage or cloud, via the Android Storage Access Framework. We never
  host it, never see it, and never learn where it went.
- Restore onto a new device.
- Direct device-to-device transfer.

Alongside it, an **optional supporter tip**, also one-off, unlocking nothing
functional. It gets equal billing in the UI rather than being buried: the
audience for a local-first tracker with no telemetry is disproportionately the
audience that pays for that stance, and the tip may well out-earn the unlock.

### Free forever, and never paywalled

Check-in, notes, habits, timeline, local insights and charts, **manual**
encrypted export, **manual** backup and **manual** restore. Anyone who stops
paying keeps everything they have written and can still get all of it out by
hand.

**The free tier can always export and import. The paid tier removes the
remembering.** That sentence is the whole model, and it is the test any future
change to this ADR has to pass.

## Why not a subscription

Two reasons worth writing down, because "everyone subscribes now" will come up
again:

1. **There is no server cost to fund.** A subscription with nothing recurring
   behind it is a charge for the absence of a charge.
2. **Renewal state cannot be verified without a backend.** A one-off
   entitlement that is checked wrongly costs one sale. A subscription that is
   checked wrongly leaks revenue every month, forever.

## Local verification, knowingly

Entitlement is verified **locally**, against the Play Billing purchase on
device. Google recommends server-side verification and **we are knowingly not
doing it.**

The reasoning, recorded here so nobody "fixes" it later:

- At €8.99 for a one-off, the people capable of spoofing a local check are
  people who were never going to pay. The loss is theoretical.
- A verification endpoint would be the first server this project has ever had.
  It would end "no backend", need a line in `PRIVACY.md`, and contradict the
  architecture that is the app's single strongest marketing claim.
- The downside of being wrong is bounded and small. The downside of adding a
  server is unbounded and permanent.

**Do not add server-side verification without a new ADR superseding this
section.** It is not an oversight.

## Why €8.99

At these volumes revenue is **volume-bound, not price-elastic**. Roughly the
same small number of people buy at €2.99 as at €8.99, because the decision is
"do I trust this app with my journal", not "is this cheap". Tripling the price
therefore roughly triples the revenue, and €8.99 still reads as a one-off
coffee-and-a-half rather than software.

The arithmetic is in [COMMERCIAL-PLAN.md](../COMMERCIAL-PLAN.md). In short: a
sale nets about €7.64 after Google's 15%, year-one costs are about €37, so
five sales cover everything and forty clear €300.

Not higher than €9.99, because above that the buyer starts comparing against
subscriptions with servers behind them, and we lose that comparison.

## The part that is not about money

**A paywall in a mental-health app is a door that can be locked on someone's
worst day.** Continuity is deliberately shaped so the door has no lock: every
piece of writing is retrievable by hand, free, forever. What is sold is
convenience — not access, not storage, not the right to read your own life.

This also rules out, permanently, the "your data is locked until you
resubscribe" pattern.

## Protected rule this changes — owner sign-off recorded

`AGENTS.md` protects: _"The core is never behind a paywall. Check-in, notes,
habits, timeline, export and backup stay free."_

As written, that forbids Continuity, because scheduled backup is backup. The
owner signed off on 22 September on narrowing it to:

> **manual** export, **manual** backup and **manual** restore stay free
> forever; only scheduling, automation and device-to-device transfer are paid.

The ethical core is untouched: nobody is ever locked out of their own writing.

## What changed and why

The 20 September draft recommended **cosmetics only** — extra companions,
accessories, themes. That is superseded, for two reasons:

1. **Nobody buys cosmetics in this category.** It is a sound instinct borrowed
   from products with a social surface. This app has none by design, and
   ADR 0005 forbids adding one.
2. **[ADR 0007](0007-one-companion.md) cuts the app to one companion.** The
   cosmetic catalogue it assumed no longer exists.

The draft's ethical reasoning is kept in full. Only the answer to "what is
extra enough to charge for" changed, from decoration to automation.

## Timing

**Not before the closed test.** Billing stays off the critical path to
2 November: Play review gets simpler, testers are not confused by a purchase
flow, and revenue code is not being written against a deadline that is already
tight. Continuity lands after the closed test is running.

## Consequences

- `PRIVACY.md` needs a line about what Google learns from a purchase, since
  that is the first time any third party learns anything about a user.
- The store listing and the Data Safety form must match.
- Refund and EU withdrawal handling needs a written policy before the first
  sale. See [COMMERCIAL.md](../COMMERCIAL.md).
- Scheduled backup needs a Storage Access Framework permission and a persisted
  folder grant. That is a real piece of engineering, not a flag, and it gets
  its own task.
- `AGENTS.md` protected rule reworded as above.

## Rejected alternatives

**Cosmetics only.** Superseded — see above.

**Subscription.** No recurring cost to fund, and unverifiable without a
backend.

**Paid download.** Kills the free tier, which is the entire distribution
strategy: people have to be able to write in it before they trust it.

**Ad-supported.** Contradicts the privacy promise outright, and advertising in
a mental-health context is its own ethical problem.
