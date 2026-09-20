# Assets

## Character art — placeholder, watermarked, do not ship

> **Every character image currently in this repository is a development
> placeholder generated on Higgsfield and carries a Higgsfield watermark on
> the source sheet. None of it is cleared for release.**
>
> It exists so the app can be developed and demonstrated against something
> other than coloured blobs. Before the closed test, and certainly before the
> public release on 14 December 2026, this art must be regenerated or
> relicensed on terms that permit distribution. See `docs/tasks/`.

### Where the files are

| Location                  | Contents                                                             | In git?             |
| ------------------------- | -------------------------------------------------------------------- | ------------------- |
| `assets/characters/_raw/` | Original Higgsfield sheets, ~2752×1536, several MB each, watermarked | **No** — gitignored |
| `assets/characters/*.png` | Processed 512px transparent PNGs used by the app                     | Yes                 |

### Why the raw sheets are gitignored rather than in Git LFS

LFS was considered. It was rejected because LFS still stores and bills for
every version of every object, and adds a step that has to be installed and
configured before a clone is usable. These files are disposable inputs: they
are watermarked, they will be replaced before release, and nothing is lost if a
future clone does not have them. Versioning them buys nothing and costs quota
and setup friction.

If final, licensed art later turns out to be large enough to matter, revisit
this with an ADR.

### What the sheets contain

Three of the five sheets are companions; two are unrelated human figures from
the same session.

| File        | Subject                                   | Usable?                                                                          |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `288f4c1b…` | Sprout — green seedling, five mood stages | Yes                                                                              |
| `240ac547…` | Ember — orange fox, five mood stages      | Yes                                                                              |
| `ec0aaa60…` | Dusk — purple owl, five stages            | **No** — "Stage 1…5" text is baked into the image, which breaks the no-text rule |
| `85ed51cd…` | Human male figure, body progression       | Not a companion                                                                  |
| `e4563cd7…` | Human female figure, body progression     | Not a companion                                                                  |

Comet, Moss and Blaze have no art at all. Dusk has none that is usable.

### What is currently processed and wired in

`scripts/process-character-sheets.py` cuts the usable sheets into per-mood
PNGs. It is run by hand:

```sh
python scripts/process-character-sheets.py
```

| Files                           | Character                | Status                                        |
| ------------------------------- | ------------------------ | --------------------------------------------- |
| `sprout-1.png` … `sprout-5.png` | Sprout                   | Placeholder, wired into `src/characterArt.ts` |
| `ember-1.png` … `ember-5.png`   | Ember                    | Placeholder, wired in                         |
| —                               | Dusk, Comet, Moss, Blaze | No art; the blob fallback renders instead     |

Mood runs 1 (rough) to 5 (thriving), matching the check-in scale.

> **These ten PNGs do not themselves carry the Higgsfield watermark**, because
> it sits in the corner of the sheet rather than on each figure. That does not
> make them shippable. They are derived from watermarked source art, their
> provenance is recorded here, and they must be replaced before release —
> task T-010. Do not treat the absence of a visible watermark as a licence.

### Rules for processing

- **Do not remove, paint over, or crop out watermarks** to make an asset look
  shippable. The watermark is the licence status made visible; hiding it does
  not change the licence.
- Processing means: cut each mood pose out of the sheet, drop the flat
  background to transparency, resize to about 512px, and save as
  `assets/characters/<id>-<mood>.png`.
- Note that a per-character crop does not itself carry the corner watermark.
  That does **not** make it shippable. The provenance is recorded here, and
  these files stay placeholder-only until they are replaced.

### Wiring art into the app

`src/characterArt.ts` maps character + mood to a `require()`. Metro resolves
those at build time, so a path listed there must exist. While the map is empty,
every companion falls back to the blob drawn in
`src/components/Character.tsx`, and a partial set is fine — a character with no
art keeps its blob while others show artwork.

Moods map as: happy (4–5), neutral (3), tired (1–2).

## App icons

`assets/icon.png`, `assets/splash-icon.png`, `assets/adaptive-icon*.png` and
`assets/favicon.png` are the Expo defaults. They are placeholders too, and are
on the store-listing task.

## Licence check before release

Nothing ships until every asset in `assets/` has a known, recorded licence that
permits distribution in a published app. That check is part of the release
checklist in [RELEASE.md](RELEASE.md).
