# System Context: Javelin Idle

Javelin Idle is a browser-based idle/clicker typing game. The player types symbol sequences displayed on screen to earn score ("Characters Typed"), then spends score on upgrades that passively generate score over time. The game is designed to train stenography key combinations for programming symbols. All logic is TypeScript compiled to ES modules with no framework.

---

## Entry & Initialization

`main.ts` is the entry point, loaded via `<script type="module" src="./dist/main.js">` in `index.html`. It runs `new GameManager().startGame()` on `window.onload`. Module imports handle dependency resolution — no manual script ordering required.

`GameManager` constructor creates `Game`, `GameDisplay(game)`, and `GameController(game, display)` in order. `startGame()` calls `setupListeners()`, `gameController.doGameSetup()`, and `gameController.doPageSetup()`.

---

## Character Pool

`CharacterPool` (characterPool.ts) holds typeable characters as named sets. Each set is a `CharSet`: `{ chars: string[], enabled: boolean }`, stored in `sets: Record<string, CharSet>`. The active `pool: string[]` is derived from all enabled sets and rebuilt on any change.

The starting set is `"symbols"`: programming punctuation and unicode arrows (`↑↓←→`). The purchase character `$` is reserved and excluded from the pool. Arrow key input is handled separately by the key mapping system (see Input & Game Loop), not by the pool.

`addSet(name, chars)` registers a new set (enabled by default) and rebuilds the pool. If the set already exists, only `chars` is updated and the existing `enabled` state is preserved.

`addLetters()` calls `addSet("letters", getLetters())` to merge a–z into the pool.

`addWords()` calls `addSet("words", getWords())` to merge the top 100 most common English words into the pool. Each word is a single pool entry (a multi-character string).

`toggleSet(name, enabled)` enables or disables a named set. If disabling the set would leave zero enabled sets, the call is a no-op and returns `false`; otherwise it updates the state, rebuilds the pool, and returns `true`.

`isSetEnabled(name)` and `getSetNames()` expose per-set state for the settings panel.

`generateKey(length, existingKeys?)` builds a selector key string: `$` followed by `length` randomly sampled entries from the single-char pool (pool entries filtered to `length === 1`, falling back to the full pool if empty). Ensures selector keys remain short and typeable even when multi-char words are in the pool. Used only for selector keys (always called with `length = 1` to produce 2-char keys like `$+`).

`generateCompletionKey(length)` returns a `string[]` of `length` entries randomly sampled from the full pool (including words). Each entry may be a single character or a multi-character word.

`getRandomChar()` picks a random entry from the pool array to serve as the next typing goal. May return a multi-character word if the words set is active.

`getRandomSingleChar()` picks a random entry from the single-char pool (filtered to `length === 1`, falling back to full pool). Used by the auto-typer display so it never shows words in the animation slots.

`toSaveObj()` returns a plain serializable tuple `[purchaseChar, setsConfig]` where `setsConfig` is `Record<string, { chars: string[], enabled: boolean }>`. This is embedded directly in the game JSON (not double-encoded). Static method `fromSave(purchaseChar, setsConfig)` reconstructs the pool from a saved tuple.

---

## Game State

`Game` (game.ts) owns all mutable game state:

- `score` — integer, incremented by `scoreMulti` on each successful type, decremented on upgrade purchase.
- `scoreMulti` — starts at 1; multiplied by 1.5 when "Unlock Letters" is purchased.
- `goal` — the current symbol the player must type, set by `updateGoal()`.
- `characterPool` — a `CharacterPool` instance.
- `upgrades` — ordered array of `Upgrade` / `OneTimeUpgrade` instances, created by `makeUpgrades()`.

`makeUpgrades()` defines all upgrades in order. Selector keys are generated via `generateKey(1, usedKeys)` with a shared `Set<string>` to guarantee uniqueness. Completion keys are generated via `generateCompletionKey(keyLength)` independently:

| Name | Base Cost | Cost Increase | Completion Key Length | Completion Key Length Increase | Auto-Score Value | Reveal Threshold |
|------|-----------|--------------|----------------------|-------------------------------|-----------------|-----------------|
| Two finger typer | 20 | 3 | 3 | 1/3 | 0.25 | cost × 3/4 |
| Practiced two finger typer | 80 | 20 | 5 | 2/3 | 0.75 | cost × 3/4 |
| Unlock Letters (OneTime) | 500 | — | 10 | — | — | cost × 4/5 |
| New touch typer | 1000 | 50 | 10 | 1 | 1.75 | cost × 3/4 |
| Touch typer | 5000 | 250 | 14 | 1 | 2.5 | cost × 3/4 |
| Unlock Words (OneTime) | 8000 | — | 12 | — | — | cost × 4/5 |

`scoreSuccess()` adds `scoreMulti` to `score`. `updateGoal()` calls `characterPool.getRandomChar()` and stores the result as `goal`.

`regenerateCompletionKeys()` regenerates `completionKey` for every upgrade using `keyLength + owned × keyIncrease`. Selector keys are never regenerated. Called when the active char set changes — either from toggling a set off/on, or after a `OneTimeUpgrade` purchase that adds a new set.

`toString()` / `createGameFromObj()` handle full serialization: score, scoreMulti, goal, characterPool (as JSON string), and upgrades (each as a JSON string within the array — only the selector key is saved, not completion keys). `createGameFromObj` detects old vs new CharacterPool save formats by inspecting the type of values in the second array element. `scoreMulti` is saved before `onPurchase` callbacks fire and restored afterward, preventing the multiplier from being applied twice on load. After restoring all upgrade state, `regenerateCompletionKeys()` is called to generate fresh completion keys from the current pool.

---

## Upgrades

`Upgrade` (upgrade.ts) is the repeatable upgrade type. Fields: `name`, `cost`, `costIncrease`, `thresholdMulti`, `owned`, `key` (2-char selector), `completionKey` (long random sequence), `keyLength`, `keyIncrease`, `value`.

Each upgrade has two key components: a **selector key** (`key`) — always `$` + 1 pool char, shown on the card, never regenerated after initial assignment — and a **completion key** (`completionKey`) — a random pool-char sequence of length `keyLength + owned × keyIncrease`, not shown on the card, regenerated on purchase and when char sets change.

`purchase(characterPool)` increments `owned`, adds `costIncrease` to `cost`, and regenerates only `completionKey` with length `keyLength + (owned × keyIncrease)`. Selector key is unchanged.

`OneTimeUpgrade extends Upgrade` with `owned` capped at 1 and an `onPurchase` callback that fires on purchase. Cost/key delta/value are all 0. Accepts an optional `keyLength` parameter (passed to `super`) so `regenerateCompletionKeys()` can correctly compute its completion key length. "Unlock Letters" passes `keyLength = 10` and `() => game.addLetters()` as its callback, which bumps `scoreMulti` by ×2.5 and calls `characterPool.addLetters()`. "Unlock Words" passes `keyLength = 12` and `() => game.addWords()` as its callback, which bumps `scoreMulti` by ×10 and calls `characterPool.addWords()`.

Only the selector key (`key`) is serialized. Completion keys are regenerated fresh on load via `regenerateCompletionKeys()`.

---

## Input & Game Loop

`GameController` (gameController.ts) handles all interaction:

**Key mapping** — `getKeySymbol(key: string): string | undefined` (exported from `characterPool.ts`) maps physical key names to display symbols using a module-level `KEY_MAP`. Only the four arrow keys have non-identity entries (`ArrowUp → ↑`, etc.). `getInput(e)` uses `getKeySymbol(e.key) ?? e.key` to build the candidate string — regular keys fall through as-is.

**Completion mode** — `GameController` tracks `completionTarget: Upgrade | null` and `completionIndex: number`. When a player types a selector key (`$X`) matching an upgrade and has sufficient score, the controller enters completion mode for that upgrade. During completion mode, normal goal scoring is paused and the goal display shows the current entry in the upgrade's `completionKey: string[]` sequence with a progress indicator (`x/n`). Each entry may be a single character or a multi-character word; the player types the full entry into the input field (accumulating keystrokes), and on match the index advances.

**Input verification** — `keydown` on the typing input calls `verifyInput(e)`. If the input field is in error state, it is cleared first. Two main branches:

*Completion mode active* (`completionTarget` is set):
- If typed char is `$` (purchase char): exit completion mode, clear input, restore goal display.
- If `(getValue() + char).trim()` matches `completionKey[completionIndex]`: advance index, clear input, flash green, show next entry. If sequence is complete, execute purchase and exit completion mode.
- If it doesn't match: character appears in input normally (no `preventDefault`). Arrow keys are escaped to their unicode symbols.

*Normal mode* (`completionTarget` is null): the current input value plus the mapped symbol forms the candidate string. Three checks run in order:
1. Cheat code: if candidate equals `"ababvoidgloom*"`, add 1000 to score and call `inputCorrect()`.
2. Scorable: if `candidate.trim()` equals `game.goal`, call `inputCorrect()`. The trim allows word goals to be scored even if the player's input has a leading space (e.g., from the spacebar).
3. Selector key: if candidate matches any `upgrade.key` and `score >= cost`, clear input and enter completion mode. If not affordable, flash error.

Arrow keys append their unicode symbol to the input value.

**inputCorrect()** — flashes the input green, calls `game.scoreSuccess()`, clears the input, updates the score display, calls `game.updateGoal()`, and updates the goal display.

**attemptUpgradePurchase(upgrade)** — if `score >= upgrade.cost`, deducts cost, calls `upgrade.purchase(characterPool)`. The fail path logs a `console.error` as it should be unreachable (affordability is checked before entering completion mode). For `OneTimeUpgrade`, the caller also hides the display card and calls `game.regenerateCompletionKeys()`.

**Game loop** — `runGameLogic()` starts a `requestAnimationFrame` loop. On each frame, if at least 100ms have elapsed since `lastTick`, it drives auto-score display/accumulation, calls `display.revealUpgrades()`, `display.displayUpgrades()`, `display.displayScore()`, and `display.updateSettingsPanel()`.

**Auto-scoring** — A `Map<string, number>` (`displayTicks`) tracks the last animation timestamp per upgrade name. `displayAutoScore` fires once per second at owned=1, twice per second at owned=2, etc. Each call, `UpgradeDisplay` accumulates `upgrade.value` into `pendingScore`. When the display bar overflows, `pendingScore` is committed to `game.score`.

---

## Display

`GameDisplay` (gameDisplay.ts) owns all DOM references and `UpgradeDisplay` instances. Fields include `settingsPanel` (`.game-settings`) and `charSetToggles` (`.char-set-toggles`) for the Game Settings panel. `createDisplayHTML()` creates a `<div class="auto-input">` (not an `<input>`) for each upgrade's auto-typer display.

`displayGoal(symbol)` clears `.goal-value` and appends a `<div class="char-token">` containing the symbol — using DOM construction, not `textContent`, to apply the char-token visual treatment.

`showCompletionChar(char)` displays the next completion character in the goal display area (reuses `.goal-value`) and changes the goal title to "Purchase: ". `showCompletionProgress(current, total)` shows `x/n` progress in a `.completion-progress` element appended to `.goal-display`. `exitCompletionMode()` restores the goal title to "Type: ", hides the progress element, and re-displays the current goal.

`updateSettingsPanel()` is called every tick but short-circuits when the set count hasn't changed (tracked via `renderedSetCount`). If fewer than 2 char sets are registered, the panel stays hidden. Once 2+ sets exist, the panel is revealed and a labeled checkbox is created per set (identified by `data-set-name` on the `<input>`). Each checkbox's `change` handler delegates to `onSetToggled`, a callback set by `GameController`. On a blocked toggle (last enabled set), the checkbox is snapped back to `checked = true`.

`GameDisplay` exposes input abstraction methods (`getValue`, `setValue`, `appendToInput`, `focusInput`, `hasError`, `clearError`, `showError`) so the controller never accesses `userInput` directly for state management.

`UpgradeDisplay` (upgradeDisplay.ts) manages a single upgrade card and its auto-input element (`autoTypeHtml: HTMLElement`). When `owned > 0` is first detected in `display()` (tracked by `ownedStatsShown`), it reveals the owned/chps rows; it only reveals the auto-input element if `upgrade.value > 0` (prevents showing an unused input box for `OneTimeUpgrade`). The upgrade's 2-char selector key is rendered as individual char-token elements via `renderKey()`. During completion mode, the card receives a `.completion-active` class for visual highlighting (managed by `GameController`). The auto-input display is likewise a `<div>` that accumulates char-token children in `displayAutoScore()` rather than using an `<input>` `.value`. `display()` caches `renderedKey`, `renderedCost`, and `renderedOwned` — DOM writes for those fields are skipped when the backing value is unchanged, since they only change on purchase.


---

## Save / Load

`GameManager` (gameManager.ts) wires three buttons: Save, Copy, and Load.

`GameManager.createGameFromObj(gameObj)` replaces `this.game`, updates display and controller references, recreates upgrade displays via `gameDisplay.createDisplays`, then filters `lockedUpgradeDisplays`: purchased `OneTimeUpgrade` displays are immediately hidden (`.hide()`) and excluded from the locked list so `revealUpgrades()` cannot re-show them. `doPageSetup()` re-initializes the UI.

**CharacterPool save format** — `[purchaseChar, setsConfig]` where `setsConfig` is `Record<string, { chars: string[], enabled: boolean }>`. This array is embedded directly in the game JSON object (not double-encoded as a nested JSON string). On load, `createGameFromObj` checks `Array.isArray(gameObj.characterPool)` and passes the tuple to `CharacterPool.fromSave`.

---

## DOM Structure

The page has three layout regions: `.header` (title + save/load controls), `.center` (stat displays, interaction zones, upgrade cards), `.footer` (attribution).

`.center` is a vertical flex column containing:
- `.stat-displays` — score and multiplier displays
- `.interaction-zones` — horizontal flex row with three zones:
  - `.zone-left` (flex: 1): `.auto-inputs` — auto-typer input fields stacked vertically
  - `.zone-center` (flex: 2): `.typing-input` + `.goal-display` stacked vertically
  - `.zone-right` (flex: 1): `.game-settings` panel — hidden until 2+ char sets are available; contains `.game-settings-title` and `.char-set-toggles` (checkbox labels added dynamically)
- `.upgrades` — upgrade cards in a vertical scrollable flex column (`max-height: 50vh`, `overflow-y: auto`)

`.unavailable` is `display: none` — used to hide stat rows, upgrade cards, auto-input fields, and the game-settings panel until conditions are met.

---

## Infrastructure

TypeScript source lives in `src/`, compiled via `tsc` to `dist/` (gitignored). `npm run build` runs the compiler. Primary deployment target is GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`) that compiles TypeScript and deploys. A Docker setup (`Dockerfile`, `docker-compose.yml`, `nginx.conf`) is also provided for local development.
