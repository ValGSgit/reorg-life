# src/components

Presentational components shared by more than one feature.

| Component | Notes |
| --- | --- |
| `Character.tsx` | Companion: artwork when present, hand-drawn blob otherwise, plus unlocked accessories |
| `ui.tsx` | `Card`, `Button`, `H`, `Sub` — the whole design system for now |
| `WebNotice.tsx` / `.web.tsx` | Renders nothing on native; the non-secure-preview banner on web |

A component here takes props and renders. It should not read the database or
schedule notifications — that belongs to the feature that owns the screen.
