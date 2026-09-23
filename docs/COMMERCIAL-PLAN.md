# The commercial plan, on one page

- **Date:** 22 September 2026
- **Decided by:** the owner, in the re-planning session of 22 September
- **Supersedes:** the revenue assumptions in [ROADMAP.md](ROADMAP.md)

"Profitable" here means **covers its costs and plausibly a few hundred euros a
year**. It does not mean income, and nothing below assumes otherwise.

## The real deadline is mid-October, not 14 December

A closed test must be **running by 2 November** and needs five things. Four had
not started on 22 September:

| Prerequisite         | State on 22 Sep                                  |
| -------------------- | ------------------------------------------------ |
| Signed release build | Blocked — `EXPO_TOKEN` not in repository secrets |
| Store listing        | Not started, was blocked on artwork              |
| Privacy policy       | Draft only                                       |
| Final artwork        | Unlicensed placeholders; Dusk's source unusable  |
| 12 recruited testers | Not started                                      |

Two of those are owner actions that no amount of engineering removes: adding
`EXPO_TOKEN`, and recruiting twelve people. **They are the critical path.**

## The arithmetic at €8.99

Google takes 15% below $1M a year, so a sale nets about **€7.64**.

| Target                      | Sales | Installs at 2% conversion |
| --------------------------- | ----- | ------------------------- |
| Cover year-one costs (~€37) | 5     | ~250                      |
| €300 clear                  | 40    | ~2,000                    |
| €600 clear                  | 79    | ~4,000                    |

Year-one costs are the €25 Play registration plus a domain for the landing
page. **Artwork is €0 under [ADR 0007](DECISIONS/0007-one-companion.md)**, and
that is the decision that makes this arithmetic work at all: a €300–600
commission would have needed roughly 2,000 installs before breaking even,
which is more than this app can be relied on to get in its first year.

**Covering costs is very likely. A few hundred euros is a stretch, and it is
a distribution problem, not a product one.** No further scope-cutting moves
that number; only the listing, the landing page and the launch posts do.

Two honest notes. Conversion of 2% is a plausible mid-point for a one-off
unlock, not a measured figure — the first real number arrives after launch.
And the **supporter tip may out-earn the unlock**: the audience for a
local-first tracker with no telemetry is disproportionately the audience that
pays for that stance. The tip gets equal billing in the UI, not a footnote.

## What is being sold

One paid unlock, **Continuity**, €8.99, one-off, no subscription. Automatic
scheduled encrypted backup to a folder the user picks, restore onto a new
device, and device-to-device transfer. Manual export, manual backup and manual
restore stay free forever. Full reasoning in
[ADR 0006](DECISIONS/0006-monetisation.md).

**Billing is not on the critical path.** The closed test ships free; Continuity
lands after. Revenue code near a deadline this tight buys nothing.

## Revised sequence to 2 November

| By     | What                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| 24 Sep | Owner adds `EXPO_TOKEN`. Unblocks T-030 → T-031 → T-040                      |
| 28 Sep | Abstract companion designed and merged (T-042). Unblocks the listing         |
| 5 Oct  | Signed build on a real device (T-030), CI artifacts (T-038), version (T-039) |
| 12 Oct | Local insights (T-043), crisis resources (T-044), recovery key (T-035)       |
| 19 Oct | Privacy policy final (T-018), listing copy and screenshots (T-019)           |
| 26 Oct | Data Safety form, landing page (T-046), twelve testers recruited             |
| 2 Nov  | **Closed test starts**                                                       |

## What is dropped to make that fit

Cut or moved post-launch, each with a reason in its task file: Notion sync
(T-016), digital footprint inventory (T-017), calendar sync (T-015), XP and
level display (T-045), unlockables UI (T-002), idle animations (T-013), app
typeface (T-034), backup web viewer (T-036), habits polish (T-001), period
settings (T-024) and the mocked-clock e2e tests (T-025).

**If the sequence still does not fit**, drop in this order: the landing page
(T-046) — a listing alone can carry a closed test; then local insights (T-043),
which is the best reason to recommend the app but not a launch blocker; then
the recovery sheet (T-026). **Never cut:** encryption, the crisis screen, the
privacy policy, the Data Safety form, or the recovery key format.
