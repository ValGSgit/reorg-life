---
id: T-032
title: Add an open-source licences screen
milestone: W9-10
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-032 — Add an open-source licences screen

## Goal

SQLCipher (BSD-3-Clause, Zetetic LLC) is vendored inside `expo-sqlite` and
linked into the Android build. BSD-3-Clause requires its copyright notice,
condition list and disclaimer to be reproduced in the materials distributed
with the binary — a `LICENSE` file in this git repo does not satisfy that for
an app a user installs. The app needs a screen that does. See
[docs/LICENSES.md](../LICENSES.md) for the full reasoning.

## Acceptance criteria

- [ ] A screen (or a Settings entry that opens one) lists third-party
      licences and is reachable without leaving the app
- [ ] The full SQLCipher BSD-3-Clause notice is reproduced verbatim
- [ ] The OpenSSL notice is included (Android links it via
      `io.github.ronickg:openssl:3.3.2-1` for SQLCipher's crypto backend) —
      confirm exact version and notice text once a real Android build exists
- [ ] MIT notices for Expo, React Native and React are included
- [ ] The list is generated from what actually ships, not hand-typed once and
      left to rot — either a build step that reads package.json licences, or
      a documented manual process re-run before each release
- [ ] Screen is reachable in both light and dark mode and passes the same
      accessibility bar as the rest of the app (T-012)

## Tests to write first

- [ ] `tests/component/` — the licences screen renders and contains the
      SQLCipher and OpenSSL notice text
- [ ] If generated from a manifest/data file, a test that the SQLCipher and
      OpenSSL entries are present in that data file, so a dependency bump
      cannot silently drop them

## Files likely touched

```
src/features/settings/
docs/LICENSES.md
tests/component/
```

## Out of scope

Re-running `scripts/audit-licenses.mjs` and updating `docs/LICENSES.md` on an
ongoing basis — that stays a release-checklist item, not part of this screen.
Choosing whether to license or commission new character art — that is T-010,
unrelated.

## Notes

Source of the BSD-3-Clause and Apache-2.0 (OpenSSL) requirement:
[docs/LICENSES.md](../LICENSES.md), "SQLCipher" section. Do not paraphrase the
SQLCipher notice — reproduce it as Zetetic LLC wrote it.

## Blockers

None currently.
