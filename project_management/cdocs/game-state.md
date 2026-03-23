# Game State Context: Javelin Idle

## Entry & Initialization

`main.ts` is the entry point, loaded via `<script type="module" src="./dist/main.js">` in `index.html`. It runs `new GameManager().startGame()` on `window.onload`.

`GameManager` constructor creates `Game`, `GameDisplay(game)`, and `GameController(game, display)` in order. `startGame()` calls `setupListeners()`, `gameController.doGameSetup()`, and `gameController.doPageSetup()`.

---

## Game Class

`Game` (game.ts) owns all mutable game state:

- `score` — integer, incremented by `scoreMulti` on each successful type, decremented on upgrade purchase.
- `scoreMulti` — starts at 1; multiplied by 2.5 when "Unlock Letters" is purchased, ×10 when "Unlock Words" is purchased.
- `goal` — the current symbol the player must type, set by `updateGoal()`.
- `characterPool` — a `CharacterPool` instance.
- `upgrades` — ordered array of `Upgrade` / `OneTimeUpgrade` instances, created by `makeUpgrades()`.

`scoreSuccess()` adds `scoreMulti` to `score`. `updateGoal()` calls `characterPool.getRandomChar()` and stores the result as `goal`.

`regenerateCompletionKeys()` regenerates `completionKey` for every upgrade using `keyLength + owned × keyIncrease`. Selector keys are never regenerated. Called when the active char set changes — either from toggling a set, or after a `OneTimeUpgrade` purchase that adds a new set.

---

## Upgrade Table

`makeUpgrades()` defines all upgrades in order. Selector keys are generated via `generateKey(1, usedKeys)` with a shared `Set<string>` to guarantee uniqueness.

| Name | Base Cost | Cost Increase | Key Length | Key Length Increase | Auto-Score Value | Reveal Threshold |
|------|-----------|--------------|------------|---------------------|-----------------|-----------------|
| Two finger typer | 20 | 3 | 3 | 1/3 | 0.25 | cost × 3/4 |
| Practiced two finger typer | 80 | 20 | 5 | 2/3 | 0.75 | cost × 3/4 |
| Unlock Letters (OneTime) | 500 | — | 10 | — | — | cost × 4/5 |
| New touch typer | 1000 | 50 | 10 | 1 | 1.75 | cost × 3/4 |
| Touch typer | 5000 | 250 | 14 | 1 | 2.5 | cost × 3/4 |
| Unlock Words (OneTime) | 8000 | — | 12 | — | — | cost × 4/5 |
