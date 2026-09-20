# Security

The threat model is small and specific: **this app holds a personal mental
health record on one phone.** The realistic risks are someone picking up an
unlocked device, a backup file ending up in cloud storage, and a secret being
committed to a public repository. There is no server to attack because there
is no server.

## What protects what

| Asset            | Protection                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| The database     | SQLCipher (AES-256). The app cannot read it without the key                                                   |
| The database key | 32 random bytes in the OS keystore (`expo-secure-store`), generated on first launch, never leaving the device |
| A backup file    | AES-256-GCM with a per-export key, shown once as a recovery key and stored nowhere                            |
| The repository   | `.gitignore`, a pre-commit hook, and gitleaks in CI                                                           |

The web preview has **none** of this: the browser database is unencrypted and
`localStorage` is not a keystore. That is why it shows a permanent banner and
is documented everywhere as a development preview. It must never be presented
as somewhere to keep real entries.

## Rules that are not negotiable

- No secret, token or key is ever committed. Not in code, not in `app.json`,
  not in a test fixture, not in a workflow file.
- No analytics, no crash reporting, no telemetry.
- No network request that carries personal data.
- Encryption on native is never made optional or conditional.
- A backup's recovery key is shown once and never persisted.
- Personal data (`*.db`, `*.sqlite`, `exports/`, `private-data/`) stays out of
  git; `.gitignore` and the pre-commit hook both enforce it.

## Local hooks

```
sh scripts/install-hooks.sh
```

Installs a pre-commit hook that runs gitleaks (if installed) and refuses any
commit that stages a database or export file. Install gitleaks from
<https://github.com/gitleaks/gitleaks> — without it the hook warns and skips
the secret scan, and CI becomes the only line of defence.

## Checklist — GitHub settings to apply by hand

These cannot be set from a file in the repository. Do them once, in the
repository settings on github.com.

- [ ] **Repository is private.** It holds a personal mental health app; there
      is no reason for it to be public before release, and several not to be.
- [ ] **Branch protection on `main`:**
  - [ ] Require a pull request before merging
  - [ ] Require status checks to pass — select `lint`, `typecheck`, `test`,
        `build`, `security` once CI has run at least once
  - [ ] Require branches to be up to date before merging
  - [ ] Block force pushes
  - [ ] Block deletions
  - [ ] Include administrators (otherwise the protection is advisory)
- [ ] **Secret scanning** on, with **push protection** on. Settings → Code
      security.
- [ ] **Dependabot alerts** and **security updates** on.
- [ ] **Two-factor authentication** on the GitHub account.
- [ ] **Actions permissions:** allow only actions from this repository plus
      verified creators, and set the default `GITHUB_TOKEN` to read-only
      (workflows here request what they need explicitly).

## Secrets that will be needed later

None are needed for CI as it stands. Release and the Claude workflow each need
one; both are listed with instructions in [RELEASE.md](RELEASE.md) and
[CLAUDE_WORKFLOW.md](CLAUDE_WORKFLOW.md). Add them as **repository secrets**,
never as environment variables in a workflow file.

## If a secret is committed anyway

1. Treat it as public the moment it is pushed. Rotate it first, before tidying
   history — revoking the credential is what actually protects you.
2. Then remove it from history (`git filter-repo`) and force-push, coordinating
   with anyone who has a clone.
3. Note what happened in the PR or an issue, so the next person knows the
   credential changed.

## Reporting

This is a personal project with one maintainer. If you find something, open a
private security advisory on the repository rather than a public issue.
