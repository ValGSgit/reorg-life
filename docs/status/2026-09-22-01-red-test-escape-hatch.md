Gave the pre-commit hook one named escape hatch, `ALLOW_RED=1`, so the
failing-test commit the definition of done asks for can actually be made.
The hook runs the unit suite, so a red commit was rejected, and the only way
round it was `--no-verify` — which also switches off the gitleaks secret scan
and the personal-data guard. Two agents hit this independently, and the rule
as written was steering both of them towards the least safe option available.

The hatch skips the unit-test step and nothing else. Lint, formatting,
typecheck, the secret scan, the personal-data guard and the placeholder-art
guard all still run, and CI still runs the full suite, so nothing red can
reach `main` through it. `tests/unit/scripts/pre-commit.test.ts` is new and
holds it to that shape: it runs the real hook against a throwaway repository
with a stubbed `npx`, and fails if the hatch ever grows to cover lint or —
the case actually worth guarding — the secret and personal-data checks.

Decided by the owner over the alternative, which was to drop the
commit-history requirement from AGENTS.md and rely on the PR description
instead.

Worth knowing: the hook selects the `domain` and `db` projects only, so red
tests under `tests/unit/scripts/` and `tests/component/` were always
committable. The block only ever applied to domain and db tests.

Fixed one thing found on the way: `--generate` joined every status entry
tightly, so any entry running to more than one paragraph produced a ROADMAP
that `format:check` rejected. Running prettier fixed it until the next
`--generate` undid it again. `assembleStatusLog` now leaves the blank line
prettier wants, and three tests hold it there.
