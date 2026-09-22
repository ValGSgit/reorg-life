---
id: T-041
title: Unlock the app with a fingerprint or face, with a passcode fallback
milestone: W7-8
priority: P2
status: todo
cut_candidate: false
blocked_by: null
---

# T-041 — Unlock the app with a fingerprint or face

## Goal

Someone who picks up an unlocked phone cannot read the journal. Opening
ReorgLife asks for the fingerprint, face or device passcode first.

This is defence in depth, not the main protection: the database is already
encrypted with a key in the OS keystore, so the files are unreadable off the
device. What this stops is the ordinary case — a phone handed over, left on a
desk, or already unlocked.

## Acceptance criteria

- [ ] Opening the app, or returning to it from the background, asks for
      biometric authentication
- [ ] **A device passcode or PIN always works as a fallback.** Fingerprints
      fail wet, cold and injured hands, and some people have none that
      register. It must never be the only way in
- [ ] **Off by default**, turned on in Settings. Someone whose phone is their
      safe place should not be asked to authenticate twice
- [ ] Enrolling no new biometric data. `expo-local-authentication` asks the OS
      to verify; the app never sees or stores a fingerprint
- [ ] A grace period, so switching to another app for a moment does not demand
      a fingerprint on return. The length is configurable, with a sane default
- [ ] **It fails safe, not open.** If the hardware is unavailable or the
      check errors, the app stays locked and says why, offering the passcode
- [ ] A device with no biometric hardware at all can still enable a passcode
      lock, or is told plainly that the setting is unavailable
- [ ] **The web preview ignores this setting entirely** and says so — it is an
      unencrypted testing surface and a lock there would imply a protection it
      does not have
- [ ] Copy is calm: this is a lock, not a warning about how unsafe you are

## Tests to write first

- [ ] The lock gate renders locked when the setting is on and unauthenticated
- [ ] A successful check unlocks; a cancelled one leaves it locked
- [ ] **An error from the authentication module leaves the app locked** — the
      one that matters, because failing open would be silent
- [ ] The passcode fallback is offered whenever biometrics fail
- [ ] Within the grace period, returning to the app does not re-prompt; past
      it, it does
- [ ] With the setting off, nothing prompts and nothing is gated
- [ ] On web, the gate is inert regardless of the setting

## Files likely touched

```
src/features/settings/     (the toggle)
src/components/            (the lock gate)
src/db/repo.ts             (the setting)
app.json                   (expo-local-authentication plugin, Face ID usage string)
tests/component/
```

## Out of scope

- **Unlocking an encrypted backup with a fingerprint.** Asked for alongside
  this, and it is a different problem with a rule in the way — see Notes.
- Per-entry or per-screen locks. One gate at the door.
- Replacing the SQLCipher key with a biometric-derived one. The keystore
  already holds it, and the OS already gates the keystore.

## Notes

`expo-local-authentication` is the SDK 57 module. Read the versioned docs
before writing any of it — the API has changed shape.

iOS needs a Face ID usage description in `app.json` or the app is rejected.

**On decrypting exports with a fingerprint**, which was the other half of the
request: it cannot simply be built, because it collides with a protected rule.
AGENTS.md says the recovery key is "generated per export, shown once, and
stored nowhere". Biometrics do not decrypt anything themselves — they unlock a
key held in the keystore — so making a fingerprint open a backup means
**storing a key**, which is exactly what that rule forbids. It would also make
the backup openable only on that phone, which defeats most of the point of
having one: the case a backup exists for is the phone being lost or wiped.

There is a defensible middle version — the backup carries a second wrapped
copy of its key that only this device's keystore can unwrap, with the printed
recovery key remaining the portable path — but that changes the security model
and needs sign-off. It is written up as option (f) in
[ADR 0002](../DECISIONS/0002-backup-recovery.md), which is already open on
exactly this question and already blocking `T-026`. **Nothing should be built
for it until that ADR is decided.** This task deliberately covers only the app
lock, which has no such conflict.

## Blockers

None for the app lock.
