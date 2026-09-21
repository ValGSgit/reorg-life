T-021 done: check-ins and events carry the period they
happened in. Migration 3 rebuilds `checkins` to move the UNIQUE constraint from
`day` to `(day, period)`, backfilling every existing row from the timestamp it
already had — tested against a populated v2 database, which is the case that
would have destroyed real entries. The timestamp stays authoritative, so
`recomputePeriods()` can rebuild the history if the boundaries move. Up to
three check-ins a day now, the first worth full XP and later ones a smaller
bonus; the streak still counts days rather than check-ins and still forgives
one missed day. A backup taken before the migration restores with its periods
derived on the way in. Next task: T-037.
