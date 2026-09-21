---
id: T-030
title: First EAS release build and the manual device checks
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-030 — First EAS release build and the manual device checks

## Goal

A signed Android build produced by `release.yml`, and every check that CI
cannot do done by hand on a real phone.

## Acceptance criteria

- [ ] `eas.json` exists with `preview` and `production` profiles
- [ ] `EXPO_TOKEN` added as a repository secret
- [ ] `release.yml` runs and produces a downloadable artefact
- [ ] The build installs on the Android device
- [ ] Every item in the manual checklist in `docs/RELEASE.md` is done and
      recorded
- [ ] **Encryption confirmed active** — a development or production build, not
      Expo Go
- [ ] **Backup, uninstall, reinstall, restore verified on the device**
- [ ] A wrong recovery key is refused and leaves existing data intact
- [ ] Reminders fire, and survive a device restart
- [ ] `app.json` version and `android.versionCode` bumped
- [ ] The build **fails loudly** if `android.versionCode` is missing, rather
      than producing an artefact Play will reject. Release day must never be
      when this is discovered

## Tests to write first

Automated tests cannot cover a signed build on hardware. What can be pinned:

- [ ] A test asserting `app.json` has an `android.versionCode` and a `version`
- [ ] A test asserting the SQLCipher plugin is still configured — silently
      losing it would ship an unencrypted database

## Files likely touched

```
eas.json        (new)
app.json        (version bump)
docs/RELEASE.md (record the results)
```

## Notes

**Moved from W11 to W5-6, confirmed by the owner.** W11 still produces the
release candidate and still runs the full device checklist below; what moved
earlier is only the **first** build, because T-031 cannot distribute something
that does not exist yet.

The original reason: T-031 (closed test, W5-6) is blocked by this task,
so leaving it in W11 meant the closed test could not start until after the
thing it depends on — and the closed test must be running by 2 November. The
device checks below can be repeated at W11 on the release candidate; what
moves earlier is producing a build testers can install.

The `app.json` version test listed above now lands earlier, in T-039, so this
task inherits it rather than discovering on release day that
`android.versionCode` was never set.

The restore-after-reinstall check is the important one. It is the only way to
find out whether the key really is in the keystore and whether a backup really
is portable — and the worst possible time to discover otherwise is after
launch.

## Blockers

Needs the owner to add `EXPO_TOKEN`.
