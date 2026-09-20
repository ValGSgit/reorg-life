# Character art

Three transparent PNGs per character, about 512px, same soft 3D-illustrated
style across all six:

```
sprout-neutral.png  sprout-happy.png  sprout-tired.png
comet-…  ember-…  moss-…  blaze-…  dusk-…
```

Ids and personalities live in `src/domain.ts`. Once the files are here,
uncomment the matching entry in `src/characterArt.ts` — the app falls back to
the drawn blob for any character that has no art yet, so partial sets are fine.

No text, no real-world brands, no existing characters.
