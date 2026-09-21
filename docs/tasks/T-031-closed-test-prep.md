---
id: T-031
title: Prepare and start the Google Play closed test
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: T-030
---

# T-031 — Prepare and start the Google Play closed test

## Goal

A closed test running with 12 or more testers **by 2 November 2026**.

This is the hard schedule constraint. Everything else in the roadmap bends
around it. See `docs/ROADMAP.md` and `docs/RELEASE.md`.

## Acceptance criteria

- [ ] **The current rule re-checked in Play Console Help.** Tester count and
      duration have changed before; confirm before relying on 12 and 14
- [ ] Play Console account created and identity verified — this can take days
- [ ] App created with package `com.valgs.reorglife`
- [ ] Upload key generated and backed up somewhere durable
- [ ] Play App Signing enabled
- [ ] **15 or more testers recruited** — over-recruit, because dropping below
      12 restarts the 14-day clock
- [ ] Testers told plainly: this holds personal notes, it is an early build,
      and how to export a backup before updating
- [ ] Closed test track created and the build uploaded
- [ ] Testers opted in and confirmed as counted
- [ ] **Test running by 2 November**
- [ ] A way for testers to send feedback that does not require them to share
      personal entries
- [ ] Start date recorded as a `docs/status/` entry, so the 14 days can be
      counted

## Tests to write first

Not a code task. The verifiable artefact is:

- [ ] Tester instructions written and checked by someone who is not you

## Files likely touched

```
docs/RELEASE.md          (record dates and the verified rule)
docs/status/             (one new entry)
docs/tester-guide.md     (new)
```

## Notes

Recruiting 12 real people is the single most likely thing to slip in this
whole plan, and it cannot be compressed later — the 14 days are wall-clock.
Start in W5-6 even if the build is not perfect; a closed test build does not
have to be the release candidate.

Feedback route matters: testers should be able to report a problem without
pasting their check-ins anywhere.

## Blockers

Needs T-030 for a build to distribute.
