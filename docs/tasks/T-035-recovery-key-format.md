---
id: T-035
title: Show the recovery key in a format people can copy by hand
milestone: W3-4
priority: P2
status: blocked
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

## Blockers

ADR 0003 is **proposed**, not accepted. It asks the owner to choose between
keeping 256 bits with a longer display and shortening the key to 128 bits to
match the mockups. Do not start until that is settled — the choice changes
both the tests and the protected rule in `AGENTS.md`.
