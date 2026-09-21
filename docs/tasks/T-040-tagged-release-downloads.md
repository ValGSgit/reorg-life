---
id: T-040
title: Tagged releases with a downloadable Android build and a safe rollback path
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: T-030
---

# T-040 — Tagged releases with a downloadable Android build and a safe rollback path

## Goal

Tagging a version produces an installable Android build attached to a GitHub
Release, so any past version can be fetched and reinstalled — and the way to
do that without destroying data is written down where it will be read.

Today `release.yml` is manual-only, builds with `--no-wait`, and points at the
EAS build page. Nothing is attached to a GitHub Release, so there is no
per-version place to fetch a build from.

## Acceptance criteria

- [ ] Pushing a `v*` tag triggers the release build
- [ ] The finished Android build is attached to a **GitHub Release** for that
      tag, downloadable without an Expo account
- [ ] The attached artefact is an **APK**, not only an AAB — an AAB cannot be
      sideloaded, and sideloading is the whole point of this task
- [ ] The Release body links the `CHANGELOG.md` entry for that version
- [ ] The manual `workflow_dispatch` path still works and is unchanged
- [ ] `docs/RELEASE.md` lists **exactly** which secrets to add and which
      buttons to click, and no secret is added to the repository
- [ ] A build fails loudly if `EXPO_TOKEN` is missing, as it does today
- [ ] The rollback warning is in `docs/RELEASE.md` (see Notes) and is
      impossible to miss

## Tests to write first

Workflow behaviour is proven by running it, not by unit tests. What can be
pinned first:

- [ ] A test asserting `release.yml` still has the `workflow_dispatch` entry
      point, so adding the tag trigger cannot silently remove the manual one
- [ ] Confirm by hand on a throwaway tag that a Release appears with a
      downloadable APK, and record what was done in the PR

## Files likely touched

```
.github/workflows/release.yml
docs/RELEASE.md
```

## Out of scope

- Submitting to Play. Submission stays a manual, deliberate step, and no Play
  credential goes in this repository.
- Automatic version bumping — **T-039**.
- Unsigned or debug builds.

## Notes

**The rollback warning is the important part of this task, not the
automation.** Android refuses to install an older `versionCode` over a newer
one. Rolling back therefore means uninstalling first, and uninstalling **wipes
the encrypted database** — the key lives in the OS keystore and goes with the
app. So a rollback without an exported backup is permanent data loss.

That warning goes next to the download instructions, where someone about to
roll back is actually looking — not only in a section they have already
scrolled past.

Attaching the APK needs the workflow to wait for the EAS build rather than
`--no-wait`, and to download it before creating the Release. That is the main
implementation change.

## Blockers

Needs T-030, which establishes `eas.json`, the build profiles and `EXPO_TOKEN`.
