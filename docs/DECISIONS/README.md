# Decision records

One file per decision that would otherwise be re-argued in six months.

`NNNN-short-title.md`, numbered in order, never renumbered. A record is
**accepted**, **superseded by NNNN**, or **rejected** — it is not deleted or
rewritten once accepted. If the decision changes, write a new record and mark
the old one superseded.

Worth a record: anything that constrains future work (a data format, a platform
split, a product rule), anything where the obvious choice was not taken, and
anything a future reader would otherwise "fix" without knowing why it is that
way.

Not worth a record: what a function is named, what the SQL looks like.

## Template

```markdown
# ADR NNNN — Title in a sentence

- **Status:** accepted | superseded by NNNN | rejected
- **Date:** YYYY-MM-DD
- **Affects:** files, features

## Context

What is true today, and what problem that causes.

## Decision

What will be done. Present tense.

## Why these choices

The reasoning a future reader will need. This is the part that matters.

## Consequences

What gets harder, what has to change, what to watch out for.

## Rejected alternatives

What else was considered, and the specific reason it lost.
```

## Index

| ADR                                    | Title                                             | Status   |
| -------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-time-of-day-companions.md) | Companions rotate with the time of day            | accepted |
| [0002](0002-backup-recovery.md)        | What happens when a backup's recovery key is lost | proposed |
| [0003](0003-recovery-key-format.md)    | What a recovery key looks like                    | proposed |
| [0004](0004-streaks-not-threads.md)    | The word stays "streak"                           | accepted |
| [0005](0005-engagement-model.md)       | Engaging, not coercive                            | proposed |
| [0006](0006-monetisation.md)           | How the app charges money                         | proposed |
