# Upgrades Context: Javelin Idle

## Upgrade Class

`Upgrade` (upgrade.ts) is the repeatable upgrade type. Fields: `name`, `cost`, `costIncrease`, `thresholdMulti`, `owned`, `key` (2-char selector), `completionKey` (long random sequence), `keyLength`, `keyIncrease`, `value`.

Each upgrade has two key components:

- **Selector key** (`key`) — always `$` + 1 pool char, shown on the card, never regenerated after initial assignment. Used to enter completion mode.
- **Completion key** (`completionKey: string[]`) — a random pool-char sequence of length `keyLength + owned × keyIncrease`, not shown on the card, regenerated on purchase and when char sets change. Each entry may be a single character or a multi-character word.

`purchase(characterPool)` increments `owned`, adds `costIncrease` to `cost`, and regenerates only `completionKey` with length `keyLength + (owned × keyIncrease)`. Selector key is unchanged.

---

## OneTimeUpgrade Class

`OneTimeUpgrade extends Upgrade` with `owned` capped at 1 and an `onPurchase` callback that fires on purchase. Cost/key delta/value are all 0. Accepts an optional `keyLength` parameter (passed to `super`) so `regenerateCompletionKeys()` can correctly compute its completion key length.

- **"Unlock Letters"** — passes `keyLength = 10` and `() => game.addLetters()` as its callback, which bumps `scoreMulti` by ×2.5 and calls `characterPool.addLetters()`.
- **"Unlock Words"** — passes `keyLength = 12` and `() => game.addWords()` as its callback, which bumps `scoreMulti` by ×10 and calls `characterPool.addWords()`.

---

## Serialization

Only the selector key (`key`) is serialized. Completion keys are regenerated fresh on load via `regenerateCompletionKeys()`.
