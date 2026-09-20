# Release

Target: public release **Monday 14 December 2026**, hard deadline **31 December
2026**. See [ROADMAP.md](ROADMAP.md) for how the dates were derived.

> Nothing in this repository submits to a store, and no store credential is
> stored here. `release.yml` builds an Android artefact on demand and stops.
> Submission is deliberately a manual step.

## Secrets you must add by hand

Repository → Settings → Secrets and variables → Actions → **New repository
secret**. Never put any of these in a workflow file, `app.json`, or `.env`.

| Secret                            | Needed for                               | Where to get it                                                                                                                        |
| --------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_TOKEN`                      | `release.yml` (EAS Build)                | expo.dev → account settings → Access tokens → Create token. Use a **robot** account with the minimum role rather than a personal token |
| `CLAUDE_CODE_OAUTH_TOKEN`         | `claude.yml`                             | See [CLAUDE_WORKFLOW.md](CLAUDE_WORKFLOW.md)                                                                                           |
| Play Console service account JSON | Store submission, **later and manually** | Google Cloud → IAM → Service accounts → create key, then grant it access in Play Console → Users and permissions                       |

The Play Console service account is listed for completeness. **Do not add it as
a GitHub secret yet.** Submission is not automated, so storing a credential
that can publish to your Play account would be risk with no benefit. Add it
only if and when submission is automated, and grant it the narrowest role that
works.

## One-time setup

- [ ] Create a Google Play developer account (one-off fee) and complete
      identity verification. **This can take days — start in W5–6, not later.**
- [ ] Create the app in Play Console with the package name `com.valgs.reorglife`
      (it must match `app.json` and cannot be changed afterwards).
- [ ] Generate an upload key and let Play App Signing hold the app signing key.
      Back up the upload keystore somewhere you will still have in a year — a
      lost upload key is recoverable via Google support, but slowly.
- [ ] Install EAS locally: `npm install -g eas-cli && eas login && eas build:configure`.
- [ ] Add `EXPO_TOKEN` (above).
- [ ] Apply the GitHub settings checklist in [SECURITY.md](SECURITY.md).

## The closed test requirement

A **new personal** Google Play developer account must run a closed test with
**12 or more testers**, opted in and staying opted in for **14 continuous
days**, before it can apply for production access.

This is the single constraint the whole schedule hangs on:

- Start the closed test by **2 November 2026** at the latest.
- 14 continuous days means the count restarts if testers drop below 12.
  Recruit more than 12 — aim for 15–16 so a couple of drop-outs do not reset
  the clock.
- The 14 days finish around 16 November, which is when you apply for
  production access. Approval is not instant.

> **Verify this rule in Play Console Help before relying on it.** Google has
> changed the tester count and the duration more than once, and the rule
> differs between personal and organisation accounts. If it has changed, update
> [ROADMAP.md](ROADMAP.md) in the same commit as this file.

## Cutting a release

1. **Freeze.** No new features (W11 in the roadmap).
2. `npm run verify` — lint, typecheck, coverage, both exports.
3. `npm run test:e2e`.
4. Bump `version` in `app.json` and increment `android.versionCode`. Play
   rejects a build whose `versionCode` it has already seen.
5. Tag: `git tag -a v0.1.0 -m "v0.1.0" && git push --tags`.
6. Run **Actions → release → Run workflow**, choosing the profile.
7. Download the artefact from the EAS build page.

## Manual checks on a real device before submitting

CI cannot do any of these. The first three are the ones that would actually
hurt someone.

- [ ] Encryption is genuinely on: the app is a **development or production
      build**, not Expo Go. Expo Go uses plain SQLite, so SQLCipher is inactive.
- [ ] Export a backup, **write the recovery key down**, uninstall the app,
      reinstall, restore. Confirm everything comes back.
- [ ] Try restoring with a wrong key. It must refuse and leave existing data
      untouched.
- [ ] Reminders: permission prompt, a reminder actually firing, refusing the
      permission and the app still working.
- [ ] Check-in, habit tick, streak, level-up.
- [ ] Dark mode and light mode.
- [ ] TalkBack over the main flows.
- [ ] Rotate through a device restart, so scheduled notifications survive it.

## Store listing

- [ ] Title, short description, full description
- [ ] Screenshots (phone, and a 7-inch tablet if declared)
- [ ] Feature graphic, 1024×500
- [ ] App icon 512×512 — **not the Expo placeholder**; see [ASSETS.md](ASSETS.md)
- [ ] Content rating questionnaire
- [ ] **Data safety form.** Declare no data collected and no data shared. It
      must match [PRIVACY.md](PRIVACY.md) exactly; a mismatch is a common
      rejection
- [ ] Privacy policy URL — published and reachable
- [ ] Target audience and content settings

## Licence check

Every asset shipped must have a recorded licence permitting distribution. **The
character art currently in the repository does not** — it is watermarked
placeholder work. See [ASSETS.md](ASSETS.md). This blocks release.

## After submitting

- Watch for policy review messages; respond quickly, as the clock is the
  scarce resource.
- If rejected, fix and resubmit. Budget for at least one round — that is what
  14–31 December is for.
