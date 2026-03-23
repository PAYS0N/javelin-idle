# Input & Game Loop Context: Javelin Idle

`GameController` (gameController.ts) handles all interaction.

---

## Input Handling

`keydown` on the typing input calls `verifyInput(e)`. If the input field is in error state, it is cleared first. Two main branches:

**Completion mode active** (`completionTarget` is set):
- If typed char is `$` (purchase char): exit completion mode, clear input, restore goal display.
- If `(getValue() + char).trim()` matches `completionKey[completionIndex]`: advance index, clear input, flash green, show next entry. If sequence is complete, execute purchase and exit completion mode.
- If it doesn't match: character appears in input normally (no `preventDefault`). Arrow keys are escaped to their unicode symbols.

**Normal mode** (`completionTarget` is null): current input value plus the mapped symbol forms the candidate string. Three checks in order:
1. Cheat code: if candidate equals `"ababvoidgloom*"`, add 1000 to score and call `inputCorrect()`.
2. Scorable: if `candidate.trim()` equals `game.goal`, call `inputCorrect()`. The trim allows word goals to be scored even with a leading space (e.g., from the spacebar).
3. Selector key: if candidate matches any `upgrade.key` and `score >= cost`, clear input and enter completion mode. If not affordable, flash error.

Arrow keys append their unicode symbol to the input value.

---

## Key Actions

`inputCorrect()` — flashes the input green, calls `game.scoreSuccess()`, clears the input, updates the score display, calls `game.updateGoal()`, and updates the goal display.

`attemptUpgradePurchase(upgrade)` — if `score >= upgrade.cost`, deducts cost, calls `upgrade.purchase(characterPool)`. The fail path logs a `console.error` (should be unreachable). For `OneTimeUpgrade`, the caller also hides the display card and calls `game.regenerateCompletionKeys()`.

---

## Completion Mode State

`GameController` tracks `completionTarget: Upgrade | null` and `completionIndex: number`. Entering completion mode pauses normal goal scoring. The goal display shows the current entry in `completionKey` with a `x/n` progress indicator.

---

## Game Loop

`runGameLogic()` starts a `requestAnimationFrame` loop. On each frame, if at least 100ms have elapsed since `lastTick`, it drives auto-score display/accumulation, calls `display.revealUpgrades()`, `display.displayUpgrades()`, `display.displayScore()`, and `display.updateSettingsPanel()`.

---

## Auto-Scoring

A `Map<string, number>` (`displayTicks`) tracks the last animation timestamp per upgrade name. `displayAutoScore` fires once per second at owned=1, twice per second at owned=2, etc. Each call, `UpgradeDisplay` accumulates `upgrade.value` into `pendingScore`. When the display bar overflows, `pendingScore` is committed to `game.score`.
