---
id: T-036
title: Web viewer for exported backups
milestone: Unscheduled
priority: P3
status: cut
cut_candidate: true
blocked_by: null
---

# T-036 — Web viewer for exported backups

## Goal

Someone can open their exported backup on a laptop and read their history.
The phone stays the only place anything is created or edited.

This is **not** the existing web dev preview, and **not** the preview
harness in T-037. That runs the whole app in a
browser with unencrypted storage and exists for development. This is a
separate, read-only viewer — and it can keep the privacy promise completely,
which the preview cannot.

## Acceptance criteria

- [ ] Opens a `.backup` file with its recovery key and renders the contents
- [ ] **Decryption happens in the browser via WebCrypto. The file and the key
      are never uploaded.** There is no server
- [ ] **Nothing is persisted.** No localStorage, no IndexedDB, no cookies, no
      service-worker caching of user data. Closing the tab leaves nothing
- [ ] Works with the network disconnected, and can be shown to
- [ ] No analytics, no runtime font fetches, no third-party requests at all
- [ ] Read-only. No editing, no re-export
- [ ] Shows: timeline grouped by day and period, mood over time, habits and
      streaks, the life garden, and filters by period and domain
- [ ] A wrong key says plainly that nothing was uploaded and nothing changed
- [ ] A backup from an older app version opens, with missing fields absent
      rather than fatal
- [ ] Same tone rules as the app: no scores, no judgement, a quiet month is
      information

## Tests to write first

- [ ] Round trip: a backup written by `backup.ts` opens in the viewer and
      matches the source data
- [ ] Wrong key fails cleanly
- [ ] **Assert no network requests are made after load** — intercept and fail
      the test if any fire. This is the product promise, so it needs a test
- [ ] **Assert nothing is written to storage** — check localStorage,
      sessionStorage and IndexedDB are untouched after opening a file
- [ ] A v1-format backup (no `period` field) opens

## Files likely touched

```
web-viewer/          (new — separate from the Expo app)
tests/e2e/           (Playwright against the viewer)
```

## Out of scope

Editing, sync, and anything that writes. If a writable version is ever wanted,
it needs its own ADR — two writable copies with no server is a merge problem
nobody has asked for.

## Notes

Decide early whether this lives in this repo or its own. It shares the backup
format and nothing else, and it is a web app rather than an Expo app.

Once it exists it is probably the better public web story, and the dev preview
could stop being something the public ever sees.

## Blockers

None, but T-035 would change the key format, so doing that first avoids
building the key input twice.

## Why this was cut

Post-launch. Already unscheduled; making the cut explicit.

Cut on 22 September 2026 in the re-planning session. See
[COMMERCIAL-PLAN.md](../COMMERCIAL-PLAN.md).
