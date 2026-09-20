# Handing a task to Claude on GitHub

`.github/workflows/claude.yml` lets Claude pick up a task, work through it on a
branch, and open a pull request. It never pushes to `main` and never merges.

## Setting it up (once)

### 1. Install the GitHub app

In the Claude Code CLI, from this repository:

```
/install-github-app
```

That walks through installing the Claude GitHub app and granting it access to
this repository only.

### 2. Generate a subscription token

You have a Claude Pro subscription, so use a subscription token rather than an
API key — it bills against the subscription instead of API credit:

```
claude setup-token
```

This prints a long-lived OAuth token.

> If `claude setup-token` is not available in your CLI version, `/install-github-app`
> offers the same thing during setup. Check the current instructions at
> <https://github.com/anthropics/claude-code-action> — authentication has
> changed more than once.

### 3. Add it as a repository secret

GitHub → this repository → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**.

| Name                      | Value                 |
| ------------------------- | --------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | the token from step 2 |

**Never put the token in a file in this repository.** The workflow reads it
from `secrets.` and nowhere else. If it leaks, revoke it and generate a new
one.

## Using it

Three ways to start a run, all restricted to you:

| How                                     | When to use it                                          |
| --------------------------------------- | ------------------------------------------------------- |
| Add the **`claude`** label to an issue  | The normal way. Pair it with a task issue               |
| **Assign** an issue to Claude           | Same effect                                             |
| Comment **`@claude`** on an issue or PR | Follow-ups, or asking for a change on a PR under review |

The workflow will not run for anyone else. The `if:` condition checks both
`github.actor == 'ValGSgit'` and the repository name, so a comment from a
stranger on a forked or transferred copy does nothing.

> If your GitHub username is not `ValGSgit`, edit that condition in
> `.github/workflows/claude.yml` — otherwise the workflow will never fire.

## What Claude is allowed to do

| Permission             | Why                                     |
| ---------------------- | --------------------------------------- |
| `contents: write`      | Push a branch                           |
| `pull-requests: write` | Open a PR and comment on it             |
| `issues: write`        | Comment on the issue it is working from |

There is no merge permission. Branch protection on `main` (see
[SECURITY.md](SECURITY.md)) is the backstop: even if something went wrong, a
change cannot reach `main` without a reviewed pull request.

Other guards:

- **45-minute job timeout**, so a stuck run cannot burn an afternoon.
- **Concurrency group per issue**, so three quick comments do not start three
  agents on the same branch.
- **`--max-turns 60`**, a ceiling on how long one run can go round.

## What it is told to do

The `prompt:` in the workflow points at [AGENTS.md](../AGENTS.md) and repeats
the rules that matter most: test first, never weaken a test, one task per PR,
`npm run verify` before opening it, and stop and write down a blocker rather
than guessing.

Changing how Claude works means editing `AGENTS.md`, not the workflow. The
workflow only says "read AGENTS.md and follow it".

## Reviewing what comes back

Treat it like any other pull request. In particular:

- Did it write the test first? The commits should show it.
- Did it weaken any existing test? Check the diff for deleted or loosened
  assertions — that is the one thing that must never be waved through.
- Are the task's acceptance criteria actually ticked, and true?
- Is `docs/ROADMAP.md`'s status log updated?

## Cost

Every run uses your subscription. The label is the throttle — nothing runs
until you add it.
