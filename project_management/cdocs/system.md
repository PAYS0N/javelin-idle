# System Context: Javelin Idle

Javelin Idle is a browser-based idle/clicker typing game. The player types symbol sequences displayed on screen to earn score ("Characters Typed"), then spends score on upgrades that passively generate score over time. The game is designed to train stenography key combinations for programming symbols. All logic is TypeScript compiled to ES modules with no framework.

---

## Entry & Initialization

`main.ts` is the entry point, loaded via `<script type="module" src="./dist/main.js">` in `index.html`. It runs `new GameManager().startGame()` on `window.onload`. Module imports handle dependency resolution — no manual script ordering required.

`GameManager` constructor creates `Game`, `GameDisplay(game)`, and `GameController(game, display)` in order. `startGame()` calls `setupListeners()`, `gameController.doGameSetup()`, and `gameController.doPageSetup()`.

---

## Character Pool

`CharacterPool` (characterPool.ts) holds typeable characters as named sets. Each set is a `CharSet`: `{ chars: Record<string, string>, enabled: boolean }`, stored in `sets: Record<string, CharSet>`. The active `pool: Record<string, string>` is derived from all enabled sets and rebuilt on any change.

The starting set is `"symbols"`: programming punctuation (`{}()`, `*+-=,.[]`, `:;'"`) plus four arrow keys mapped to unicode arrows (`↑↓←→`). The purchase character `$` is reserved and excluded from the pool.

`addSet(name, chars)` registers a new set (enabled by default) and rebuilds the pool. If the set already exists, only `chars` is updated and the existing `enabled` state is preserved.

`addLetters()` calls `addSet("letters", getLetters())` to merge a–z into the pool.

`toggleSet(name, enabled)` enables or disables a named set. If disabling the set would leave zero enabled sets, the call is a no-op and returns `false`; otherwise it updates the state, rebuilds the pool, and returns `true`.

`isSetEnabled(name)` and `getSetNames()` expose per-set state for the settings panel.

`generateKey(length, existingKeys?)` builds a purchase key string: `$` followed by `n` randomly sampled pool symbols. It retries until the key is not in `existingKeys`, then adds the new key to the set before returning.

`getRandomChar()` picks a random value from the pool to serve as the next typing goal.

`toString()` serializes as `JSON.stringify([purchaseChar, setsConfig])` where `setsConfig` is `Record<string, { chars, enabled }>`. Static methods `fromSave(purchaseChar, setsConfig)` and `fromOldSave(purchaseChar, poolObj)` handle new and legacy save formats respectively.

---

## Game State

`Game` (game.ts) owns all mutable game state:

- `score` — integer, incremented by `scoreMulti` on each successful type, decremented on upgrade purchase.
- `scoreMulti` — starts at 1; multiplied by 1.5 when "Unlock Letters" is purchased.
- `goal` — the current symbol the player must type, set by `updateGoal()`.
- `characterPool` — a `CharacterPool` instance.
- `upgrades` — ordered array of `Upgrade` / `OneTimeUpgrade` instances, created by `makeUpgrades()`.

`makeUpgrades()` defines all upgrades in order, using a shared `Set<string>` passed to each `generateKey` call to guarantee all initial keys are unique:

| Name | Base Cost | Cost Increase | Key Length | Key Length Increase | Auto-Score Value | Reveal Threshold |
|------|-----------|--------------|------------|---------------------|-----------------|-----------------|
| Two finger typer | 20 | 3 | 3 | 1/3 | 0.25 | cost × 3/4 |
| Practiced two finger typer | 80 | 20 | 5 | 2/3 | 0.75 | cost × 3/4 |
| Unlock Letters (OneTime) | 500 | — | 10 | — | — | cost × 4/5 |
| New touch typer | 1000 | 50 | 10 | 1 | 1.75 | cost × 3/4 |

`scoreSuccess()` adds `scoreMulti` to `score`. `updateGoal()` calls `characterPool.getRandomChar()` and stores the result as `goal`.

`regenerateAllKeys()` regenerates `key` for every upgrade using `keyLength + owned × keyIncrease`, collecting all keys into a shared `Set<string>` to prevent collisions. Called when the active char set changes — either from toggling a set off/on, or after a `OneTimeUpgrade` purchase that adds a new set.

`toString()` / `createGameFromObj()` handle full serialization: score, scoreMulti, goal, characterPool (as JSON string), and upgrades (each as a JSON string within the array). `createGameFromObj` detects old vs new CharacterPool save formats by inspecting the type of values in the second array element. `scoreMulti` is saved before `onPurchase` callbacks fire and restored afterward, preventing the multiplier from being applied twice on load.

---

## Upgrades

`Upgrade` (upgrade.ts) is the repeatable upgrade type. Fields: `name`, `cost`, `costIncrease`, `thresholdMulti`, `owned`, `key`, `keyLength`, `keyIncrease`, `value`.

`purchase(characterPool, existingKeys?)` increments `owned`, adds `costIncrease` to `cost`, and regenerates `key` with length `keyLength + (owned × keyIncrease)`.

`OneTimeUpgrade extends Upgrade` with `owned` capped at 1 and an `onPurchase` callback that fires on purchase. Cost/key delta/value are all 0. Accepts an optional `keyLength` parameter (passed to `super`) so `regenerateAllKeys()` can correctly compute its key length. "Unlock Letters" passes `keyLength = 10` and `() => game.addLetters()` as its callback, which bumps `scoreMulti` by ×1.5 and calls `characterPool.addLetters()`.

---

## Input & Game Loop

`GameController` (gameController.ts) handles all interaction:

**Input verification** — `keydown` on the typing input calls `verifyInput(e)`. If the input field is in error state, it is cleared first. The current input value plus the symbol mapped from `e.key` (via `characterPool.getSymbolByKey`) forms the candidate string. Three checks run in order:

1. Cheat code: if candidate equals `"ababvoidgloom*"`, add 1000 to score and call `inputCorrect()`.
2. Scorable: if candidate equals `game.goal`, call `inputCorrect()`.
3. Upgrade key: if candidate matches any `upgrade.key`, call `attemptUpgradePurchase(upgrade)`. For `OneTimeUpgrade`, also hide its display card, call `game.regenerateAllKeys()`, and update the goal display.

Arrow keys append their unicode symbol to the input value.

**inputCorrect()** — flashes the input green, calls `game.scoreSuccess()`, clears the input, updates the score display, calls `game.updateGoal()`, and updates the goal display.

**attemptUpgradePurchase(upgrade)** — if `score >= upgrade.cost`, deducts cost, calls `upgrade.purchase(characterPool, existingKeys)`. Otherwise puts the input into error state.

**Game loop** — `runGameLogic()` starts a `requestAnimationFrame` loop. On each frame, if at least 100ms have elapsed since `lastTick`, it drives auto-score display/accumulation, calls `display.revealUpgrades()`, `display.displayUpgrades()`, `display.displayScore()`, and `display.updateSettingsPanel()`.

**Auto-scoring** — A `Map<string, number>` (`displayTicks`) tracks the last animation timestamp per upgrade name. `displayAutoScore` fires once per second at owned=1, twice per second at owned=2, etc. Each call, `UpgradeDisplay` accumulates `upgrade.value` into `pendingScore`. When the display bar overflows, `pendingScore` is committed to `game.score`.

---

## Display

`GameDisplay` (gameDisplay.ts) owns all DOM references and `UpgradeDisplay` instances. Fields include `settingsPanel` (`.game-settings`) and `charSetToggles` (`.char-set-toggles`) for the Game Settings panel. `createDisplayHTML()` creates a `<div class="auto-input">` (not an `<input>`) for each upgrade's auto-typer display.

`displayGoal(symbol)` clears `.goal-value` and appends a `<div class="char-token">` containing the symbol — using DOM construction, not `textContent`, to apply the char-token visual treatment.

`updateSettingsPanel()` is called every tick but short-circuits when the set count hasn't changed (tracked via `renderedSetCount`). If fewer than 2 char sets are registered, the panel stays hidden. Once 2+ sets exist, the panel is revealed and a labeled checkbox is created per set (identified by `data-set-name` on the `<input>`). Each checkbox's `change` handler delegates to `onSetToggled`, a callback set by `GameController`. On a blocked toggle (last enabled set), the checkbox is snapped back to `checked = true`.

`GameDisplay` exposes input abstraction methods (`getValue`, `setValue`, `appendToInput`, `focusInput`, `hasError`, `clearError`, `showError`) so the controller never accesses `userInput` directly for state management.

`UpgradeDisplay` (upgradeDisplay.ts) manages a single upgrade card and its auto-input element (`autoTypeHtml: HTMLElement`). When `owned > 0` is first detected in `display()` (tracked by `ownedStatsShown`), it reveals the owned/chps rows; it only reveals the auto-input element if `upgrade.value > 0` (prevents showing an unused input box for `OneTimeUpgrade`). The upgrade key is rendered as individual char-token elements via `renderKey()`. The auto-input display is likewise a `<div>` that accumulates char-token children in `displayAutoScore()` rather than using an `<input>` `.value`.

---

## Save / Load

`GameManager` (gameManager.ts) wires three buttons: Save, Copy, and Load.

`GameManager.createGameFromObj(gameObj)` replaces `this.game`, updates display and controller references, recreates upgrade displays via `gameDisplay.createDisplays`, then filters `lockedUpgradeDisplays`: purchased `OneTimeUpgrade` displays are immediately hidden (`.hide()`) and excluded from the locked list so `revealUpgrades()` cannot re-show them. `doPageSetup()` re-initializes the UI.

**CharacterPool save format** — New saves: `[purchaseChar, setsConfig]` where `setsConfig` is `Record<string, { chars, enabled }>`. Old saves (prior to named sets): `[purchaseChar, poolObj]` where `poolObj` is a flat `Record<string, string>`. Distinguished on load by checking if the second-element values are strings (old) or objects (new). Old saves are reconstructed into sets by matching keys against `getSymbols()` and `getLetters()`; all sets present in the old pool default to enabled. If a set is absent from the old pool, it is not added. This means disabled-set state is only preserved in new-format saves — backward compat defaults to all unlocked sets enabled.

---

## DOM Structure

The page has three layout regions: `.header` (title + save/load controls), `.center` (stat displays, interaction zones, upgrade cards), `.footer` (attribution).

`.center` is a vertical flex column containing:
- `.stat-displays` — score and multiplier displays
- `.interaction-zones` — horizontal flex row with three zones:
  - `.zone-left` (flex: 1): `.auto-inputs` — auto-typer input fields stacked vertically
  - `.zone-center` (flex: 2): `.typing-input` + `.goal-display` stacked vertically
  - `.zone-right` (flex: 1): `.game-settings` panel — hidden until 2+ char sets are available; contains `.game-settings-title` and `.char-set-toggles` (checkbox labels added dynamically)
- `.upgrades` — upgrade cards in a horizontal flex row

`.unavailable` is `display: none` — used to hide stat rows, upgrade cards, auto-input fields, and the game-settings panel until conditions are met.

---

## Infrastructure

TypeScript source lives in `src/`, compiled via `tsc` to `dist/` (gitignored). `npm run build` runs the compiler. Primary deployment target is GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`) that compiles TypeScript and deploys. A Docker setup (`Dockerfile`, `docker-compose.yml`, `nginx.conf`) is also provided for local development.
