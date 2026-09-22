# Selling this legally — DRAFT

> **This is not legal advice.** It is a checklist of the things a solo
> developer needs to look into, in plain language, before charging money for
> this app. None of it has been reviewed by a lawyer or an accountant. Where
> a real decision has to be made — pricing model, company structure, tax
> registration — that decision belongs to the owner, not to this document.
> Last updated: 20 September 2026.

## Where this stands today

**The model is decided.** [ADR 0006](DECISIONS/0006-monetisation.md) was
accepted on 22 September 2026:

- **Free forever:** check-in, notes, habits, timeline, local insights, and
  **manual** export, backup and restore.
- **One paid unlock, "Continuity", €8.99, one-off, no subscription:**
  scheduled encrypted backup to a folder the user picks, restore onto a new
  device, device-to-device transfer.
- **An optional supporter tip**, one-off, unlocking nothing.
- **Local entitlement verification**, knowingly, with no backend.

Still no code: there is no paywall, purchase flow or entitlement check
anywhere in `src/`, and there deliberately will not be until after the closed
test ([T-047](tasks/T-047-continuity-billing.md)). This document is the legal
groundwork that has to be in place before the first sale.

**The art licence blocker is resolved, by removal.**
[ADR 0007](DECISIONS/0007-one-companion.md) drops the commissioned-art route
entirely in favour of one companion drawn as a designed abstract character
needing no external licence ([T-042](tasks/T-042-one-companion.md)). Until that
task lands, the watermarked placeholders are still in the repository and still
must not ship — to production **or to a closed test**, which also goes through
Play review.

## Two different questions

1. **Selling the app itself** (a paid download, no ongoing purchases).
2. **Selling something inside a free app** (subscription, one-time unlock,
   consumable).

**This project is option 2:** a free app with one non-consumable one-time
unlock and one non-consumable tip. Not a subscription, and not a paid download
— a paid download would kill the free tier, which is the entire distribution
strategy, because people have to be able to write in it before they trust it.

Note that the design this document originally assumed — "companions, XP,
unlockables" — no longer exists. XP and unlockables are removed from the UI
([T-045](tasks/T-045-remove-xp-display.md)) and there is one companion, not six
([ADR 0007](DECISIONS/0007-one-companion.md)). What is sold is automation.

## Google Play billing vs. a third-party processor

- **Digital goods and services consumed inside the app** (extra companions,
  cosmetic unlocks, an ad-free tier, a subscription) must, on Android, go
  through **Google Play's own billing system**. This is a Play Developer
  Program Policy requirement, not just a convenience — using Stripe or
  another processor for in-app digital content is a policy violation that
  gets an app rejected or removed, independent of any law.
- A **paid-download price** (charging once to install the app, no further
  purchases) also goes through Play billing — there is no meaningful
  alternative on Android.
- A third-party processor only becomes relevant for something **outside**
  the app entirely — e.g. a companion website selling merchandise — which is
  not on the roadmap and out of scope here.
- **Read the current Play Billing policy directly before deciding anything**
  (developer console → Policy → Billing). Google has changed which content
  categories are exempt from Play billing more than once; do not rely on a
  memory of an older rule.

## EU consumer law

The owner and at least some plausible users are in the EU, so EU consumer
protection applies regardless of where Google is incorporated:

- **14-day withdrawal right (Consumer Rights Directive).** EU consumers can
  cancel a digital purchase and get a refund within 14 days, **unless** they
  explicitly consented to immediate delivery and acknowledged they lose the
  withdrawal right by doing so. Play's checkout flow handles this consent
  step for purchases made through Play billing — but the app's own purchase
  UI (if any) needs to not contradict it, and a subscription's cancellation
  terms need to be stated plainly, not hidden.
- **Price transparency.** The total price, including any tax, must be shown
  before purchase, in the user's currency. Play billing does this for you at
  checkout; do not build a second, competing price display that could
  disagree with it.
- **Digital Services Act (DSA) / Digital Markets Act (DMA).** These mostly
  bind Google as the platform, not a single-developer app with no user-to-user
  content and no advertising. Revisit this if the app ever adds ads, in-app
  messaging between users, or a marketplace — none of which are planned.
- **Distance selling / plain-language terms.** Whatever purchase description
  is shown (in-app or in the Play listing) needs to say clearly what is
  being sold, for how long, and how to cancel — the same standard as the
  tone rule elsewhere in this repo (AGENTS.md), which happens to line up
  with what the law actually wants here.

## VAT and merchant of record

This is the part most likely to be a non-issue in practice, and worth
confirming rather than assuming:

- When sales go through **Google Play billing**, Google is generally the
  **merchant of record** in most jurisdictions for VAT/GST purposes — Google
  collects the tax from the buyer, remits it, and pays the developer net of
  Google's service fee. This is Play's standard model and is why most solo
  developers selling through Play do not separately register for VAT in
  every buyer's country.
- **Confirm this is still true for the owner's country and Google's current
  agreement** before assuming no VAT registration is needed anywhere. Play's
  merchant-of-record terms have varied by region and have changed over time.
- If a future model involves collecting **any** payment outside Play billing
  (a website, a direct subscription), merchant-of-record shifts to the
  developer, and EU VAT (the One-Stop Shop / OSS scheme for digital services
  sold to EU consumers) becomes the owner's problem directly. Not relevant
  under the current Play-billing-only assumption, but worth remembering if
  that assumption ever changes.
- **Income tax on what Play pays out** is separate from VAT and is not
  Google's problem to solve — normal self-employment / business income
  rules apply in the owner's home country. Not itself a Play Console
  question; worth a real accountant regardless of which monetisation model
  is picked.

## Business structure

Not addressed here beyond flagging it: whether to sell as an individual
(sole trader) or through a registered company changes tax and liability
exposure, and it interacts with the Play Console developer account type
(personal vs. organisation), which in turn affects the closed-test
requirements already documented in [docs/RELEASE.md](RELEASE.md). This is a
decision for the owner, ideally taken before, not after, publishing a paid
listing — changing account type later can require a new Play listing.

## What this means for the current roadmap

Nothing here changes any task's priority except by underlining an existing
one: **T-010 (art licensing) blocks release regardless of pricing model.**
If and when a specific monetisation model is chosen, it should get its own
task file with concrete acceptance criteria — this document is background,
not a task.

## Related

- [docs/RELEASE.md](RELEASE.md) — the Play Console setup steps this document
  assumes.
- [docs/PRIVACY.md](PRIVACY.md) — the no-analytics, no-account stance, which
  simplifies several of the questions above (no user accounts to reconcile
  with a payment record, for instance).
- [docs/ASSETS.md](ASSETS.md) / [docs/tasks/T-010-replace-placeholder-art.md](tasks/T-010-replace-placeholder-art.md) —
  the actual release blocker.
