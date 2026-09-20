# tests

| Folder         | Environment                | What belongs here                                                          |
| -------------- | -------------------------- | -------------------------------------------------------------------------- |
| `unit/domain/` | plain Node                 | Pure logic from `src/domain`. Fast, and where the product rules are pinned |
| `unit/db/`     | plain Node + `node:sqlite` | Schema, migrations, repository, backup encryption                          |
| `component/`   | jest-expo                  | Screens and components, via React Native Testing Library                   |
| `e2e/`         | Playwright                 | The critical flow, against the web build                                   |
| `helpers/`     | —                          | `testDb.ts`, and an `expo-crypto` double backed by real WebCrypto          |

Run one suite with `npx jest --selectProjects domain` (or `db`, `component`).

## Two things that will trip you up

**`render` is async** in React Native Testing Library 14, and the
`UNSAFE_*ByType` queries are gone. Assert against the rendered tree instead.

**`jest.mock` is hoisted** above the imports, so its factory may only close
over variables whose names begin with `mock`. That is why the db tests use
`mockDb`.

## Why real SQLite rather than a mock

`tests/helpers/testDb.ts` runs Node 22's built-in `node:sqlite`. The things
worth testing in `src/db` are the SQL and the migrations themselves —
constraints, `INSERT OR REPLACE`, transaction rollback. A hand-written fake
would happily accept SQL that SQLite rejects, which is precisely the bug class
these tests exist to catch.

## Why the crypto double is a real implementation

`tests/helpers/expoCryptoMock.ts` is AES-256-GCM over Node's WebCrypto, not a
stub. The behaviour under test is that a wrong key or a tampered file **fails
authentication**. A fake that compared keys would pass while the real thing
was broken.

## The rule

Never weaken a test to get CI green — see [../AGENTS.md](../AGENTS.md). If a
test looks wrong, it is telling you something.
