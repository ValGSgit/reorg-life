Re-planned the project around covering its costs, after a business review
concluded that as scoped it earned approximately nothing. Six owner decisions,
all recorded as ADRs rather than left in a chat.

**What is sold** changed from cosmetics to continuity. ADR 0006 moves from
proposed to accepted: one €8.99 one-off unlock for scheduled encrypted backup,
restore and device-to-device transfer, plus a supporter tip. Manual export,
backup and restore stay free forever, so nobody is ever locked out of their own
writing. Entitlement is verified locally and knowingly, with the reasoning
written down so nobody "fixes" it into a backend later. Billing stays off the
critical path and lands after the closed test.

**The artwork came off the critical path**, which is the change that makes the
arithmetic work. ADR 0007 supersedes the companion-identity half of ADR 0001:
one companion the user names, with the period driving its environment rather
than its identity, drawn as a designed abstract character needing no licence.
The repo turned out to have two usable creatures rather than three — Dusk's
sheet has "Stage 1…5" baked into it — and zero generation credits, while the
store listing was blocked on the art and the closed test blocked on the
listing. A €300–600 commission needed roughly 2,000 installs to break even,
which is more than a first year can be relied on to deliver, so the art bill
went to zero and T-010 became a post-launch upgrade to buy with the first
revenue. `src/domain/companion.ts` is untouched: periods, blend and the
cross-fade all survive.

**Charts are explicitly allowed.** "No analytics" now says what it always
meant — no data leaving the device — and rendering someone their own data
locally is not analytics. T-043 adds mood over time, by period and by life
area, free, because it is the best reason anyone has to recommend the app.
Play Console is recorded as the measurement surface, needing no code.

**Cut, each with a reason in its task file:** Notion sync, digital footprint
inventory, calendar sync, XP and unlockables in the UI, animations, typeface,
backup web viewer, habits polish, mocked-clock e2e tests and placeholder-sheet
processing. Dropping Notion removes the only network path, which is worth more
in the listing and the Data Safety form than the feature was worth.

**Promoted to launch-blocking:** recovery key format (T-035) and the recovery
sheet (T-026), both of which needed ADR 0002 and ADR 0003 signed off before
they could be worked at all, and both now are; plus a static offline
crisis-resources screen (T-044) with no detection and no risk scoring, since
scoring would push the app toward medical-device territory.

One piece of the brief was pushed back on and the push-back was accepted:
deleting the XP _number_ is right, deleting `src/domain/xp.ts` is not, because
the companion's growth needs an accumulating quantity behind it and that
quantity already exists with tests. T-045 removes a display, not a mechanism.

Also added a medical-claim rule to AGENTS.md — a forbidden word list, the EU
MDR intended-purpose reasoning, and a ban on scored clinical instruments — so
it survives being forgotten.
