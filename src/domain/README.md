# src/domain

Pure logic. **No React, no react-native, no Expo imports** — not even types.

That restriction is the point: everything here runs in plain Node, so it can
be unit-tested without a renderer or a device, and CI holds this folder to a
coverage floor (see AGENTS.md).

| Module           | Contents                                                 |
| ---------------- | -------------------------------------------------------- |
| `xp.ts`          | `XP_PER_*`, `levelFor`, `xpForLevel`                     |
| `streaks.ts`     | `SCHEDULES`, `isDueOn`, `gentleStreakOn`, `gentleStreak` |
| `unlockables.ts` | Level-gated accessories, `equippedItem`, `nextUnlock`    |
| `characters.ts`  | `CHARACTERS`, `MOODS`                                    |
| `companion.ts`   | `periodFor`, `companionFor`, `resolvePeriodSettings`     |
| `domains.ts`     | `DOMAINS` (life areas)                                   |
| `time.ts`        | `dayKey`, local-time day boundaries                      |
| `index.ts`       | Barrel re-export; import from `'../domain'`              |

Product rules encoded here are protected by tests and must not be weakened:
a streak forgives one missed day, days a schedule does not ask for are skipped
rather than counted as misses, and XP is never removed.

`companion.ts` also encodes two rules worth stating: it reads the **local**
clock at the moment of the call and never stores an offset, and a contradictory
setting falls back to the default rather than throwing — a crash here would
take the home screen down. See
`docs/DECISIONS/0001-time-of-day-companions.md`.

The Jest domain suite runs with `TZ=Europe/Vienna` (set in `jest.config.js`)
so the two daylight-saving cases are real rather than theoretical.
