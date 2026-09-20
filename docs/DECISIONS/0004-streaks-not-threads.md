# ADR 0004 — The word stays "streak"

- **Status:** accepted
- **Date:** 2026-09-20
- **Decided by:** the owner
- **Affects:** all user-facing copy, `src/domain/streaks.ts`, design mockups

## Context

The Settings and edge-case design mockups renamed streaks to **threads**:
"Your threads are paused, not broken", "That thread has come to an end", "The
next thread begins on its own, the next time you tick."

It is a warmer word. A streak is something you break; a thread is something
that pauses and picks up again, which matches what the code actually does —
one missed day is forgiven, and days a schedule does not ask for are skipped
entirely.

But the codebase has **24 occurrences of "streak" and none of "thread"**, and
"streaks forgive one missed day" is listed in `AGENTS.md` among the product
rules the tests protect. Design and implementation were drifting apart, which
is the thing worth settling rather than the word itself.

## Decision

**Keep "streak."** Everywhere: code, copy, docs, and design.

The mockups' "thread" wording is not adopted and should be revised before any
of those screens are built.

## Why

Two reasons, neither of them about which word is nicer.

"Streak" is what people already understand. Every habit app uses it, so it
needs no teaching — and the interesting thing about this app is not the word
but that **its streaks behave differently**. A forgiving streak is a surprise
worth having; a forgiving "thread" is just an unfamiliar noun doing two jobs
at once.

And the gentleness lives in the _behaviour_, not the vocabulary. One missed
day is forgiven, XP is never removed, an ended streak is stated neutrally.
Renaming would have been an attempt to soften with vocabulary something the
mechanics already handle.

## Consequences

- Design mockups using "thread" need their copy revised before implementation.
  The rest of that copy is good and should be kept.
- The edge-case screen "A thread that ended" becomes "A streak that ended",
  and must keep its neutral tone — that screen is where the word does its
  hardest work.
- No code changes. This records why a rename was considered and rejected, so
  it is not reopened in six months.

## Rejected alternatives

**Rename to "thread".** Rejected above.

**Use both — "streak" in code, "thread" in copy.** Rejected outright. A
vocabulary gap between code and interface is how a bug report stops being
searchable, and it makes every future contributor translate in their head.
