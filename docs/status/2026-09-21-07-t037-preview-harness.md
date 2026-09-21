T-037 done: the app can be looked at without typing
entries for ten minutes. `npm run dev` is one command for launching, building,
serving and testing; `npm run web:build` and `web:serve` give a static preview
with no Metro running. Demo data seeds from Settings — everything it writes is
labelled DEMO, every entry point refuses outside a development build, and the
wipe is proven by test and by an end-to-end run to leave every table empty.
Fixed a rough edge it exposed: the app only checked for a profile on mount, so
it kept showing a name and a level for data that had been removed. Next task:
T-022 or T-023.
