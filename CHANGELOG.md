# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project intends to follow [Semantic Versioning](https://semver.org/)
once it has a first tagged release. Nothing has shipped yet, so there is no
version history — only what has accumulated on `main` so far.

## [Unreleased]

Pre-release. Nothing in this section has been built, tagged or submitted to a
store yet — see [docs/ROADMAP.md](docs/ROADMAP.md) for the target dates and
[docs/tasks/INDEX.md](docs/tasks/INDEX.md) for what is still open.

### Added

- Onboarding, check-in, timeline and home screens; local reminders
- Encrypted local database (SQLCipher on native), with an unencrypted
  browser fallback for the web development preview
- Habits with forgiving streaks, per-habit reminders, and level unlockables
- Encrypted export/import (AES-256-GCM, one-time recovery key)
- Time-of-day companions (Sprout, Ember, Dusk) with placeholder art
  ([ADR 0001](docs/DECISIONS/0001-time-of-day-companions.md))
- CI: lint, typecheck, Jest with an 80% coverage floor on `src/domain`,
  `src/db` and `src/backup.ts`, Playwright end-to-end tests against the web
  build, commitlint, a pre-commit secret-scanning hook
- Documentation: architecture, security, privacy policy draft, release
  checklist, asset licensing notes, this file, and the licensing and
  commercial-readiness notes in [docs/LICENSES.md](docs/LICENSES.md) and
  [docs/COMMERCIAL.md](docs/COMMERCIAL.md)

### Known blockers before any release

- **Character art is unlicensed placeholder work** and must be replaced or
  relicensed before shipping — [T-010](docs/tasks/T-010-replace-placeholder-art.md)
- **No open-source licences screen yet** — SQLCipher's BSD-3-Clause notice
  needs to be reproduced inside the app, not just in this repo —
  [T-032](docs/tasks/T-032-open-source-licences-screen.md)
- Privacy policy is a draft, not published — [T-018](docs/tasks/T-018-privacy-policy.md)
- No monetisation model has been chosen — see [docs/COMMERCIAL.md](docs/COMMERCIAL.md)

[Unreleased]: https://github.com/ValGSgit/reorg-life/compare/main...HEAD
