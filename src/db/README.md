# src/db

| File           | Purpose                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `schema.ts`    | One schema for every platform, plus `PRAGMA user_version` migrations           |
| `index.ts`     | Native: opens the SQLCipher-encrypted database, key from the OS keystore       |
| `index.web.ts` | Web preview: same schema, **unencrypted**, via expo-sqlite's wa-sqlite backend |
| `repo.ts`      | All queries. One implementation serves both platforms                          |

Because the schema is shared, `repo.ts` never branches on platform. Only the
_opening_ of the database differs, which is why the split is at `index.ts`
rather than inside the repository.

## Migrations

Add a numbered entry to `MIGRATIONS` in `schema.ts` and raise
`LATEST_VERSION`. Migrations run in order on every launch and must be
idempotent (`CREATE TABLE IF NOT EXISTS`). A migration that changes existing
rows needs a test that starts from a database populated at the previous
version — see `tests/unit/db/`.

Never edit a migration that has shipped; add another one.
