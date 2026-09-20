# Third-party licences

> **This is not legal advice.** It is a record of what `node scripts/audit-licenses.mjs`
> found, plus a few things the script cannot see, checked by hand. If you are
> about to sell this app, have a lawyer confirm the parts that matter before
> you rely on any of it. Last checked: 20 September 2026, against `package.json`
> as it stood on this branch.

## What the audit script does and does not do

`node scripts/audit-licenses.mjs` reads the `license` field every installed
package declares in its own `package.json` and sorts packages into
permissive / weak copyleft / strong copyleft / unknown, for a closed-source,
paid app.

It cannot see:

- A licence that is wrong or missing in a package's own `package.json`.
- A second, different licence on source code vendored *inside* a package
  (a native library bundled into an npm wrapper, for instance — see
  SQLCipher below).
- Whether a dependency is actually reachable at runtime versus only used by a
  build tool. `--prod` follows the `dependencies` graph in `package.json`,
  which is close but not exact — see caniuse-lite below.

Treat the script as a first pass that catches the obvious problem (a GPL
package in the shipping tree) and flags what still needs a human look. It is
not a substitute for reading this file.

## Headline result

| Run                              | Packages | Permissive | Weak copyleft | Strong copyleft | Unknown |
| --------------------------------- | -------: | ---------: | ------------: | ---------------: | ------: |
| `--prod` (shipping dependency tree) |      448 |        447 |              0 |                 0 |       1 |
| `--full` (everything installed)   |      968 |        965 |              2 |                 0 |       1 |

**Zero copyleft in the shipping tree. Zero strong copyleft anywhere, shipping
or not.** The `--full` run's two weak-copyleft entries (`lightningcss`,
`lightningcss-win32-x64-msvc`, both MPL-2.0) are dev-only build tooling — they
do not appear in the `--prod` run and are not present in the app that a user
installs.

The one "unknown" entry — `caniuse-lite`, CC-BY-4.0 — is not actually a risk;
see below.

## The three things worth reading, not just the table

### Expo, React Native and React — MIT

The three packages the app is built on (`expo`, `react-native`, `react`, plus
`react-dom` and `react-native-web` for the web preview) are all MIT. MIT
permits commercial use, modification and distribution, and only requires that
the licence and copyright notice travel with copies of the software — same
requirement as everything else in the permissive bucket. No action beyond
what this document already covers.

### SQLCipher — BSD-3-Clause (Zetetic LLC), vendored inside `expo-sqlite`

`expo-sqlite`'s own `package.json` declares **MIT** — correctly, for the
JS/native wrapper code Expo wrote. But `expo-sqlite` vendors the SQLCipher
amalgamation source directly (`node_modules/expo-sqlite/vendor/sqlcipher/sqlite3.c`,
built as `expo-sqlite/android/build.gradle` with
`-DSQLITE_HAS_CODEC=1 -DSQLCIPHER_CRYPTO_OPENSSL`). SQLCipher itself is
licensed **BSD-3-Clause by Zetetic LLC**. This is exactly the kind of
second, nested licence the audit script says it cannot see — it only reads
the wrapper's declared MIT licence, not the vendored C source underneath it.

BSD-3-Clause permits commercial use and closed-source distribution. Its one
condition that a permissive licence like MIT does not usually spell out this
explicitly: **the copyright notice, list of conditions, and disclaimer must
be reproduced in the documentation and/or other materials provided with the
binary distribution** — i.e. it is not enough that the notice exists inside
source code nobody using the app will ever see. A `LICENSE` file in the repo
does not satisfy this for an app a user installs; it needs to be reachable
*from inside the shipped app*.

**Action:** the app needs an "Open source licences" screen (or an entry in
Settings) that reproduces the SQLCipher BSD-3-Clause notice, alongside MIT
notices for Expo/React Native/React and the other permissive dependencies
above a reasonable threshold. This is now a task — see
[T-032](tasks/T-032-open-source-licences-screen.md).

Android also links SQLCipher against OpenSSL via
`compileOnly 'io.github.ronickg:openssl:3.3.2-1'` in
`expo-sqlite/android/build.gradle`. OpenSSL is Apache-2.0 (since 3.0), which
is already in the permissive bucket and carries the same attribution
requirement as SQLCipher — the licences screen should cover it too. Confirm
the OpenSSL notice text against whatever version actually ships once a real
Android build exists (there is no `android/` directory in this repo yet;
Expo generates it at prebuild time).

Plain SQLite — the non-encrypted engine used incidentally by some tooling —
is public domain and needs no notice at all. It is SQLCipher, not SQLite,
that carries the obligation here.

### caniuse-lite — CC-BY-4.0, but build-time only

`caniuse-lite` is CC-BY-4.0 (a data-only licence requiring attribution if
redistributed), and the `--prod` audit flags it `[SHIPS]` because it is
technically reachable by walking `dependencies` in `package.json`:

```
reorg-life → expo → @expo/metro-config → browserslist → caniuse-lite
```

`@expo/metro-config` is a **build-time** package: it configures the Metro
bundler (target platforms, transform options) during `expo export` / the EAS
build, and `browserslist`/`caniuse-lite` supply browser-compatibility data to
that configuration step. Neither the app's source (`src/`) nor its build
config (`metro.config.js`, `babel.config.js`, `app.json`) references
`browserslist` or `caniuse-lite` directly — confirmed by grep. `caniuse-lite`
is compatibility *data* consumed by the bundler while it decides what to
build, not code that gets pulled into the JS bundle the app ships. The
audit script's dependency walk cannot distinguish "installed as a transitive
build-time dependency" from "ends up in the artefact," which is exactly the
limitation the script's own header comment calls out.

**Conclusion: not a risk.** Nothing to add to a licences screen for this one,
since it is not distributed to users. Worth re-checking if the build pipeline
changes (e.g. if browserslist output ever gets baked into a served web
asset).

## Full package list

Run `node scripts/audit-licenses.mjs --full` for the complete, current list —
968 packages at last count, one line each. It is too long and too volatile
(any `npm install`) to usefully freeze into this file; this document instead
records the *shape* of the result and the exceptions that need judgement.
Re-run before every release and re-check this file if the shape changes
(anything moves into weak or strong copyleft, or a new "unknown" appears).

## What would actually stop a release

Per `scripts/audit-licenses.mjs`, the check that matters for CI: **any
strong-copyleft package (GPL, AGPL, SSPL) reachable from `dependencies`**
fails the script with a non-zero exit. There are currently zero. If that ever
changes, do not ship — either remove the dependency, replace it, or get a
different licence from the author before merging.

## Related

- [docs/ASSETS.md](ASSETS.md) — the licensing problem that actually blocks
  release right now is not code, it's the character art (T-010). Nothing in
  this file changes that.
- [docs/COMMERCIAL.md](COMMERCIAL.md) — what else is needed to sell this
  legally, beyond dependency licences.
- [docs/tasks/T-032-open-source-licences-screen.md](tasks/T-032-open-source-licences-screen.md) —
  the task this document produced.
