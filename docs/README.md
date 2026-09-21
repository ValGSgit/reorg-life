# docs

| File                                     | What it is for                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| [ROADMAP.md](ROADMAP.md)                 | Dates, the closed-test constraint, cut order, status log           |
| [status/](status/)                       | One file per status log entry; the log itself is generated         |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | How the code fits together and why                                 |
| [DECISIONS/](DECISIONS/)                 | ADRs — decisions that would otherwise be re-argued                 |
| [tasks/](tasks/)                         | One file per unit of work; `INDEX.md` is the view                  |
| [ASSETS.md](ASSETS.md)                   | Asset provenance and licensing. **Read before touching art**       |
| [SECURITY.md](SECURITY.md)               | Threat model, rules, and the GitHub settings checklist             |
| [PRIVACY.md](PRIVACY.md)                 | Privacy policy draft — not yet published                           |
| [RELEASE.md](RELEASE.md)                 | Secrets to add, release steps, store listing, manual device checks |
| [CLAUDE_WORKFLOW.md](CLAUDE_WORKFLOW.md) | Handing a task to Claude on GitHub                                 |

The working rules — TDD, definition of done, how to pick the next task — are
in [../AGENTS.md](../AGENTS.md), not here.

## Keeping these honest

Docs that drift are worse than no docs, because they get believed. Two habits
keep them true:

- Finishing a task updates its file and appends a line to the ROADMAP status
  log. Both are in the definition of done.
- A decision that constrains future work gets an ADR **when it is made**, not
  afterwards from memory.

If you find something here that is no longer true, fixing it is not a
distraction from the task — it is part of it.
