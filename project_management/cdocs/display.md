# Display Context: Javelin Idle

## GameDisplay

`GameDisplay` (gameDisplay.ts) owns all DOM references and `UpgradeDisplay` instances. Fields include `settingsPanel` (`.game-settings`) and `charSetToggles` (`.char-set-toggles`) for the Game Settings panel.

`createDisplayHTML()` creates a `<div class="auto-input">` (not an `<input>`) for each upgrade's auto-typer display.

`displayGoal(symbol)` clears `.goal-value` and appends a `<div class="char-token">` containing the symbol — using DOM construction, not `textContent`, to apply the char-token visual treatment.

`showCompletionChar(char)` displays the next completion character in the goal display area (reuses `.goal-value`) and changes the goal title to "Purchase: ". `showCompletionProgress(current, total)` shows `x/n` progress in a `.completion-progress` element appended to `.goal-display`. `exitCompletionMode()` restores the goal title to "Type: ", hides the progress element, and re-displays the current goal.

`updateSettingsPanel()` is called every tick but short-circuits when the set count hasn't changed (tracked via `renderedSetCount`). If fewer than 2 char sets are registered, the panel stays hidden. Once 2+ sets exist, the panel is revealed and a labeled checkbox is created per set (identified by `data-set-name` on the `<input>`). Each checkbox's `change` handler delegates to `onSetToggled`, a callback set by `GameController`. On a blocked toggle (last enabled set), the checkbox is snapped back to `checked = true`.

`GameDisplay` exposes input abstraction methods (`getValue`, `setValue`, `appendToInput`, `focusInput`, `hasError`, `clearError`, `showError`) so the controller never accesses `userInput` directly.

---

## UpgradeDisplay

`UpgradeDisplay` (upgradeDisplay.ts) manages a single upgrade card and its auto-input element (`autoTypeHtml: HTMLElement`). When `owned > 0` is first detected in `display()` (tracked by `ownedStatsShown`), it reveals the owned/chps rows; it only reveals the auto-input element if `upgrade.value > 0` (prevents showing an unused input box for `OneTimeUpgrade`).

The upgrade's 2-char selector key is rendered as individual char-token elements via `renderKey()`. During completion mode, the card receives a `.completion-active` class for visual highlighting (managed by `GameController`).

The auto-input display is a `<div>` that accumulates char-token children in `displayAutoScore()` rather than using an `<input>` `.value`. `display()` caches `renderedKey`, `renderedCost`, and `renderedOwned` — DOM writes for those fields are skipped when the backing value is unchanged.

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
