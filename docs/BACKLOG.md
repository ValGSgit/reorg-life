# Backlog

Ideas that are real enough to write down but not yet specified enough to be a
task. A task file in [docs/tasks/](tasks/) has acceptance criteria someone
could check; an entry here is closer to "someone should think about this."

This is not prioritised and not a roadmap. [docs/ROADMAP.md](ROADMAP.md) is
the schedule; [docs/tasks/INDEX.md](tasks/INDEX.md) is the committed work.
This file is upstream of both.

## How an idea gets promoted

1. Someone (owner or Claude) decides it is worth doing on a specific
   timeline.
2. Copy [docs/tasks/TEMPLATE.md](tasks/TEMPLATE.md) to the next `T-0xx`
   number, fill in acceptance criteria and tests-to-write-first.
3. Run `node scripts/next-task.mjs --index` to add it to the index.
4. Delete the entry below.

An idea does not need to be fully thought through to live here — it needs to
be fully thought through before it becomes a task, because a task with vague
acceptance criteria is how a red build happens.

## Ideas

### Wire `scripts/audit-licenses.mjs` into CI

Right now it is a standalone script — see [docs/LICENSES.md](LICENSES.md).
Nothing stops a future `npm install` from pulling in a copyleft dependency
unnoticed until someone happens to re-run the audit by hand. The script
already exits non-zero on a shipping strong-copyleft package
(`scripts/audit-licenses.mjs`, bottom), so wiring it into `npm run verify` or
a CI step is mechanical — the open question is only whether it should be a
hard failure or a warning, and whether the `--prod` false positive it
currently reports (`caniuse-lite`, build-time only) needs an allow-list
first so it doesn't cry wolf.

### iOS port

`docs/ROADMAP.md` says "Android first, iOS later" but there is no task for
it, no timeline, and no decision about whether it happens before or after
the first commercial release. Worth a real task once Android has shipped and
there is a signal (owner's own use, or actual demand) that iOS is worth the
Apple Developer Program cost and the App Store review process, which is
stricter than Play's about health-adjacent apps.

### Passphrase-derived key as an additional backup-recovery option

[ADR 0002](DECISIONS/0002-backup-recovery.md) chose a printable recovery
card as the fix for "the only copy of the recovery key is whatever the user
made unassisted," and explicitly rejected a passphrase-derived key as the
_minimal_ fix — not permanently. The ADR itself says this is "reasonable as
a later, additional opt-in" for a user who would rather trust memory than a
piece of paper. It would need its own ADR (a new crypto dependency beyond
`expo-crypto`, and passphrase-strength UX is a project of its own), so it
stays here rather than as a task until someone wants to take that on.

### A public-facing licences page vs. an in-app-only screen

T-032 puts the SQLCipher/OpenSSL/MIT notices inside the app, which is what
BSD-3-Clause actually requires. Whether the same content is _also_ worth
publishing at a stable URL (linked from the Play listing, alongside the
privacy policy) is a separate, smaller question — convenience for a curious
user, not a legal requirement on top of T-032. Not worth its own task unless
the store listing work (T-019) wants a link target.

### Selling anything outside Play billing (merchandise, a companion website)

Flagged and explicitly parked in [docs/COMMERCIAL.md](COMMERCIAL.md): not on
the roadmap, and if it ever happens it changes who the merchant of record is
for VAT purposes. No reason to think about further unless it actually comes
up.
