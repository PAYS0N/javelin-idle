# Testing Context: Javelin Idle

## Infrastructure

Three test suites run via npm scripts: `test:unit` (Vitest), `test:functional` (Playwright), `test:sim` (Vitest). `npm test` runs all three sequentially.

Vitest config is `vitest.config.ts`, targeting `tests/unit/` and `tests/simulation/`. Playwright config is `playwright.config.ts`, targeting `tests/functional/`, using `serve` to host the project root on port 4173.

Tests live outside `src/` and import source files directly (Vitest handles TypeScript natively). Test files are not compiled to `dist/`.

---

## Unit Tests

Located in `tests/unit/`. Test the pure-logic modules (`Game`, `Upgrade`, `OneTimeUpgrade`, `CharacterPool`) that have no DOM dependencies.

- `characterPool.test.ts` — pool building, set toggling (including last-set guard), key generation uniqueness, completion key length, `fromSave` round-trip.
- `upgrade.test.ts` — `purchase()` increments owned/cost, completion key grows by `keyLength + owned * keyIncrease`, `OneTimeUpgrade` caps owned at 1 and fires `onPurchase`.
- `game.test.ts` — `scoreSuccess` adds `scoreMulti`, upgrade table structure (names, costs, unique keys), `findUpgradeByKey`, `regenerateCompletionKeys`, serialization round-trip including OneTimeUpgrade purchased state.

---

## Functional Tests

Located in `tests/functional/`. Playwright opens `index.html` in Chromium and interacts via real keyboard events on `.typing-input`.

Tests cover: initial state (score 0, goal visible, all cards hidden), cheat code `ababvoidgloom*` adds 1000 to score, upgrade card reveal at threshold, correct goal typing scores a point, completion mode enter (selector key) and exit (`$`).

Functional tests require `dist/` to be built first (`npm run build`).

---

## Balance Simulation

Located in `tests/simulation/balance.test.ts`. A headless simulation that models the game economy mathematically using real `Game`/`Upgrade`/`CharacterPool` instances but no DOM.

Configurable parameters: `manualTypesPerSecond` (default 2), `maxSimTimeSeconds` (default 36000). Tick interval is 100ms. Purchase strategy: buy the non-OneTimeUpgrade with best value/cost ratio; save for a OneTimeUpgrade when score reaches 2/3 of its cost.

Outputs a human-readable timing table to `test-results/balance-simulation.txt` (gitignored). Tests assert: first upgrade purchased within 15 seconds, no gap between purchases exceeds 20 minutes.

---

## Dev Dependencies

`vitest` for unit/simulation tests, `@playwright/test` + `serve` for functional tests, `@types/node` for Node API types in test files.
