# ReorgLife

A local-first, privacy-first mobile app (Android now, iOS-ready) to keep track of your life — past, future and digital footprint — in support of your mental health.

## Principles
- Data lives only on the phone, in an SQLCipher-encrypted SQLite database. The key is generated on first launch and kept in the OS keystore (expo-secure-store).
- No backend, no analytics, no AI API. Claude is used outside the app by you, with data you choose to export.
- Gentle by design: streaks tolerate a missed day, no penalties, quiet areas are not failures.

## Milestone 1 (this version)
Onboarding with selectable character, daily check-in (+XP), timeline with tasks/memories by life domain, home screen with character, level and "life garden", daily reminder notification.

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
Placeholder blobs live in `src/components/Character.tsx`. To use Higgsfield art, generate images, put them in `assets/characters/`, and add `image: require(...)` to entries in `src/domain.ts` (then pass it to `<Character image=... />`).

## Roadmap
2. Habits and richer reminders, avatar items/unlocks  3. Read-only device calendar sync (expo-calendar)  4. Notion sync (token in secure store)  5. Digital footprint inventory, encrypted export/import.

## Safety
Run `sh scripts/install-hooks.sh` to enable the pre-commit secret/data check (uses gitleaks if installed). Keep the repo free of personal data.
