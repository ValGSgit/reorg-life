# Labels

Create these once, under Issues → Labels. The task system and
`scripts/next-task.mjs` assume they exist.

| Label             | Colour    | Meaning                                               |
| ----------------- | --------- | ----------------------------------------------------- |
| `task`            | `#0E8A16` | A unit of work with acceptance criteria               |
| `bug`             | `#D73A4A` | Behaves differently from what it should               |
| `claude`          | `#7B61FF` | **Adding this to an issue starts Claude on it**       |
| `blocked`         | `#B60205` | Cannot start; the reason is in the issue or task file |
| `cut-candidate`   | `#FBCA04` | May be dropped if the schedule slips — see ROADMAP    |
| `dependencies`    | `#0366D6` | Dependabot                                            |
| `P1`              | `#B60205` | Blocks the release                                    |
| `P2`              | `#FBCA04` | Planned                                               |
| `P3`              | `#C2E0C6` | Nice to have                                          |
| `milestone:W3-4`  | `#BFD4F2` | 5–18 Oct                                              |
| `milestone:W5-6`  | `#BFD4F2` | 19 Oct – 1 Nov                                        |
| `milestone:W7-8`  | `#BFD4F2` | 2–15 Nov                                              |
| `milestone:W9-10` | `#BFD4F2` | 16–29 Nov                                             |
| `milestone:W11`   | `#BFD4F2` | 30 Nov – 6 Dec                                        |
| `milestone:W12`   | `#BFD4F2` | 7–13 Dec                                              |

## Creating them quickly

With the `gh` CLI, from the repository:

```sh
gh label create task           --color 0E8A16 --description "A unit of work with acceptance criteria"
gh label create claude         --color 7B61FF --description "Adding this label starts Claude on the issue"
gh label create blocked        --color B60205 --description "Cannot start yet"
gh label create cut-candidate  --color FBCA04 --description "May be dropped if the schedule slips"
gh label create P1             --color B60205 --description "Blocks the release"
gh label create P2             --color FBCA04 --description "Planned"
gh label create P3             --color C2E0C6 --description "Nice to have"
for w in W3-4 W5-6 W7-8 W9-10 W11 W12; do
  gh label create "milestone:$w" --color BFD4F2
done
```

`bug` and `dependencies` already exist in a new repository.
