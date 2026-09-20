# Privacy policy — DRAFT

> **Status: draft.** Not published, not legal advice, and not reviewed by a
> lawyer. Google Play requires a published privacy policy at a public URL
> before a production release; getting this reviewed and hosted is a task on
> the roadmap (W9–10). Read it as a statement of intent that the code is built
> to honour, and check it against the code before publishing.
>
> Last updated: 20 September 2026.

## The short version

ReorgLife keeps everything on your phone. It has no account, no server, and no
analytics. Nobody — including the developer — can see what you write in it.

## What the app stores

Everything you enter:

- Daily check-ins: a mood from 1 to 5, and any note you write
- Timeline entries: things you have done or plan to do, and the life area you
  filed them under
- Habits, their schedules, and which days you ticked them
- Your display name, chosen companion, XP and level
- Your settings, such as reminder times

## Where it is stored

In a single encrypted database file on your device, and nowhere else.

- The database is encrypted with SQLCipher (AES-256).
- The key is generated on your device the first time you open the app and is
  held in the operating system's keystore. It never leaves the device and is
  never sent anywhere.
- There is no account to create and no server to sync to, because there is no
  server.

## What the app sends over the network

Nothing that comes from you.

The app makes no network request carrying your data. There is no analytics SDK,
no crash reporting, no advertising identifier, no telemetry of any kind. It
does not ask for your contacts or your location.

Planned integrations will not change this without being explicit:

- **Device calendar (planned):** read-only, on your device, to build your
  timeline. Nothing is written back and nothing is uploaded.
- **Notion sync (planned, and a candidate to be dropped):** would talk to
  Notion's servers **only** if you connect it yourself, with a token you
  provide, which would be held in the OS keystore. It would be off unless you
  turn it on.

## Backups

You can export your data as a single encrypted file.

- It is encrypted with AES-256-GCM.
- The key is generated fresh for that export and shown to you **once**, as a
  recovery key. It is not stored in the app, not written into the file, and
  cannot be recovered by anyone.
- Where the file goes is up to you. If you put it in cloud storage, its safety
  becomes that service's problem — but without the recovery key the file is
  unreadable, so the key and the file should not be kept together.
- **If you lose the recovery key, that backup cannot be opened.** This is a
  deliberate trade for not having a guessable password.

## Notifications

Reminders are scheduled locally by your device. They contain only the words in
the app — never the contents of a check-in or a note. You can refuse the
permission or turn them off at any time; the app works either way.

## Your control over your data

- **See it:** it is all in the app.
- **Change or delete it:** any entry, at any time, from the app.
- **Take it with you:** export an encrypted backup.
- **Delete all of it:** uninstall the app. That removes the database and the
  key from the keystore. Any backup file you exported is yours to delete.

There is no copy anywhere else, so there is nothing to request from anyone and
nobody to ask.

## The web version

A browser version exists for development only. It is **not secure**: the
browser database is not encrypted and the browser has no keystore. It shows a
permanent banner saying so. Do not put real entries in it.

## Children

Not directed at children under 13.

## Changes to this policy

The published version will carry a date. Material changes will be noted in the
app's release notes.

## Contact

<!-- TODO before publishing: a contact address is required by Google Play. -->

To be added before release.

---

### Before publishing this, do these

- [ ] Add a contact email address
- [ ] Re-read against the code as it actually is at release
- [ ] Have someone qualified review it
- [ ] Host it at a stable public URL
- [ ] Make sure the Play Console Data Safety form matches it exactly — a
      mismatch is a common cause of review rejection
