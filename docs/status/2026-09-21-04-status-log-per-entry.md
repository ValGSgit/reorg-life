Status log moved out of `docs/ROADMAP.md` into one file per
entry under `docs/status/`, assembled by `next-task.mjs --generate`. Every task
PR used to append to the same few lines, so every pair of open PRs conflicted,
and resolving one of those conflicts had already dropped an entry into nothing
on the way into main. A branch now adds a file and touches no shared line. The
six existing entries were migrated and the assembled output is byte-identical
to what was there. Also added `enables_review_of`, so the script — not a
standing manual override — knows T-037 comes before T-022 and T-023.
