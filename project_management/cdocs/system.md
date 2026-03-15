# System Context: Javelin Idle

Javelin Idle is a browser-based idle/clicker typing game. The player types symbol sequences displayed on screen to earn score ("Characters Typed"), then spends score on upgrades that passively generate score over time. The game is designed to train stenography key combinations for programming symbols. All logic is TypeScript compiled to ES modules with no framework.

---

## Entry & Initialization

`main.ts` is the entry point, loaded via `<script type="module" src="./dist/main.js">` in `index.html`. It runs `new GameManager().startGame()` on `window.onload`. Module imports handle dependency resolution — no manual script ordering required.

`GameManager` constructor creates `Game`, `GameDisplay(game)`, and `GameController(game, display)` in order. `startGame()` calls `setupListeners()`, `gameController.doGameSetup()`, and `gameController.doPageSetup()`.

---

## Character Pool

`CharacterPool` (characterPool.ts) holds the set of typeable characters as a `pool` object (`Record<string, string>`) mapping keyboard key strings to display symbols. The starting pool is `getSymbols()`: programming punctuation (`{}()`, `*+-=,.[]`, `:;'"`) plus four arrow keys mapped to unicode arrows (`↑↓←→`). The purchase character `$` is reserved and excluded from the pool.

`addLetters()` merges `getLetters()` (a-z) into the pool, expanding what goals can be generated.

`generateKey(n)` builds a purchase key string: `$` followed by `n` randomly sampled pool symbols. This produces the typed sequence a player must enter to buy an upgrade.

`getRandomChar()` picks a random value from the pool to serve as the next typing goal.

`toString()` serializes as `JSON.stringify([purchaseChar, poolObj])` for save/load.

---

## Game State

`Game` (game.ts) owns all mutable game state:

- `score` — integer, incremented by `scoreMulti` on each successful type, decremented on upgrade purchase.
- `scoreMulti` — starts at 1; multiplied by 1.5 when "Unlock Letters" is purchased.
- `goal` — the current symbol the player must type, set by `updateGoal()`.
- `characterPool` — a `CharacterPool` instance.
- `upgrades` — ordered array of `Upgrade` / `OneTimeUpgrade` instances, created by `makeUpgrades()`.

`makeUpgrades()` defines all upgrades in order:

| Name | Base Cost | Cost Increase | Key Length | Key Length Increase | Auto-Score Value | Reveal Threshold |
|------|-----------|--------------|------------|---------------------|-----------------|-----------------|
| Two finger typer | 20 | 3 | 3 | 1/3 | 0.25 | cost × 3/4 |
| Practiced two finger typer | 80 | 20 | 5 | 2/3 | 0.75 | cost × 3/4 |
| Unlock Letters (OneTime) | 500 | — | 10 | — | — | cost × 4/5 |
| New touch typer | 1000 | 50 | 10 | 1 | 1.75 | cost × 3/4 |

`scoreSuccess()` adds `scoreMulti` to `score`. `updateGoal()` calls `characterPool.getRandomChar()` and stores the result as `goal`.

`toString()` / `createGameFromObj()` handle full serialization: score, scoreMulti, goal, characterPool (as JSON string), and upgrades (each as a JSON string within the array).

---

## Upgrades

`Upgrade` (upgrade.ts) is the repeatable upgrade type. Fields: `name`, `cost`, `costIncrease`, `thresholdMulti` (fraction of cost at which the card is revealed to the player), `owned`, `key` (current purchase sequence), `keyLength`, `keyIncrease`, `value` (score added per auto-score tick), `started` (whether the auto-scoring interval is running).

`purchase(characterPool)` increments `owned`, adds `costIncrease` to `cost`, and regenerates `key` with length `keyLength + (owned × keyIncrease)` — so purchase keys grow longer with each copy owned.

`OneTimeUpgrade extends Upgrade` with `owned` capped at 1 and an `onPurchase` callback that fires on purchase. Cost/key/value deltas are all 0. "Unlock Letters" passes `() => game.addLetters()` as its callback, which bumps `scoreMulti` by ×1.5 and calls `characterPool.addLetters()`.

---

## Input & Game Loop

`GameController` (gameController.ts) handles all interaction:

**Input verification** — `keydown` on the typing input calls `verifyInput(e)`. If the input field is in error state, it is cleared first. The current input value plus the symbol mapped from `e.key` (via `characterPool.getSymbolByKey`) forms the candidate string. Three checks run in order:

1. Cheat code: if candidate equals `"ababvoidgloom*"`, add 1000 to score and call `inputCorrect()`.
2. Scorable: if candidate equals `game.goal`, call `inputCorrect()`.
3. Upgrade key: if candidate matches any `upgrade.key`, call `attemptUpgradePurchase(upgrade)`. For `OneTimeUpgrade`, also hide its display card.

Arrow keys append their unicode symbol to the input value (they do not fire the normal input event path cleanly).

**inputCorrect()** — flashes the input green, calls `game.scoreSuccess()`, clears the input, updates the score display, calls `game.updateGoal()`, and updates the goal display.

**attemptUpgradePurchase(upgrade)** — if `score >= upgrade.cost`, deducts cost, calls `upgrade.purchase(characterPool)`, clears input, flashes success. Otherwise puts the input into error state (red/`---`).

**Game loop** — `runGameLogic()` sets a 100ms interval that calls `manageUpgrades()`, `display.revealUpgrades()`, `display.displayUpgrades()`, and `display.displayScore()`.

**Auto-scoring** — `manageUpgrades()` checks each upgrade; if `owned > 0` and `started === false`, it calls `runAutoScoring(upgrade)` and marks `started = true`. `runAutoScoring` adds `upgrade.value` to `game.score` and schedules itself again via `setTimeout(fn, 1000 / upgrade.owned)` — so each additional copy owned doubles the tick frequency (one copy = 1 tick/sec, two copies = 2 ticks/sec, etc.).

---

## Display

`GameDisplay` (gameDisplay.ts) owns all DOM references and `UpgradeDisplay` instances. On construction it queries `.score-value`, `.typing-input`, `.goal-value`, `.upgrades`, and `.auto-inputs`. It creates one `UpgradeDisplay` per upgrade via `createDisplayFromUpgrade`, which also appends the upgrade card HTML and an auto-input element to the DOM.

`revealUpgrades()` iterates `lockedUpgradeDisplays` and calls `display.reveal()` (removes `unavailable` class) for any whose `threshold ≤ game.score`. Revealed displays are spliced from the locked list.

`displayUpgrades()` calls `display.display()` on every upgrade display, updating cost, key, owned count, and ch/s values. If `owned > 0` and not yet revealed at the display level, it un-hides the owned/chps rows and the auto-input field.

`UpgradeDisplay` (upgradeDisplay.ts) manages a single upgrade card and its associated auto-input element. `displayAutoScore(characterPool)` is called by `runAutoScoring` to animate the auto-input: it appends `upgrade.value × 4` random symbols, wrapping and flashing green when the 4-character display limit is reached.

---

## Save / Load

`GameManager` (gameManager.ts) wires three buttons:

- **Save game** — calls `game.toString()` and writes to `localStorage["gameSave"]`.
- **Copy game save string** — calls `game.toString()` and writes to clipboard via `navigator.clipboard.writeText`.
- **Load** — if the load input is empty, reads `localStorage["gameSave"]`; otherwise parses the input text. In both cases calls `createGameFromObj(gameObj)`.

`GameManager.createGameFromObj(gameObj)` replaces `this.game` with a new `Game(gameObj)`, updates `gameDisplay.game` and `gameController.game` references, recreates upgrade display instances via `gameDisplay.createDisplays`, and calls `doPageSetup()` to re-initialize the UI.

When loading a saved game, `Game.createGameFromObj` restores score, scoreMulti, goal, characterPool, and upgrades. For each upgrade, cost/owned/key are overwritten from the save. If a `OneTimeUpgrade` has `owned > 0`, its `onPurchase` callback fires immediately to re-apply its side effects (e.g. re-adding letters to the pool).

---

## DOM Structure

The page has three layout regions: `.header` (title + save/load controls), `.center` (stat displays, input area, goal display, upgrade cards), `.footer` (attribution). The `.inputs` grid places `.auto-inputs` in column 1 and `.typing-input` in column 2. `.unavailable` is `display: none` — used to hide stat rows, upgrade cards, and auto-input fields until the relevant conditions are met.

---

## Infrastructure

TypeScript source lives in `src/`, compiled via `tsc` to `dist/` (gitignored). `npm run build` runs the compiler. Primary deployment target is GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`) that compiles TypeScript and deploys. A Docker setup (`Dockerfile`, `docker-compose.yml`, `nginx.conf`) is also provided for local development — the Dockerfile uses a multi-stage build (Node for compilation, Debian/Nginx for serving).
