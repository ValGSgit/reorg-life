---
id: T-039
title: Show the version and build number, and make versioning deliberate
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-039 — Show the version and build number, and make versioning deliberate

## Goal

A bug report can say which build it came from, and a version number means
something rather than drifting.

Right now `app.json` has `version: 0.1.0` and **no `android.versionCode` at
all**. Play requires one and refuses a build whose `versionCode` it has
already seen.

## Acceptance criteria

- [ ] `app.json` has an `android.versionCode`, **starting at 1**, bumped by
      hand per release and never auto-incremented — the point is to be able to
      tell versions apart, which a bot bumping on merge destroys
- [ ] The Settings screen shows the version and the build number, somewhere
      unobtrusive — this is a diagnostic, not a headline
- [ ] It reads the real values at runtime rather than a hardcoded string, so
      it cannot drift from what shipped
- [ ] `CHANGELOG.md` gains an entry per version, in the existing Keep a
      Changelog format, moving items out of `[Unreleased]` on release
- [ ] `docs/RELEASE.md` says when to bump `version` and when to bump
      `versionCode`, and that `versionCode` only ever increases

## Tests to write first

- [ ] `app.json` has both a `version` and an `android.versionCode`, and the
      `versionCode` is an integer — this is the check that stops a release
      being rejected by Play after a 30-minute build
- [ ] The Settings screen renders a version string, and does not render
      `undefined` when a value is missing

## Files likely touched

```
app.json
src/features/settings/Settings.tsx
CHANGELOG.md
docs/RELEASE.md
tests/
```

## Out of scope

- Automating the bump. Deliberate means a human decides; a bot that bumps on
  merge is how `versionCode` drifts from what was tested.
- Tagging and publishing releases — **T-040**.

## Notes

`expo-constants` and `expo-application` are already installed as transitive
dependencies of Expo SDK 57, so no new dependency is needed — but add
whichever is used to `package.json` explicitly rather than relying on hoisting.

T-030 already lists a test asserting `app.json` has a `version` and a
`versionCode`. That test belongs here, earlier, so T-030 inherits it rather
than discovering the gap on release day.

## Blockers

None.
