# ADR 0002 — What happens when a backup's recovery key is lost

- **Status:** proposed — needs the owner's sign-off before any code changes
- **Date:** 2026-09-20
- **Decided by:** not yet decided; this document is the input to that decision
- **Affects:** `src/backup.ts`, `docs/ARCHITECTURE.md`, `docs/PRIVACY.md`,
  `docs/SECURITY.md`, `AGENTS.md` (two protected product rules — see below),
  `docs/RELEASE.md`

## Context

Today, a backup is encrypted with a random 256-bit key generated at export
time (`AESEncryptionKey.generate()` in [`src/backup.ts`](../../src/backup.ts)),
shown to the user once as a recovery key, and never stored by the app in any
form. That is a deliberate, already-documented trade
([ARCHITECTURE.md](../ARCHITECTURE.md#encryption)): `expo-crypto` ships no
PBKDF2 or other password-based KDF, so the alternative to a random key would
have been a hand-rolled derivation, which was judged weaker than a random
256-bit key and rejected.

The gap this ADR addresses: **if the user loses both their phone and their
copy of the recovery key, the backup is unrecoverable — permanently, by
anyone, including the owner of this project.** There is no support flow, no
"forgot password", no fallback. For a mental-health record someone may want
back after replacing a phone, that is a real cost, and it is worth writing
down deliberately rather than leaving as an accident of the crypto design.

This ADR compares six ways to reduce that risk. For each, the entire
decision is **who can decrypt the backup, and under what circumstances** —
security, usability and privacy all fall out of answering that one question
precisely.

## Protected rules this touches — owner sign-off required

AGENTS.md lists, under "Product rules the tests protect", two rules relevant
here, both requiring "an explicit decision from the owner, recorded in an
ADR" before they change:

1. **"Backups are AES-256-GCM. The recovery key is generated per export,
   shown once, and stored nowhere."**
2. **"No analytics, no telemetry, no network call carrying personal data."**

Every option below except (a) status quo changes rule 1 in some way — by
design, "recoverable" and "stored nowhere" are in direct tension, so any fix
for the problem in Context means rewriting that sentence to describe
whichever new design is chosen. Option (e) additionally changes rule 2,
since it requires a network call carrying key material that gates personal
data. **This document does not itself change either rule — it recommends an
option and flags exactly what would need to change in AGENTS.md, PRIVACY.md,
SECURITY.md and ARCHITECTURE.md if the owner accepts it.** No such edit
should be made without that sign-off.

## Options

### (a) Status quo — random key, shown once, stored nowhere

**Who can decrypt:** anyone holding both the backup file and the exact
recovery key string as displayed at export — nothing else. If the user's own
copy of that key (paper, note, screenshot, memory) is gone, **no one can ever
decrypt that backup again** — not the user, not this project, not anyone.
That total, permanent loss is the problem this ADR exists to weigh against
the alternatives below.

### (b) Printed/PDF recovery sheet generated at export time

**Mechanism:** alongside the on-screen key, generate a one-page PDF (text +
QR code, via `expo-print`/`expo-sharing`) that the user is prompted to print
or save, with a short explanation and guidance to keep it apart from both the
phone and the backup file.

**Who can decrypt:** exactly the same population as (a) — anyone holding the
backup file plus a copy of that key, in whatever form. No new party gains
access. What changes is the _form factor_ of the copy the user is nudged to
make: a labelled sheet in a drawer or a safe is harder to lose by accident
than a string typed into a random notes app or a sticky note, and easier to
find again after months. It does not survive the same disaster as the phone
(a house fire takes both), and a found sheet is a found key — the exposure
shape is the same as a lost paper password, just for a smaller, more
findable population.

### (c) Shamir split across trusted contacts

**Mechanism:** split the 256-bit key into _N_ shares with threshold _M_ (e.g.
3-of-5) using Shamir's Secret Sharing, computed on-device; the user hands
shares to people they trust, by whatever means they choose — the app never
transmits a share anywhere.

**Who can decrypt:** the user, if they later collect _M_ shares back — **or
any _M_ of the _N_ contacts, acting together, with or without the user's
knowledge, at any point in the future, for as long as they still hold their
share.** This is categorically different from (a)/(b): it creates a standing,
independent ability for third parties to reconstruct access to a personal
mental-health record without the user's participation or consent at the
moment of reconstruction. A share cannot be revoked once handed over, and the
app has no way to know if a share has been copied, photographed, or passed to
someone the user never chose. For an app whose whole premise is a private,
non-judgemental record, handing pieces of the key to other people is a
meaningful — and hard to undo — change to who that record is private from.

### (d) Passphrase-derived key with a real KDF

**Mechanism:** the user chooses a passphrase; the key is derived with a
memory-hard KDF (Argon2id or scrypt — `expo-crypto` has no PBKDF2 built in,
so this requires adding a pure-JS/WASM KDF library) and a random, non-secret
per-export salt stored alongside the ciphertext.

**Who can decrypt:** anyone who knows the passphrase and holds the backup
file — the same _shape_ of access as (a)/(b) ("whoever has the one secret
plus the file"), but the secret is now something chosen and remembered
rather than machine-generated and copied down. That is the appeal and the
risk in one: a KDF raises the _cost_ of guessing a passphrase, it does not
raise its _entropy_. A weak or reused passphrase is brute-forceable offline
from a leaked backup file regardless of KDF strength, which is a real
regression from (a)'s guaranteed 256 bits unless the app enforces or
generates a strong passphrase (e.g. a six-word diceware phrase) — itself a
non-trivial UX problem, not a small addition.

### (e) Optional end-to-end-encrypted cloud escrow

**Mechanism:** opt-in; the recovery key (or the whole backup) is sent to a
cloud service, encrypted client-side so the operator cannot read the
plaintext.

**Who can decrypt:** the user, from any device, by authenticating to the
cloud account and supplying whatever secret gates the escrowed key — **plus,
in practice, anyone who compromises that account:** credential stuffing, a
breach at the provider's auth layer, a legal request served on the provider,
or any gap between the "end-to-end" claim and its actual implementation. This
is the only option that removes "you must not lose the one artifact" as a
hard failure mode, at the cost of a permanent network dependency and a third
party in the trust chain for a personal mental-health record — the largest
departure from what "local-first, no backend" currently means for this
project, and the option that requires amending protected rule 2, not just
rule 1.

### (f) A second, device-bound copy of the key, unwrapped by biometrics

**Mechanism:** the backup file carries the key twice — once wrapped by the
recovery key as today, and once wrapped by a key held in this device's
keystore and gated by fingerprint or face. Restoring on the same phone asks
for a fingerprint; restoring anywhere else needs the recovery key exactly as
now.

**Who can decrypt:** the user on that specific phone, with a fingerprint —
plus anyone holding the recovery key, from anywhere, unchanged. Note that
biometrics never decrypt anything themselves: they gate a key that has to be
**stored**, which is the direct collision with protected rule 1's "stored
nowhere".

**What it buys:** the common case stops being painful. Restoring after a
reinstall on the same device — which is also the rollback path in
[RELEASE.md](../RELEASE.md) — no longer needs a piece of paper.

**What it costs:** the device-bound copy is worthless in every scenario a
backup is actually for. A lost, stolen, wiped or broken phone takes its
keystore with it, so the recovery key remains the only real recovery path and
the same "do not lose this" failure mode survives intact. It also widens the
attack surface slightly: a backup file now contains key material that
something on that device can unwrap, so an attacker with both the file and a
compromised unlocked phone needs one less thing. And it is more code in the
part of the system where a bug is unrecoverable.

**Verdict:** a convenience, not a recovery mechanism, and it should never be
described as one. It does not solve the problem in Context — (b) still does
that — so it is worth considering only _in addition_ to whichever option is
chosen, never instead of one. Requires amending rule 1 either way.

## Decision

**Recommended: (b), the printed/PDF recovery sheet.** Not implemented here —
this ADR is the input to that decision, not the decision itself.

Option (f) was added after the owner asked for fingerprint unlocking. The app
lock half of that request has no conflict with any rule and is `T-041`; the
backup half is (f) and waits on this ADR like everything else here.

## Why these choices

(b) is the only option that measurably reduces the everyday failure mode
described in Context — a copied-down key that gets lost — **without changing
who is able to decrypt the backup.** It adds no new party (unlike (c)), does
not trade guaranteed entropy for memorability (unlike (d)), and needs no
network call or third-party operator (unlike (e)). It also needs no new
crypto: `AESEncryptionKey.generate()` is untouched; only the export screen
gains a second way to leave with a copy of the same key. That means it only
requires the owner to bless a narrow rewording of protected rule 1 — the key
is still generated per export and still never stored _by the app_ — not a
change to rule 2, and not a new trust model to explain to users of a
mental-health app.

It is deliberately not sold as solving the problem completely: a sheet kept
next to the phone is lost in the same event that loses the phone. The
follow-up task below should guide users to keep it somewhere physically
separate, and the PRIVACY.md/SECURITY.md updates should say plainly that this
reduces, not eliminates, the risk — the same honesty already used for the
existing "if you lose the recovery key" language.

## Consequences

- `docs/ARCHITECTURE.md`, `docs/PRIVACY.md`, `docs/SECURITY.md` and the
  protected-rule sentence in `AGENTS.md` all need a matching wording update,
  once the owner signs off — not before.
- Export flow gains a step and a new dependency (`expo-print`,
  `expo-sharing` — confirm both against the SDK 57 docs before use, per the
  "Expo has changed" note at the top of AGENTS.md).
- This does not close the door on offering (d) later as an _additional_
  opt-in for users who would rather trust their memory than a piece of paper
  — that would be a separate ADR, since it touches rule 1 differently and
  needs its own passphrase-strength UX decision.

## Rejected alternatives

**(a) Status quo.** Rejected as an outcome, not as a design — it remains
correct that a random key is the strongest per-backup secret available; the
problem is purely that the only copy is whatever the user made unassisted.

**(c) Shamir split.** Rejected primarily on privacy, not cryptographic,
grounds: it gives any _M_ trusted contacts a standing, collusion-only path to
a personal mental-health record, which cuts directly against the project's
non-judgemental, user-controlled tone — including the uncomfortable case of a
coercive or abusive "trusted" contact. Worth revisiting only if the owner
wants a high-effort, high-recoverability option and is comfortable with that
trade.

**(d) Passphrase-derived key.** Rejected as the _minimal_ fix, not
permanently: it needs a new crypto dependency `expo-crypto` doesn't provide,
and getting passphrase-strength UX right is a project of its own. Reasonable
as a later, additional opt-in; not the smallest change that addresses the
stated problem.

**(e) Cloud escrow.** Rejected as contrary to the project's core "local-first,
no backend, no network call carrying personal data" identity, and because it
requires trusting a third party's E2E implementation for a personal
mental-health record — the one option here that touches both protected rules
at once.

## Tasks

`T-026` in [`../tasks/`](../tasks/). Blocked on the owner reviewing this ADR
and signing off on amending protected rule 1 in AGENTS.md before any code is
written.
