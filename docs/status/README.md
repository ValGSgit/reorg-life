# Status log entries

One file per entry. `scripts/next-task.mjs --generate` assembles them into the
status log in [../ROADMAP.md](../ROADMAP.md), which is generated and must not
be edited by hand.

## Why it is a directory and not a list

It used to be one list in `ROADMAP.md` that every task pull request appended
to. Two open pull requests touch the same few lines, so they conflict — and on
21 September, resolving one of those conflicts by updating a branch silently
dropped an entry on the way into `main`. Nobody noticed until someone happened
to look.

A branch now adds a new file and touches no shared line, so there is nothing
to conflict over and nothing that can quietly disappear in a merge.

## Adding one

Create `YYYY-MM-DD-NN-slug.md` and write the entry as plain prose:

```
docs/status/2026-10-03-01-t021-period-migration.md
```

- **`YYYY-MM-DD`** — the date the work finished.
- **`NN`** — orders entries within that day. Take the next free number. If
  another branch takes the same one, nothing breaks: the filenames still
  differ, both entries survive, and they sort next to each other.
- **`slug`** — lower case, hyphens, usually the task id and a couple of words.

The body is the entry text, wrapped as you would write it. Keep the **first**
line a little short — about 62 characters — because the assembled bullet adds
`- **DD Mon** — ` in front of it. Do **not** write the
`- **3 Oct** —` prefix or indent continuation lines; the date comes from the
filename and the bullet and indentation are added when the log is assembled.

Then run:

```
node scripts/next-task.mjs --generate
```

which rewrites both `docs/tasks/INDEX.md` and the ROADMAP status log.

## What makes a good entry

The same as before: what changed, and what the next person needs to know. One
short paragraph. A quiet week is information, not a failure — an entry saying
little happened is a fine entry.
