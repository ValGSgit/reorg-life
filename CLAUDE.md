# CLAUDE.md

@AGENTS.md

Everything is in [AGENTS.md](AGENTS.md) — project purpose and tone,
architecture, commands, TDD rules, definition of done, security and privacy
rules, how to pick up the next task, and what to do when blocked.

Nothing is duplicated here on purpose: two copies of the rules drift apart,
and then nobody knows which one is real.

The short version, if you read nothing else:

- `node scripts/next-task.mjs` tells you what to work on.
- Write the failing test first.
- Never weaken a test to get CI green. If a requirement looks wrong, stop and
  say so in the pull request.
- One task per PR, branch only, never push to `main`.
- `npm run verify` before opening a pull request.
