T-022: the timeline now reads Day, then period.

Grouping and filtering went into `src/domain/grouping.ts` rather than the
screen, so it is covered without a renderer and search can reuse it. Days run
newest first; inside a day the periods run Morning, Afternoon, Night and the
entries in each run earliest first, so a day reads in the order it was lived.
A period nobody wrote in is not drawn at all — an empty section would read as
a gap someone failed to fill.

Filters are period and life area, combinable, plus search, all of which pass
through the same function. An empty list means "all", so clearing is one
reset rather than a set of boxes to re-tick.

Two things the next person should know. The stored `period` from T-021 is
used when a row has one and derived from the timestamp when it does not, so
pre-migration rows still group — the timestamp stays authoritative. And the
per-card date came off, because a full date on every card makes the day
heading decoration; an event whose life area is not in `DOMAINS` now shows no
meta line instead of a trailing separator.

Left alone on purpose: the loading effect still does not cancel, which is
T-014's job, and the demo seeder writes life areas (`home`, `life`, `growth`)
that are not in `DOMAINS`. That mismatch predates this task and wants its own
change.
