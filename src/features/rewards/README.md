# rewards

Empty on purpose. The level-gated unlockables are implemented as pure logic in
`src/domain/unlockables.ts`, and the picker UI currently sits inside
`settings/Settings.tsx`.

Extracting that picker into this folder is a task, not a rewrite — see
`docs/tasks/`. Kept as a named home so the extraction has an obvious
destination.
