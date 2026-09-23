Fixed a red `main`, again. The status log in `docs/ROADMAP.md`
had its two 22 Sep entries in the wrong order and was missing a blank line, which
`prettier --check` rejects — so the lint job has failed on every push since PR #36
merged.

Nothing was wrong with the entry files. One file per entry does stop two open
pull requests conflicting over the same lines of the log, which is what it was
built for. It does not stop them conflicting over the **generated output**: #35
and #36 each ran `--generate`, git merged `docs/ROADMAP.md` by hunk, and the
result was a log the generator would never have written.

`tests/unit/scripts/roadmap-log.test.ts` now compares the log in the ROADMAP
against what `assembleStatusLog` produces from `docs/status/`, so the answer to
"is the generated file stale?" is a test rather than a formatting error three
merges later. The fix itself is one command.

Worth noticing that this is the second red `main` in two days that a merge
produced rather than a pull request: #36's own checks were green on its branch.
A generated file committed to the repository is a merge hazard by construction.
