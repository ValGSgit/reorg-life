# Audience and launch communications

Companion to [ROADMAP.md](ROADMAP.md). Checks in this document were run on
**20 September 2026**; the method and its limits are recorded at the end so
anything here can be re-run rather than trusted.

---

## The first goal is not launch

The roadmap's binding constraint is a closed test with **12+ testers running by
2 November**. That is the only marketing deadline that matters before December,
and it is worth separating from audience-building, because the two get confused
and the confusion is expensive.

**You do not need an audience to find 12 testers.** Twelve people is a number
you can reach through people who already know you, one honest post in one
relevant community, and a group chat. Treating "build an audience" as a
prerequisite turns a two-week task into a three-month one and puts the whole
schedule at risk.

So: two separate tracks, in this order.

| Track           | Goal                               | When        | Success looks like                                             |
| --------------- | ---------------------------------- | ----------- | -------------------------------------------------------------- |
| **A. Testers**  | 12+ opted in and staying opted in  | now → 2 Nov | The closed test clock starts and does not restart              |
| **B. Audience** | People who want this when it ships | W7 onward   | A handful of genuinely interested people, not a follower count |

Track B should not start until Track A is safe. Writing publicly before there
is something to show costs time and spends the one "here is a new thing"
moment you get.

### Why the tester count needs slack

The 14 days are continuous and counted by Google. If the opted-in count drops
below 12 it restarts, and a restart in mid-November eats the buffer that exists
for the production review.

Ask **20 people** to land 15 yeses to keep 12 opted in. People agree and then
forget to click the opt-in link, which is the failure mode to design against.

### The friction nobody expects

Closed testing works from a list of **Google account email addresses** (or a
Google Group). So the ask is not "would you try my app" — it is "would you send
me the Gmail address on your phone, and then click a link I send you".

That is a bigger request than it sounds, especially for an app about mental
health, where people may not want the association sitting in a list you hold.
Two things help:

- Ask for the address in a one-to-one message, not a public post.
- Say plainly what you can and cannot see. You cannot read anything they write
  in the app — it never leaves their phone. That is true, it is unusual, and it
  is the most reassuring thing you can say.

A Google Group is worth considering: people join it themselves and you never
hold the list. It is one more step for them and one less for you.

---

## Naming: decide by 4 October, not later

**This has a hard deadline that is not currently in the roadmap.** The Android
package name `com.valgs.reorglife` is in `app.json`, and
[RELEASE.md](RELEASE.md) records that it **cannot be changed once the app is
created in Play Console**. Play Console setup happens in W5–6. So the name has
to be settled before then — realistically by the end of W1–2, **4 October**.

Renaming after the first upload means a new listing, a new package, and losing
any install history. Before the first upload it costs a find-and-replace.

### What "ReorgLife" actually collides with

| Check                     | Result                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `reorglife.com`           | **Registered and live** — an apparel brand                                          |
| `@reorglife` on Instagram | **Taken** by that same apparel brand                                                |
| `reorglife.app`           | **Available**                                                                       |
| Apple App Store           | No exact or near match                                                              |
| Google Play               | No exact match                                                                      |
| Company names             | "The Reorg Life LLC" (New York); "the re/org life", an NYC home-organising business |
| Adjacent brand            | **Reorg** — an established financial-research company with its own iOS app          |

Two problems, one practical and one about meaning.

The practical one: the `.com` and the Instagram handle both belong to an active
business. For Track B that is a permanent tax — every time someone searches the
name they find a clothing brand, and the handle you would most want is gone.

The one about meaning: in ordinary business English a **"reorg" is a corporate
restructuring**, which is to say layoffs. For an app whose entire design
position is calm, forgiving and non-judgemental, the name imports exactly the
wrong feeling. "ReorgLife" reads like something done _to_ you.

That is a judgement rather than a measurement, and you may simply like the
name — it is your project and the association may not land the same way for
you. But it is worth knowing before the package name is frozen.

### Alternatives that were checked

Every short dictionary word was gone. `tend`, `sprig`, `stillpoint`,
`quiethours`, `morrow`, `daykeep`, `dayling`, `lifegarden`, `hearthly`,
`softday`, `daykeeper`, `dayjar`, `quietday` — all registered in both `.com`
and `.app`. That is normal now and not worth fighting.

Three also had direct in-store collisions, which rules them out regardless:

| Name           | Why it is out                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------- |
| **Tend**       | "Tend: Couples & Relationships" (Lifestyle) and "Tend Dental" (Medical) on the App Store       |
| **Sprig**      | Five apps, including "Sprig: To-Do & Checklists" — same category                               |
| **Stillpoint** | Five apps, including "stillpoint – Breathing & Sleep" in Health & Fitness — the exact category |

What survived:

| Candidate     | `.app`   | `.com`               | App Store      | Google Play               | Notes                                            |
| ------------- | -------- | -------------------- | -------------- | ------------------------- | ------------------------------------------------ |
| **Slowleaf**  | **free** | taken                | no match       | no match                  | Calm, fits the life-garden metaphor              |
| **Duskward**  | **free** | taken                | no exact match | no match                  | Skews gaming; names only one of three companions |
| **Softleaf**  | **free** | taken                | no exact match | **developer name in use** | "Softleaf Studio" already publishes on Play      |
| **ReorgLife** | **free** | taken (active brand) | no match       | no match                  | Status quo; see above                            |

Two findings worth carrying into any future shortlist:

- **"Leaf" names pull cannabis associations in app stores.** Searching
  "Softleaf" on the App Store returns dispensary apps. Not disqualifying, but
  it shapes what the store's own recommendation engine puts you next to.
- **"Dusk" names pull gaming and horror** — "Duskwood", "Duskfall", "As Dusk
  Falls". Also not ideal next to a mental-health app.

Which leaves **Slowleaf** as the strongest alternative found, with the cannabis
adjacency as its known cost.

### Recommendation

Rename, if you are going to, before 4 October. My reasoning: the `.com` and the
Instagram handle are both gone to an active brand, and "reorg" means layoffs —
those are ongoing costs paid every week of Track B, in exchange for keeping a
name that nothing technical depends on yet.

But this is your call and not a blocker. If you keep ReorgLife, buy
`reorglife.app` now, before this document makes it interesting to anyone else,
and accept that the social handles will need a qualifier.

Whatever you choose, **buy the domain the same day you decide.** The gap
between deciding and registering is where names get lost.

---

## Email addresses and accounts

Short answer: **one real mailbox on your own domain, with per-platform aliases
pointing at it.** Not one address for everything, and not five separate
inboxes.

### Why not one address for everything

Two reasons, and only one of them is security.

The one that matters most is that **Google Play requires a public support email
on the store listing**. Everyone who installs the app can see it. Given this is
a mental-health app published by an individual, that address must not be your
personal one — it links your name to strangers' support mail forever, and
[PRIVACY.md](PRIVACY.md) still has that contact line marked as to-be-added.

The second is leak tracing: when `instagram@yourdomain` starts receiving spam,
you learn something about Instagram.

### Why not five separate mailboxes

Because the protection is imaginary. Separate inboxes do not stop an account
takeover — **unique passwords in a password manager and 2FA on every account
do**. What separate inboxes reliably produce is five places to forget to check,
and five recovery paths to lose.

### What to actually set up

| Address                              | Use                                                           | Public? |
| ------------------------------------ | ------------------------------------------------------------- | ------- |
| `hello@` (or `support@`)             | Play listing, privacy policy contact, user mail               | **Yes** |
| `instagram@`, `tiktok@`, `reddit@` … | One alias per platform account, all routing to the same inbox | No      |
| A separate personal account          | Recovery address for the domain registrar                     | No      |

Three things that bite later:

- **Aliases die with the domain.** If the registration lapses you lose every
  account whose recovery runs through it. Set auto-renew, and keep a
  non-domain recovery address on the registrar itself.
- **Do not make the app's support address the recovery address for the
  developer account.** A published address is a phishing target.
- Keep the Play Console developer account on an address you would keep if you
  ever handed the project on.

Practically: the domain you buy for the name gives you all of this. A mailbox
costs a few euros a month, or you can start with forwarding-only and upgrade
when real mail arrives.

---

## Platforms: what fits, what does not

The filter is not reach. It is whether the format rewards the thing the product
is trying to be.

### Genuinely good fits

**Reddit** — the best channel for Track A, by a distance. The app's unusual
properties are exactly what these communities find interesting: no backend, no
analytics, SQLCipher, data that never leaves the phone. Relevant places include
r/androidapps, r/privacy, r/degoogle and r/selfhosted for the technical angle,
and habit and mental-health communities for the product one.

The rule that matters: **most subreddits ban self-promotion**, and the ones that
allow it usually have a specific day or thread for it. Read the sidebar, and
post as someone who built a thing and wants it torn apart, not as someone
marketing. "I built a habit tracker that forgives you for missing a day, and it
has no server — would 12 of you break it for me?" is a real post. It is also
almost exactly your tester ask.

**Hacker News, as a Show HN** — the architecture is genuinely HN-shaped:
local-first, no backend, encrypted at rest, an honest write-up of why backups
are unrecoverable by design. You get roughly one of these, so spend it in W9–10
when the web preview is presentable and the privacy policy is live, not now.

**Mastodon and the wider fediverse** — small, but disproportionately made of
people who care about local-first and no-analytics software. Low effort, good
signal, and no algorithm to fight.

**A small Discord or group chat** — not for finding testers but for _running_
the closed test. Twelve people need somewhere to report "the reminder fired
twice" without emailing you. It also lets them see each other, which keeps
opt-ins from quietly lapsing.

### Fits for Track B, but slowly

**Instagram** — you have three illustrated companions who change with the time
of day. That is genuinely good visual material and the format suits a calm
brand. It will not find you testers by November; it builds recognition over
months. Worth starting in W7, not before.

**Product Hunt** — a launch-day channel, not a recruitment one. Park it until
December.

### Poor fits, and why

**TikTok, Reels and Shorts.** The formats are tuned for retention, and what
retains is urgency, streak pressure and hooks. Your product explicitly rejects
all three — `AGENTS.md` lists "no guilt, no nagging, no _don't break your
streak_" as a product rule that tests protect. You would be building an
audience on a promise the app deliberately does not keep. There is also real
policy risk: mental-health content is heavily moderated, and anything that
sounds like a therapeutic claim can be suppressed or get the account actioned.

**YouTube.** Not a bad fit in principle, but the production cost per video is
high and the payback is slow. There is no version of this that helps before 2
November.

**Facebook.** Mental-health support groups are strict about promotion, and
joining one to recruit testers would be using a vulnerable community as a
funnel. Skip it. The values mismatch with a privacy-first product is also hard
to explain away.

**Paid ads anywhere.** You have no landing page, no listing, and nothing to
measure with — the app has no analytics by design. Money spent now buys
nothing you could learn from.

---

## Where this sits in the roadmap

The current roadmap puts "recruit 12+ testers" in W5–6 (19 Oct – 1 Nov), the
same fortnight the test must start. That is too tight: Play Console identity
verification alone can take days to weeks, and you cannot invite anyone until
the account exists and the app is created.

This track runs **alongside** the existing engineering weeks and changes none
of them.

| Weeks     | Dates          | Audience track                                                                                                                                                                                                                       |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **W1–2**  | 21 Sep – 4 Oct | **Decide the name and buy the domain — package name freezes after this.** Create the Play Console account and **start identity verification immediately**; it is the long pole. Set up the mailbox and aliases. Draft the tester ask |
| **W3–4**  | 5 – 18 Oct     | Write the list of 20 people to ask. Ask them, one to one. Collect Google addresses or set up a Google Group. Create the Discord or group chat. Take first screenshots with seeded demo data (never real entries)                     |
| **W5–6**  | 19 Oct – 1 Nov | Upload the closed-test build. Send opt-in links. **Chase opt-ins — this is the step that slips.** Confirm Play actually counts 12+. **Aim to start 26 Oct, a week early**                                                            |
| **W7–8**  | 2 – 15 Nov     | Test running. Now start Track B: first Mastodon and Reddit posts, Instagram account opens. Keep testers warm with a short note on what changed                                                                                       |
| **W9–10** | 16 – 29 Nov    | Store listing copy, screenshots, privacy policy live at a public URL. Show HN once the web preview is presentable                                                                                                                    |
| **W11**   | 30 Nov – 6 Dec | Write launch notes. Ask testers if any would say something quotable. No new channels                                                                                                                                                 |
| **W12**   | 7 – 13 Dec     | Submit. Prepare Product Hunt for launch day                                                                                                                                                                                          |
| **—**     | 14 – 31 Dec    | Launch. Reply to everyone who writes in                                                                                                                                                                                              |

### Why start the test a week early

If opted-in testers drop below 12 the 14-day clock restarts. Starting 26 October
gives one restart's worth of slack before the 2 November deadline becomes a
problem. Starting on 2 November itself means any wobble pushes into the
production review window.

---

## Draft listing, landing and launch copy — 22 September 2026

Written for [T-019](tasks/T-019-store-listing.md) and
[T-046](tasks/T-046-landing-page.md). **Lead on periods and privacy, not on
the companion.** The companion is what makes people stay; privacy is what makes
them install.

### Forbidden words — check every draft against this

_treat · cure · therapy · therapeutic · clinically proven · diagnose ·
"reduces anxiety" · "manage your depression"_ — and any other outcome or
symptom-improvement claim, including a testimonial implying one. Under EU MDR,
qualification as a medical device turns on **intended purpose**, and it is
claims that drag a product in. Never add a scored clinical instrument (PHQ-9,
GAD-7 or similar). This is a protected rule in AGENTS.md.

### Play title (30 characters)

`ReorgLife: private mood diary` — 29.

### Short description (80 characters)

`A mood and habit diary that never leaves your phone. No account, no cloud.`

74 characters. It leads on the unusual true thing and makes no claim about how
anyone will feel.

### Full description

> **Your day has a shape. Most trackers only see the date.**
>
> ReorgLife lets you check in up to three times a day — morning, afternoon and
> night — so "a rough morning that got better" is something you can actually
> write down, and later read back.
>
> **Nothing leaves your phone.**
>
> No account. No sign-up. No cloud. No analytics, no telemetry, no advertising
> ID. There is no server, so there is nothing to breach and nobody to sell.
> Your writing is stored encrypted on your own device.
>
> **What you get**
>
> · Check in by time of day, not just by date
> · Notes and a timeline worth re-reading
> · Habits with forgiving streaks — one missed day never breaks anything
> · Charts of your own patterns, drawn on your phone from your own data
> · Encrypted export and restore, free, forever
> · A companion you name, that grows as you use the app
>
> **Forgiving on purpose**
>
> No guilt, no nagging, no "don't break your streak". A quiet week is
> information, not a failure. There are no points to lose.
>
> **Free, and honest about what is paid**
>
> Everything above is free and stays free. One optional one-off purchase,
> Continuity, automates your backups to a folder you choose. You can always
> export and restore by hand without it — it just removes the remembering.
>
> ReorgLife is a diary, not a medical device, and not a substitute for
> professional support.

### Screenshots plan

Eight, seeded with demo data — **never a real entry**. Set the device clock per
shot so the period is right.

1. Check-in, morning — the three-periods idea, immediately
2. Timeline grouped by day and period — the thing competitors cannot show
3. Insights: mood by period — the reason to recommend it
4. Insights: mood over time
5. Habits with a forgiven missed day visible, captioned as forgiven
6. The companion at night — warmth, after the substance
7. Settings showing "no account, nothing uploaded"
8. Encrypted export with the recovery key panel

Caption each in plain language. No claim about outcomes anywhere.

### Landing page

One page. Same title and short description, the eight screenshots, a link to
Play, a link to the repository, and the privacy policy at a stable URL because
Play requires one.

### Launch posts

Communities where this audience actually is: privacy-focused, FOSS-adjacent,
and mental-health-tooling spaces that allow self-promotion. **Read each set of
rules first and post under them** — a removed post costs more than it earns.

Lead with the verifiable claim, not the pitch:

> I built a mood and habit diary that has no account and no server. It stores
> everything encrypted on the phone, and the charts are drawn on-device from
> your own data. It checks in by time of day rather than by date, which turned
> out to be the part I actually wanted. Android, free, source is open. Happy to
> answer anything about the crypto or the storage model.

Do not post the same text everywhere on the same day. Answer every reply for
the first 48 hours — that is the whole growth loop, and it costs nothing but
attention.

### Why distribution, not features, is the lever

At €8.99 a sale nets about €7.64. Covering costs needs about five sales;
€300 clear needs about forty, which is roughly 2,000 installs at a 2%
conversion. No further feature moves that number. The listing, the landing
page and these posts are the only things that do. See
[COMMERCIAL-PLAN.md](COMMERCIAL-PLAN.md).

---

## Tone rules for anything published

The product's tone is a requirement, and marketing copy is the first place it
usually breaks.

**Do not:**

- Use streak pressure as a hook — "don't break your streak", "day 47!",
  "keep it alive". The app forgives a missed day on purpose; saying otherwise
  in an ad misrepresents it.
- Use hustle or optimisation framing — "level up your life", "10x your
  routine", "the system high performers use". Wrong product, wrong reader.
- Make health claims. "Reduces anxiety", "clinically", "therapy in your pocket"
  are false, and they are also a store-policy problem and a regulatory one.
- Use anyone's real entries in a screenshot. Seed demo data instead.
- Imply urgency you do not have. There is no scarcity here.

**Do:**

- Describe what it does, plainly. "A place to note how the day went. It stays
  on your phone."
- Lead with the unusual true thing — no account, no server, nothing leaves the
  device. It is the most interesting fact about the app and it is verifiable.
- Say what it is not. Not a therapist, not a medical device, not a productivity
  system.
- Be honest that backups cannot be recovered without the key. It is a real
  trade-off, and saying so up front builds more trust than discovering it later
  would cost. (If [ADR 0002](DECISIONS/) changes this, update the copy.)

A useful test, borrowed from the product rules: **would this sentence make
someone feel worse on a bad day?** If yes, rewrite it.

---

## Measuring without breaking the privacy promise

The app has no analytics and will not get any — it is a protected product rule
and adding some to measure a campaign would contradict
[PRIVACY.md](PRIVACY.md). This is worth stating because it is a trap that is
easy to walk into once there is money involved.

Everything measurable is outside the app:

- **Play Console** — installs, uninstalls, ratings, country split, and crash
  and ANR rates. No SDK, no code, nothing added to the app. This is the
  measurement surface for the whole project and it is enough.
- **Channel-side numbers** — what Reddit, Mastodon or Instagram report.
- **Testers, directly.** Twelve people is few enough to ask. A question in the
  Discord will tell you more than any funnel would.

Resist attribution. At this scale you will learn more from one conversation
than from any dashboard, and the dashboard would cost you the thing that makes
the app worth talking about.

---

## How these checks were run, and what they do not prove

Run 20 September 2026. Re-runnable.

| Check                      | Method                                                                                                                                                                                               | Confidence                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `.com` registration        | RDAP against Verisign (`rdap.verisign.com/com/v1/domain/…`), 200 = registered, 404 = not                                                                                                             | **High** — authoritative registry data                                                |
| `.app` registration        | RDAP against Google Registry (`pubapi.registry.google/rdap/domain/…`)                                                                                                                                | **High** — same                                                                       |
| App Store names            | Apple iTunes Search API, `entity=software`, US store                                                                                                                                                 | **Good** — official search, though it matches fuzzily and is region-specific          |
| Google Play names          | Web search restricted to `play.google.com`                                                                                                                                                           | **Moderate** — no official public search API, so absence of a result is weak evidence |
| Existing brands            | Web search                                                                                                                                                                                           | **Moderate**                                                                          |
| GitHub usernames           | HTTP status on `github.com/<name>`, verified against a control handle that correctly returned 404                                                                                                    | **Good**                                                                              |
| Instagram / TikTok handles | **Attempted and failed.** Both returned HTTP 200 for a deliberately nonsense control handle, meaning bot detection serves a page regardless. **No conclusion could be drawn — check these by hand.** |

Three limits worth stating plainly:

- **"Registered" is not "unavailable to you".** A registered domain may be
  parked and for sale. It only means it is not free to claim.
- **No trademark search was performed.** Domain and store checks say nothing
  about trademark rights, and "Reorg" being an established financial-research
  brand is the sort of thing a proper search exists to assess. If you intend to
  charge money under a name, that search is worth doing before the package name
  freezes.
- **Store checks were US-region.** A name clear in the US store can collide
  elsewhere.

None of this is legal advice.

---

## The first three things

1. **Decide the name.** It freezes when Play Console is created in W5–6, and
   everything else waits on it. Buy the domain the same day.
2. **Start Play Console identity verification.** It is the longest-lead item on
   the whole roadmap and nothing about it depends on the app being finished.
3. **Write the list of 20 people.** Not the post — the list. Track A is won or
   lost on whether twelve specific people click an opt-in link, and that is a
   conversation, not a campaign.
