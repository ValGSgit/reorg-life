Fixed a red `main`. Dependabot proposed `react-native-reanimated` 4.7.0, it was
merged as PR #33, and it broke `npm ci` outright — so every CI job since has
died at install, including the one for PR #34 that merged after it. Reanimated
4.6+ needs `react-native-worklets` 0.13.x while `expo-modules-core` 57 pins it
to `^0.10.0`. Worklets is transitive, so nothing in `package.json` showed a
conflict and the failure only appeared when npm tried to resolve.

Two things made this land unnoticed. PR #33's own check run was cancelled
rather than failing, so it merged without ever going green. And a local
`npm run verify` passes on an older `node_modules`, because nothing re-resolves
until `npm ci` runs — which is why the docs PR opened afterwards looked green
locally and red on CI.

Reverted `package.json` **and** `package-lock.json` to 4.5.1. Reverting
`package.json` alone is not enough; `dependabot.yml` already recorded that
lesson from the eslint 10 incident.

`react-native-reanimated` and `react-native-worklets` are now in the
Dependabot ignore list with the Expo SDK siblings, where they always belonged.
`tests/unit/scripts/dependabot-policy.test.ts` is new and asserts the list
stays complete, plus that reanimated stays on 4.5.x — the policy was already
written in a comment in that file, and a comment cannot fail a build.

First real use of the `ALLOW_RED=1` hatch added earlier today, for the red
test commit.
