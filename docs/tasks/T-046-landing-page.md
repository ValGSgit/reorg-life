---
id: T-046
title: One-page landing site
milestone: W5-6
priority: P2
status: todo
cut_candidate: true
blocked_by: null
---

# T-046 — One-page landing site

## Goal

One page, one link, that a Reddit or Mastodon post can point at and that the
Play listing can link back to. It also hosts the privacy policy, which Play
requires at a public URL.

## Acceptance criteria

- [ ] One static page, no tracker, no analytics, no cookie banner needed
      because there is nothing to consent to
- [ ] Leads on **periods and privacy**, not on the companion
- [ ] Hosts the privacy policy at a stable public URL for the Play listing
- [ ] Links to the Play listing, and to the repository
- [ ] Readable on a phone, and in dark mode
- [ ] No medical claim — see the rule in AGENTS.md
- [ ] Says the web preview is not secure, wherever one is linked

## Out of scope

A blog, a mailing list, a waitlist. None of them pay for themselves at this
scale.

## Notes

**First to be cut if the sequence to 2 November does not fit.** A Play listing
alone can carry a closed test; the privacy policy can be hosted as a plain file
in the meantime. See [COMMERCIAL-PLAN.md](../COMMERCIAL-PLAN.md).

Cheapest credible host is GitHub Pages from this repository, which costs
nothing and adds no account. The domain is the only recurring cost in the whole
project.
