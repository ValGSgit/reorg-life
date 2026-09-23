---
id: T-018
title: Finish and publish the privacy policy
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-018 — Finish and publish the privacy policy

## Goal

A published privacy policy at a stable public URL, matching what the code
actually does.

**Never cut.** Google Play will not grant production access without one, and
a policy that does not match the Data Safety form is a common rejection.

## Acceptance criteria

- [ ] `docs/PRIVACY.md` reviewed line by line against the code as it is at
      release, not as it was designed
- [ ] A contact address added
- [ ] Reviewed by someone qualified
- [ ] Hosted at a stable public URL
- [ ] The URL added to the Play Console listing
- [ ] The Play Console **Data Safety form matches it exactly**
- [ ] The draft banner removed once it is genuinely published
- [ ] Any integration that ships (calendar, Notion) is described accurately
- [ ] Says plainly that a lost recovery key means an unreadable backup

## Tests to write first

Mostly not testable, but two things are:

- [ ] A test asserting no analytics or telemetry package is in
      `package.json` — the policy claims this, so pin it
- [ ] A test asserting the app makes no network request at rest, so the claim
      cannot rot

## Files likely touched

```
docs/PRIVACY.md
tests/unit/privacy.test.ts   (new)
```

## Notes

Check the checklist at the bottom of `docs/PRIVACY.md`.

If T-016 (Notion) ships, this policy must change before it does, not after.

## Blockers

Needs the owner: a contact address, a hosting decision, and a reviewer.
