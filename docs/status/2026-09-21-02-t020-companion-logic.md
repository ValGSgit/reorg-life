T-020 done: `src/domain/companion.ts` decides the period and the
cross-fading companion pair from the local clock, with 38 tests covering both
daylight-saving days, the midnight wrap, a night-shift wake time and every
nonsense setting. `src/domain` stays at 100% coverage; the Jest suite now pins
`TZ=Europe/Vienna` so the DST cases are real. Nothing renders differently yet —
that is T-023. Next task: T-021.
