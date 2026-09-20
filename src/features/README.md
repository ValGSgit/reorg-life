# src/features

One folder per feature. A feature owns its screens and any components only it
uses; anything shared moves up to `src/components`.

| Folder | Status |
| --- | --- |
| `checkin/` | Daily check-in and mood |
| `habits/` | Recurring habits and gentle streaks |
| `timeline/` | Past and upcoming entries by life area |
| `home/` | Companion, level, life garden |
| `onboarding/` | First run |
| `settings/` | Reminders, companion, backups |
| `rewards/` | Placeholder. Unlockable logic is in `src/domain/unlockables.ts`; the picker currently lives in `settings/Settings.tsx` and is waiting to be extracted here |
| `integrations/` | Placeholder for read-only calendar sync and Notion sync |

Features import from `../../domain`, `../../db/repo` and `../../components`.
They must not import from each other; if two features need the same thing, it
belongs in `domain/` or `components/`.
