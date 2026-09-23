---
id: T-035
title: Show the recovery key in a format people can copy by hand
milestone: W5-6
priority: P1
status: todo
cut_candidate: false
blocked_by: null
---

# T-035 — Show the recovery key in a format people can copy by hand

Implements [ADR 0003](../DECISIONS/0003-recovery-key-format.md).

## Goal

The recovery key can be written on paper and typed back without mistakes. It
is currently 44 characters of base64, including `+` and `/`, ungrouped — the
worst possible shape for the one thing a person must transcribe correctly or
lose a backup forever.

## Acceptance criteria

- [ ] The key is displayed as Crockford base32, grouped in fours
- [ ] The underlying key is still **32 random bytes / 256 bits**. Only the
      encoding changes
- [ ] Restore normalises input before decoding: strip whitespace and dashes,
      uppercase, map `I` and `L` to `1` and `O` to `0`
- [ ] **A backup exported before this change still restores.** Those carry
      base64 keys, and nothing distinguishes the two formats except trying, so
      try both before reporting failure
- [ ] The wrong-key message still states that nothing changed and that the
      existing data is untouched
- [ ] The one-time reveal screen fits ~52 characters without looking
      intimidating

## Tests to write first

- [ ] Round trip: generate, encode, normalise, decode, and get the same 32
      bytes
- [ ] Normalisation: `i`, `I`, `l`, `L` all become `1`; `o`, `O` become `0`;
      dashes, spaces and mixed case all accepted
- [ ] A key that is the right length but wrong still fails cleanly, with the
      database untouched — extend the existing wrong-key test
- [ ] **A base64-era key still opens a base64-era backup.** This is the
      regression that would silently strand someone's existing backup
- [ ] The encoded form contains none of Crockford's excluded letters

## Files likely touched

```
src/backup.ts
src/features/settings/Settings.tsx
tests/unit/db/backup.test.ts
```

## Out of scope

Whether a lost key can be recovered at all — that is ADR 0002 and T-026.

## Notes

The design mockups solved the human half of this well: case insensitivity,
dashes ignored, and a warning that `0` and `O` are easy to confuse. Keep all
of it. Only the length was wrong — six blocks cannot hold 256 bits.

## Was blocked, now settled

ADR 0003 was accepted on 22 September 2026: **option A**, 256 bits shown as
Crockford base32 in groups of four. This task is unblocked.

## Why this is launch-blocking

A key shown once and stored nowhere is correct cryptographically and hostile
behaviourally. Forty-four characters of base64 containing `+`, `/`, `l`, `I`,
`0` and `O` is the worst possible shape for the one string a person must
transcribe correctly or lose years of writing. Some people will get it wrong,
and they will lose everything, and they will be right to blame the app.

Shipping without this is shipping a data-loss bug with a friendly face.
