# src

| Folder | What lives here | May import React? |
| --- | --- | --- |
| `domain/` | Pure logic: XP, levels, streaks, unlockables, life areas, companions | **No** |
| `db/` | Schema, migrations, repository functions | No |
| `features/` | Screens grouped by feature | Yes |
| `components/` | Shared presentational components | Yes |

Loose modules at this level are cross-cutting platform adapters, each with a
`.web.ts` twin where the browser needs different behaviour:

| File | Purpose |
| --- | --- |
| `kv.ts` / `kv.web.ts` | Key/value store: OS keystore on native, `localStorage` on web |
| `backupFile.ts` / `backupFile.web.ts` | Writing and reading a backup file |
| `backup.ts` | Encrypt/decrypt a backup (same on every platform) |
| `reminders.ts` | Local notifications; a no-op on web |
| `characterArt.ts` | Maps character + mood to artwork, falling back to the blob |
| `theme.ts` | Colours for light and dark |

The dependency rule is one-directional: `features/` may import `db/`,
`domain/` and `components/`; `db/` may import `domain/`; `domain/` imports
nothing from this app. Breaking that rule is what makes logic untestable, so
it is worth keeping.
