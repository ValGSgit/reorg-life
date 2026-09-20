# ReorgLife

A local-first, privacy-first mobile app (Android now, iOS-ready) to keep track of your life — past, future and digital footprint — in support of your mental health.

## Principles
- Data lives only on the phone, in an SQLCipher-encrypted SQLite database. The key is generated on first launch and kept in the OS keystore (expo-secure-store).
- No backend, no analytics, no AI API. Claude is used outside the app by you, with data you choose to export.
- Gentle by design: streaks tolerate a missed day, no penalties, quiet areas are not failures.

## Milestone 1
Onboarding with selectable character, daily check-in (+XP), timeline with tasks/memories by life domain, home screen with character, level and "life garden", daily reminder notification.

## Milestone 2 (this version)
- **Habits** — recurring, with a schedule (daily / weekdays / chosen days) and
  gentle streaks: one missed day is forgiven, and days the schedule does not
  ask for are skipped rather than counted against you.
- **Richer reminders** — an optional time per habit alongside the daily
  check-in reminder. Permission is asked for once, a refusal is treated as a
  normal answer, and reminders are rebuilt from the habit rows so the two never
  drift apart.
- **Unlockables** — small accessories for your companion that arrive with each
  level (`src/unlockables.ts`). Nothing is ever taken away.
- **Settings** — reminder time, change companion, pick an unlocked item, and
  encrypted export/import.

## Run
```
npm install
npx expo start        # scan with Expo Go for a first look
```
Note: SQLCipher and notifications need a development build for full behavior:
```
npx expo prebuild && npx expo run:android
```
(Expo Go uses standard SQLite, so encryption is only active in a dev build.)

### Web (dev preview only)
```
npm run web
```
The browser build exists so screens can be checked quickly on a laptop. It is
**not** a secure place for real entries, and the app shows a permanent banner
saying so:

- No SQLCipher. `src/db/index.web.ts` opens the same schema unencrypted, via
  expo-sqlite's wa-sqlite backend, persisted in the browser's origin-private
  file system.
- No OS keystore. `src/kv.web.ts` falls back to `localStorage`.
- No notifications. `src/reminders.ts` is a no-op when `Platform.OS === 'web'`.

The native path is untouched by all of this.

## Characters
Six companions, defined in `src/domain.ts`. Until artwork exists each is drawn
as a coloured blob by `src/components/Character.tsx`.

`Character` picks generated art by mood — happy (4-5), neutral (3), tired (1-2)
— and falls back to the blob for any character without art, so a partial set is
fine. To add art: drop `assets/characters/<id>-<mood>.png` in place and
uncomment that character's entry in `src/characterArt.ts`. See
`assets/characters/README.md`.

## Backups
Settings can export everything as a single AES-256-GCM encrypted file. The key
is generated fresh for each export and shown once as a **recovery key** — it is
never stored, never written into the file, and cannot be recovered. A backup
without its key is unreadable, including by you. Restoring replaces what is on
the device, in one transaction, and asks first.

## Repository layout
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: `src/domain` is pure
logic with no React imports, `src/db` owns the schema and migrations,
`src/features/*` holds screens grouped by feature, `tests/` mirrors that split,
and `docs/` carries the roadmap, decisions and task list.

## Roadmap
[docs/ROADMAP.md](docs/ROADMAP.md) — target public release 14 Dec 2026.

## Contributing (including Claude)
[AGENTS.md](AGENTS.md) is the single source of truth: TDD rules, definition of
done, and how to pick up the next task (`node scripts/next-task.mjs`).

## Safety
Run `sh scripts/install-hooks.sh` to enable the pre-commit secret/data check (uses gitleaks if installed). Keep the repo free of personal data. See [docs/SECURITY.md](docs/SECURITY.md).
