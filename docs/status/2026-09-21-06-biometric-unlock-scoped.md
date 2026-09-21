Biometric unlock scoped. T-041 covers unlocking the app
with a fingerprint or face, with a device passcode always available as a
fallback, off by default and failing locked rather than open. Decrypting an
export with a fingerprint is a different problem: biometrics gate a stored
key, and the recovery key is required to be stored nowhere, so it is written
up as option (f) in ADR 0002 rather than built. Nothing implemented.
