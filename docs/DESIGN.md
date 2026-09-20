# Design

Brand and visual-design notes. This is a design brief and rationale, not
implementation — none of `src/` or `assets/characters/` was touched to produce
it. Concept source files (SVG) and rendered PNGs live in
[`assets/brand/`](../assets/brand/).

---

## App icon: "somewhere to put your day down"

The brief was explicit: not a mascot logo. ReorgLife rotates between three
companions through the day (ADR 0001), so an icon built around any one of them
— Sprout's seedling, Ember's fox, Dusk's owl — would misrepresent the other
two every time it wasn't their turn. It would also compete with the character
art instead of sitting quietly above it on a home screen.

**Concept.** A small round weight, resting on a low shelf. Two flat shapes,
nothing else:

- The **shelf** — a wide, softly rounded bar. The place you put something down.
- **The day** — a circle, set down on top of it, not held, not floating.

That's the whole idea: check-ins, journal entries, habits — this app is
somewhere to set the day down rather than carry it. No face, no plant, no
animal, so it doesn't read as a companion and doesn't age when a new one is
added later.

**Why it survives 48px.** Two shapes, two colours, no internal detail, no
thin strokes. The circle sits _on_ the shelf with a plain tangent contact
(not buried into it), which was a deliberate second pass — the first draft had
the circle overlapping the bar and read as a head-and-shoulders avatar glyph
at small sizes. Pulling it up to a clean rest position and offsetting it
off-centre removed that reading and made it look like an object placed down,
not a person.

**Colour.** Pulled directly from `src/theme.ts` rather than inventing a new
palette: cream `bg` (`#F7F4EF`) as the field, `accent` blue (`#6C8EBF`) for
the shelf, `good` green (`#7DB88B`) for the circle. Using the app's own tokens
means the icon and the app it opens into are visibly the same object, and a
future retheme only has to touch one file.

**No text, no brand marks.** Per the brief and per `docs/ASSETS.md`'s no-text
rule already in force for character art.

**Files.**

| File                             | Size      | Use                                      |
| -------------------------------- | --------- | ---------------------------------------- |
| `assets/brand/icon-1024.png`     | 1024×1024 | Master / iOS App Store                   |
| `assets/brand/icon-play-512.png` | 512×512   | Google Play Store listing                |
| `assets/brand/icon.svg`          | vector    | Source; re-export if the palette changes |

Both PNGs are full-bleed flat colour with no pre-rounded corners, per Apple
and Google's own guidance — each store applies its own mask, and a second
rounding baked into the asset shows up as a visible seam.

**Not done here:** wiring these into `app.json` / `assets/icon.png` and the
Android adaptive-icon layers (`android-icon-background.png`,
`android-icon-foreground.png`, `android-icon-monochrome.png`) is an
implementation task, not a design one, and touches files outside this agent's
scope. The adaptive-icon split would reuse the same two shapes: shelf +
circle as the foreground layer, cream as the background layer.

---

## Home screen: companion, level, life garden

One layout, shown in both themes, built entirely from tokens already in
`src/theme.ts` — no new colours introduced.

`assets/brand/home-light.png` / `home-dark.png` (source: matching `.svg`
files in the same folder).

**Structure, top to bottom:**

1. **Greeting + streak line**, left-aligned, matching the tone rule in
   AGENTS.md — "Rest days are built in," not "don't break your streak." A
   small pill in the top-right names the current period (_Afternoon_), a
   quiet nod to the time-of-day rotation without needing a clock icon.
2. **Companion card** — the companion (Ember shown as the example), name and
   level, and an XP bar. This mirrors what `Home.tsx` already renders; the
   design contribution is spacing and a card treatment that gives the
   companion room to breathe rather than sitting flush against habit lists.
3. **Life garden card** — see below.

**Life garden, reconsidered.** The current implementation
([`Home.tsx`](../src/features/home/Home.tsx)) draws each life domain as a
horizontal progress bar. That's legible but it's a bar chart wearing a garden
name. This design proposes the literal metaphor instead: each domain is a
stem rising from a shared ground line, topped with a small bud, height
mapped to recent activity — using the exact colours already defined in
`DOMAINS` (`src/domain/domains.ts`), so no new domain palette is needed.

A tall stem next to a short one reads the same information as a long bar next
to a short one, but it _looks_ like a garden bed instead of a dashboard,
which is the point of the name. Quiet domains are short stems, not red bars
or empty slots — nothing in the visual language implies failure, matching the
"quiet areas are not failures" caption already in the copy.

**Dark theme.** Every colour in the mockup is swapped from the `dark` object
in `theme.ts` (`bg`, `card`, `text`, `sub`, `line`, `good`); the companion's
own colour and the six domain colours are left unchanged in both themes,
since those are identity colours, not surface colours, and shifting them
between themes would make the companion or a domain look like a different
thing at night.

**Not done here:** turning the stem-and-bud garden into a real
`src/features/home` component is implementation work. If it's picked up, the
height mapping used in the mockup (`min(1, count / 5)` scaled to a max stem
height) matches the ratio already used by the existing bar version, so the
underlying data query in `db/repo.ts` (`domainActivity()`) doesn't need to
change — only how it's drawn.
