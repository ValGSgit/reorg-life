Raised the component suite's test timeout. The first
test in `Timeline.test.tsx` was failing on CI with "exceeded timeout of
5000 ms" — on two unrelated PRs in a row, which makes it systematic rather
than bad luck. It is the cold-start cost of standing up the react-native
module graph, paid by whichever test runs first in a file; the whole file
takes about nine seconds. Nothing in the app got slower and no assertion
changed. It is set in the component suite’s setup file rather than the Jest
config, because testTimeout is not a per-project option — Jest ignores it
there, which the first attempt at this did before the warning was noticed.
