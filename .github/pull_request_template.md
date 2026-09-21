## What and why

<!-- One or two sentences. What changed, and what problem it solves. -->

Task: <!-- docs/tasks/T-0NN-....md, or "none" -->
Closes: <!-- #issue, if any -->

## Acceptance criteria

<!-- Copy the checkboxes from the task file and tick the ones this PR satisfies. -->

- [ ]

## Definition of done

- [ ] A failing test was written first, and the commits show it
- [ ] `npm run verify` passes (lint, typecheck, coverage, both exports)
- [ ] `npm run test:e2e` passes, or is not affected by this change
- [ ] No existing test was weakened, loosened or deleted
- [ ] Docs updated (task file, a new entry file in `docs/status/`, ADR if a decision was made)
- [ ] No secrets, no personal data, no `.db` files
- [ ] Under ~400 changed lines, or says below why not

## Product rules this touches

<!-- Tick anything this PR could affect. Each has tests protecting it. -->

- [ ] Streaks forgive one missed day
- [ ] No penalties; XP is never removed
- [ ] Encryption on native is never optional
- [ ] Backups are AES-256-GCM, recovery key shown once and stored nowhere
- [ ] No analytics, no network calls carrying personal data
- [ ] None of the above

## Anything the reviewer should push back on

<!-- Shortcuts taken, things you were unsure about, a requirement that seemed
     wrong. If a requirement seemed wrong, say so here rather than working
     around it silently. -->
