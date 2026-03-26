# Architecture Conventions: Javelin Idle

## Module Hierarchy

Modules are organized in layers. A module may only import from its own layer or lower layers — never upward.

| Layer | Modules | Responsibility |
|-------|---------|----------------|
| 0 — Entry | `main.ts` | Instantiates GameManager on window load |
| 1 — Orchestrator | `gameManager.ts` | Creates and wires Game, GameDisplay, GameController; handles save/load |
| 2 — Primary | `game.ts`, `gameDisplay.ts`, `gameController.ts` | Core state, display management, input/game loop |
| 3 — Secondary | `upgrade.ts`, `upgradeDisplay.ts`, `characterPool.ts` | Data models, individual UI components, character set logic |
| 4 — Utility | `domUtils.ts` | Typed DOM query guards and DOM manipulation helpers |

**Rule: no upward imports.** A Layer 3 module must never import from Layer 2 or above. A Layer 2 module must never import from Layer 1 or above. This keeps the dependency graph acyclic.

## Module Responsibilities

Each module owns a single concern. Do not spread a concern across modules or merge concerns into one module.

- **game.ts** — Owns all game state (score, scoreMulti, goal, characterPool, upgrades). Only place where the upgrade table is defined. Handles serialization/deserialization of game state.
- **gameController.ts** — Owns input handling, the game loop (rAF), scoring logic, upgrade purchase flow, and completion mode. Mutates game state through Game methods or direct property access.
- **gameDisplay.ts** — Owns the DOM representation of game state. Reads game state, never mutates it. Creates and manages UpgradeDisplay instances.
- **gameManager.ts** — Orchestration only: wiring, save/load, and state restoration. No game logic, no display logic.
- **upgrade.ts** — Upgrade data model and purchase mechanics. No DOM access.
- **upgradeDisplay.ts** — Renders a single upgrade card. No game logic.
- **characterPool.ts** — Character set management, random generation, key generation. No DOM access, no game state awareness.
- **domUtils.ts** — Generic DOM helpers. No game-specific logic.

## Forbidden Patterns

These are patterns that must not appear in the codebase. Each includes a grep command to verify compliance.

**F1 — No DOM access outside the display layer and domUtils.**
Only `domUtils.ts`, `gameDisplay.ts`, `upgradeDisplay.ts`, and `gameManager.ts` (bootstrap listeners only) may call `document.querySelector`, `document.getElementById`, `document.createElement`, or use `safeQueryHTMLElement`/`safeQueryHTMLElementInput`. The game logic layer (`game.ts`, `upgrade.ts`, `characterPool.ts`, `gameController.ts`) must not touch the DOM directly.

Check: `grep -n "document\." src/game.ts src/upgrade.ts src/characterPool.ts src/gameController.ts` — should return nothing.

**F2 — No unsafe DOM/JS injection APIs.**
Never use any of: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval()`, `new Function()`, or string arguments to `setTimeout`/`setInterval`. Use `textContent`, `appendChild`, or the `createCharToken`/`clearChildren` helpers from domUtils.

Check: `grep -rn "innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|eval(" src/` — should return nothing.

**F3 — No game state mutation in display modules.**
`gameDisplay.ts` and `upgradeDisplay.ts` must never write to `game.score`, `game.scoreMulti`, `game.goal`, `upgrade.owned`, or `upgrade.cost`. They read state for rendering only.

Check: `grep -n "\.score\s*=" src/gameDisplay.ts src/upgradeDisplay.ts` and `grep -n "\.owned\s*=" src/gameDisplay.ts src/upgradeDisplay.ts` — should return nothing.

**F4 — No direct DOM queries without safeQuery wrappers.**
All `document.querySelector` calls for existing elements must go through `safeQueryHTMLElement` or `safeQueryHTMLElementInput`. Direct `querySelector`/`getElementById` is only acceptable inside `domUtils.ts` itself.

Check: `grep -n "document\.querySelector\|document\.getElementById" src/ --include="*.ts" -r` — should return results only in `domUtils.ts`.

**F5 — No circular dependencies.**
Every import must point downward or sideways within the same layer. No module may import from a module that (directly or transitively) imports it.

Check: Review the import graph manually or via the architecture health check prompt.

## State Mutation Rules

- **Score and scoreMulti**: mutated only in `gameController.ts` (via `game.scoreSuccess()` or direct assignment) and `game.ts` (during initialization/deserialization and `addLetters`/`addWords` one-time upgrades).
- **Goal**: mutated only via `game.updateGoal()`, called from `gameController.ts`.
- **Upgrade owned/cost**: mutated only via `upgrade.purchase()`, called from `gameController.ts`.
- **CharacterPool**: toggled via `characterPool.toggleSet()`, called from `gameController.ts` via the `onSetToggled` callback.

## Adding New Modules

When creating a new source file:
1. Determine its layer in the hierarchy above. If it doesn't fit an existing layer, that's a signal to reconsider the design.
2. Ensure it imports only from its layer or below.
3. Give it a single clear responsibility that doesn't overlap with existing modules.
4. Update the module hierarchy table in this document.
5. Update `project_management/architecture-baseline.md` with the new dependency.
