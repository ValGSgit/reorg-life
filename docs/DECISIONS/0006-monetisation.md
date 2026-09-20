# ADR 0006 — How the app charges money

- **Status:** proposed — needs the owner's decision
- **Date:** 2026-09-20
- **Affects:** `app.json`, a future billing module, `PRIVACY.md`, store listing
- **Builds on:** [COMMERCIAL.md](../COMMERCIAL.md), which covers Play billing
  policy, EU consumer law and VAT

## Context

The owner wants a paid step "at some point". Nothing in the roadmap schedules
it and no billing code exists.

Two constraints shape every option, and they are unusual enough that the
normal answer does not apply.

**There is no backend.** Play Billing hands the app a purchase token. Verifying
it properly means a server call to the Play Developer API. With no server, the
app can only check locally, which is spoofable by anyone who wants to bother.
Adding a verification endpoint would be the first server this project has ever
had, and would need a line in `PRIVACY.md` saying so.

**There are no running costs.** The app has no servers, no storage, no API
bills. A monthly charge invites a fair question — what is the money for? —
that a local-first app cannot answer the usual way.

## The options

### A. One-time purchase (paid app, or free with a one-time unlock)

The buyer pays once. Play records the entitlement against their account and
restores it on reinstall.

- Fits a product with no running costs: paying for a thing, not a service.
- Weak local verification matters much less — the worst case is a small number
  of people using it free, not recurring revenue leaking.
- No churn, no failed payments, no "what am I still paying for" moment.
- Ceiling on revenue, and no income from people who arrive later.

### B. Subscription

- Needs ongoing delivered value, and the obvious candidate is **cloud backup
  or sync** — which is exactly what `ADR 0002` is wrestling with and what
  would end the local-first promise. That is a product decision, not a pricing
  one.
- Weak client-side verification is a genuine revenue problem here, because the
  thing being protected recurs.
- EU buyers get a 14-day withdrawal right (see `COMMERCIAL.md`).
- Highest revenue if the value is real.

### C. Free, with an optional one-time "support the developer" purchase

- No paywall anywhere, so the ethical problem below disappears entirely.
- Lowest revenue, and highly variable.

## The part that is not about money

**A paywall in a mental-health app is a door that can be locked on someone's
worst day.** Whatever is chosen, the core loop — check-in, notes, habits,
timeline, backup, export — should never be behind it. Someone who stops paying
must keep access to what they have already written, and must be able to export
it. Anything else makes the app a hostage-taker for a personal record, which
would be both wrong and a reputational problem that no pricing model survives.

This also rules out the common "your data is locked until you resubscribe"
pattern outright.

## Recommendation

**Option A, a one-time purchase, with the core always free.** Charge for
things that are genuinely extra — additional companions, accessories, themes —
and never for check-ins, notes, habits, export or backup.

It fits a product with no running costs, sidesteps verification weakness,
avoids the subscription's "what am I paying for" problem, and keeps the door
open on bad days.

**If a subscription is wanted anyway**, it needs a service attached, which
means deciding the sync question in `ADR 0002` first. Those two decisions are
the same decision wearing different hats.

## Timing

**Not before the closed test.** Adding billing before 2 November would
complicate Play review, confuse testers, and put revenue code on the critical
path to a deadline that is already tight (see `ROADMAP.md`). The earliest
sensible point is after the 14 December launch, once there are real users to
ask.

## Consequences

- Whichever option wins, `PRIVACY.md` needs a line about what Play tells us
  about a purchase, since that is the first time any third party learns
  anything about a user.
- The store listing and Data Safety form must match.
- Refunds and EU withdrawal handling need a written policy before the first
  sale, not after the first complaint.
- If a backend is ever added for verification, "no backend" leaves `AGENTS.md`
  and `README.md`, and that is a much larger change than a price.

## Open questions for the owner

1. One-time purchase, subscription, or optional support?
2. If subscription — what does it deliver that costs us something to provide?
3. What, specifically, is allowed to sit behind the paywall? The
   recommendation is cosmetics only.
4. Is a verification backend acceptable, given it would end "no backend"?
