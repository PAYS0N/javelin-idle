# Persistence & Infrastructure Context: Javelin Idle

## Save / Load

`GameManager` (gameManager.ts) wires three buttons: Save, Copy, and Load.

`GameManager.createGameFromObj(gameObj)` replaces `this.game`, updates display and controller references, recreates upgrade displays via `gameDisplay.createDisplays`, then filters `lockedUpgradeDisplays`: purchased `OneTimeUpgrade` displays are immediately hidden (`.hide()`) and excluded from the locked list so `revealUpgrades()` cannot re-show them. `doPageSetup()` re-initializes the UI.

---

## Save Format

`toString()` / `createGameFromObj()` handle full serialization: score, scoreMulti, goal, characterPool (as JSON string), and upgrades (each as a JSON string within the array — only the selector key is saved, not completion keys).

`scoreMulti` is saved before `onPurchase` callbacks fire and restored afterward, preventing the multiplier from being applied twice on load. After restoring all upgrade state, `regenerateCompletionKeys()` is called to generate fresh completion keys from the current pool.

`createGameFromObj` detects old vs new CharacterPool save formats by inspecting the type of values in the second array element.

---

## CharacterPool Save Format

`[purchaseChar, setsConfig]` where `setsConfig` is `Record<string, { chars: string[], enabled: boolean }>`. This array is embedded directly in the game JSON object (not double-encoded as a nested JSON string). On load, `createGameFromObj` checks `Array.isArray(gameObj.characterPool)` and passes the tuple to `CharacterPool.fromSave`.

---

## Infrastructure

TypeScript source lives in `src/`, compiled via `tsc` to `dist/` (gitignored). `npm run build` runs the compiler. Primary deployment target is GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`). A Docker setup (`Dockerfile`, `docker-compose.yml`, `nginx.conf`) is also provided for local development.
