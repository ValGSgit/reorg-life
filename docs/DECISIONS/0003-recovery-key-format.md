# ADR 0003 — What a recovery key looks like

- **Status:** accepted — option A, 256 bits shown as Crockford base32
- **Decided by:** the owner, 22 September 2026
- **Date:** 2026-09-20
- **Affects:** `src/backup.ts`, the export and restore screens
- **Related:** [ADR 0002](0002-backup-recovery.md), which asks what happens
  when a key is lost. This asks what the key _is_.

## Context

`backup.ts` generates a 256-bit AES-GCM key and shows it as **base64 — 44
characters**, like `k3JdQ9vX…==`. "Backups are AES-256-GCM" is one of the
product rules `AGENTS.md` protects.

The design mockups show something different and much friendlier:

```
MARSH  QUILT  7FKD  LANTERN  92BX  HOLLOW
```

Six blocks, grouped, with a wrong-key screen that says "Capitals and dashes
don't matter" and "It's worth checking the last block; 0 and O are easy to
swap". That is a format designed by someone who has watched a person copy a
key onto paper, and it is better than base64 in every way that matters to a
human.

**It also cannot hold the key.** Those six blocks are **31 characters**. Even
treating every character as case-insensitive alphanumeric — 36 symbols — that
is at most ~160 bits. If the words come from a 2048-word list it is nearer 66.
The key is 256 bits. The format in the design cannot represent it, so one of
the two has to change.

## The options

### A. Keep 256 bits, show it in a friendlier format

Base32 (Crockford, which already excludes I, L, O and U to avoid exactly the
0/O confusion the design mentions) encodes 256 bits in **52 characters** —
say 13 groups of 4, or 8 groups of 7.

- No change to the cryptography. The protected rule stands untouched.
- Noticeably more to write down than the mockup implies. The design's six
  blocks would become roughly twice that.

### B. Reduce the key to 128 bits, shown as ~26 characters

- Still far beyond brute force: 128-bit AES has no practical attack, and this
  is protecting a personal journal, not a state secret.
- Six or seven blocks — close to what the design draws.
- Requires amending `AGENTS.md`, because the rule says AES-256.

### C. Derive the key from a shorter phrase

A word list, BIP39-style, where the words _are_ the entropy.

- Most human-friendly to read aloud and check.
- Needs **24 words** for 256 bits, or 12 for 128. Twelve words is more to
  write than 52 base32 characters, so it does not actually reduce effort — it
  changes it from transcription to reading.
- Adds a word list to the bundle and a whole class of normalisation bugs
  (homophones, plurals, locale).

## Decision

**Accepted: option A**, signed off by the owner on 22 September 2026.
**T-035 is unblocked** and is launch-blocking.

**Option A.** Keep the 256-bit key and present it as Crockford base32 in
groups of four, then adopt everything else the design got right: case
insensitivity, dashes ignored, the ambiguous-character warning, and the
one-time reveal.

The design's real contribution is not the length — it is that it treats the
key as something a person will write on paper and mistype. That is worth
keeping in full. The character count is the one part that has to give, and
lengthening the display is a smaller change than weakening the cryptography or
adding a word list.

**If the mockup's exact length matters more than AES-256**, Option B is
defensible for this threat model — but it is an explicit amendment to a
protected rule, not a formatting tweak, and should be recorded as such.

## Consequences

- `backup.ts` changes its key _encoding_, not its key generation. The
  underlying bytes stay 32.
- Restore must accept the new format and normalise input: strip dashes and
  whitespace, uppercase, and map the ambiguous characters Crockford already
  defines (I and L to 1, O to 0).
- **Backups exported before this change use base64 keys.** Restore has to
  accept both, and there is no way to tell which is which except by trying, so
  it should try both before reporting failure.
- The one-time reveal screen needs room for ~52 characters without becoming
  intimidating. That is a design problem worth solving properly, since it is
  the screen where people decide whether to bother.
- Tests: round-trip, normalisation of every ambiguous character, and a
  base64-era backup still restoring.

## Rejected alternatives

**Leave it as base64.** Works, and is what ships today, but `/` and `+` are
awful to transcribe and there is no grouping to check against. The design
identified a real problem.

**Show base64 but accept a shortened form.** Rejected — there is no shortened
form of a 256-bit key that is still a 256-bit key.
