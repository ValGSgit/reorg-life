# integrations

Empty on purpose. Two integrations are planned, both strictly local:

- **Device calendar, read-only** (`expo-calendar`) — events are read to build
  the timeline. Nothing is written back.
- **Notion sync** — token held in the OS keystore, never in the database or
  in git. A cut candidate; see `docs/ROADMAP.md`.

Anything added here still obeys the privacy rules in `docs/PRIVACY.md`: no
analytics, and no network call that carries personal data anywhere the owner
has not explicitly chosen.
