---
id: T-038
title: Upload the web and Android exports as downloadable CI artifacts
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-038 — Upload the web and Android exports as downloadable CI artifacts

## Goal

Any commit's build can be downloaded and opened locally, so a change can be
looked at without checking the branch out and building it.

The `build` job already runs both exports and throws them away. This keeps
them.

## Acceptance criteria

- [ ] The `build` job uploads the web export as a workflow artifact on **every
      pull request** and **every push to `main`**
- [ ] The Android export is uploaded the same way
- [ ] Artifact names identify the commit, so two runs are never confused
- [ ] A retention period is set deliberately, not left to the default
- [ ] Downloading the web artifact and opening it locally works — confirmed by
      hand once and written in the PR
- [ ] **No secret is required.** The exports already run in CI today
- [ ] Nothing is published to a public URL. An artifact download is not hosting

## Tests to write first

Not unit-testable — it is workflow configuration, proven by the run itself.

- [ ] Confirm on the PR for this task that both artifacts appear and the web
      one opens locally. Paste what you did in the PR

## Files likely touched

```
.github/workflows/ci.yml
docs/RELEASE.md          (where to find a build for a given commit)
```

## Out of scope

- Signed or installable Android builds. An `expo export` is a JS bundle, not
  an APK — installable builds are **T-040**.
- Hosting the web build anywhere.

## Notes

Artifact retention costs storage. Pick a short window: these are convenience
builds, and the tagged releases in T-040 are the durable ones.

## Blockers

None.
