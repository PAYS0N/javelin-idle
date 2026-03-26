# Project Manifest

---

## Project Context

| File | Description |
|------|-------------|
| [CLAUDE.md](../CLAUDE.md) | Project rules and guidelines for Claude and file management |
| [project_management/manifest.md](manifest.md) | This file — full project file listing with descriptions |
| [project_management/status.md](status.md) | Active work, open items, and closed items tracking |
| [project_management/cdoc.md](cdoc.md) | Template instructions for generating context documents |
| [project_management/prompting.md](prompting.md) | Template instructions for generating task prompts |
| [project_management/cdocs/character-pool.md](cdocs/character-pool.md) | CharacterPool class: named char sets, pool derivation, key generation, goal/auto-typer methods, serialization |
| [project_management/cdocs/game-state.md](cdocs/game-state.md) | Entry & initialization, Game class fields, upgrade table, score/goal methods |
| [project_management/cdocs/upgrades.md](cdocs/upgrades.md) | Upgrade and OneTimeUpgrade classes: selector vs completion keys, purchase logic, serialization |
| [project_management/cdocs/input.md](cdocs/input.md) | GameController: key mapping, normal/completion mode input, game loop, auto-scoring |
| [project_management/cdocs/display.md](cdocs/display.md) | GameDisplay and UpgradeDisplay: DOM methods, settings panel, upgrade cards, DOM structure |
| [project_management/cdocs/persistence.md](cdocs/persistence.md) | Save/load wiring, save format, CharacterPool save format, infrastructure |
| [project_management/standards/style.md](standards/style.md) | Coding conventions: naming, type annotations, DOM access patterns, serialization, and timing |
| [project_management/standards/architecture.md](standards/architecture.md) | Architecture conventions: module hierarchy, responsibilities, forbidden patterns, state mutation rules |
| [project_management/architecture-baseline.md](architecture-baseline.md) | Mermaid diagrams of current architecture: dependency graph, layer boundaries, DOM access, state mutation flow |
| [project_management/prompts/architecture-check.md](prompts/architecture-check.md) | Periodic health check prompt: regenerate diagrams, run forbidden pattern checks, compare to baseline, produce verdict |

---

## Root Files

| File | Description |
|------|-------------|
| [README.md](../README.md) | One-line project description: idle typing game for steno key practice |
| [index.html](../index.html) | Main game page: stat displays, three-zone interaction row (auto-inputs / typing+goal / game-settings), upgrade panel, save/load controls |
| [Dockerfile](../Dockerfile) | Multi-stage Docker image: compiles TypeScript then serves with Nginx |
| [docker-compose.yml](../docker-compose.yml) | Docker Compose config for local development server |
| [nginx.conf](../nginx.conf) | Nginx config for serving static files in the Docker container |
| [tsconfig.json](../tsconfig.json) | TypeScript compiler configuration: strict mode, ES2020 target, ES modules, outputs to dist/ |
| [biome.json](../biome.json) | Biome linter/formatter configuration: tabs, no semicolons, architectural lint rules |
| [package.json](../package.json) | npm package config with TypeScript and Biome dev dependencies, build/lint/check scripts |
| [.gitignore](../.gitignore) | Git ignore rules for node_modules/ and dist/ |

---

## Game Logic

| File | Description |
|------|-------------|
| [src/domUtils.ts](../src/domUtils.ts) | DOM utilities: `safeQueryHTMLElement`, `safeQueryHTMLElementInput` (typed guards), `clearChildren`, `createCharToken`, `flashClass` (shared DOM helpers) |
| [src/game.ts](../src/game.ts) | Core game state: score, score multiplier, goal, character pool, and upgrades; handles serialization, deserialization, and `regenerateAllKeys()` |
| [src/gameManager.ts](../src/gameManager.ts) | Top-level orchestrator: creates Game/GameDisplay/GameController, wires save/load/copy buttons, hides purchased OneTimeUpgrade cards on load, and starts the game |
| [src/gameController.ts](../src/gameController.ts) | Input handling and game loop: verifies typed input against goal, triggers scoring, manages upgrade auto-scoring intervals, handles upgrade purchases, regenerates all keys and goal after OneTimeUpgrade purchase, handles char set toggle logic via `onSetToggled` callback, and calls `updateSettingsPanel` each tick |
| [src/upgrade.ts](../src/upgrade.ts) | Upgrade and OneTimeUpgrade classes: cost, purchase key, owned count, auto-score value, and purchase logic; OneTimeUpgrade accepts optional `keyLength` for key regeneration |
| [src/characterPool.ts](../src/characterPool.ts) | CharacterPool class and symbol/letter/word maps: tracks named char sets with per-set enabled/disabled state, derives active pool from enabled sets, generates random goals, and builds purchase key sequences; `generateCompletionKey` returns `string[]`; selector keys use single-char-only pool; `getRandomSingleChar()` for auto-typer |

---

## Display

| File | Description |
|------|-------------|
| [src/gameDisplay.ts](../src/gameDisplay.ts) | GameDisplay class: manages DOM elements for score, goal, input feedback, upgrade panels, and game-settings panel; creates and migrates upgrade display instances; renders char set toggle checkboxes |
| [src/upgradeDisplay.ts](../src/upgradeDisplay.ts) | UpgradeDisplay class: renders individual upgrade cards (cost, key, owned count, ch/s), reveals cards at score thresholds, and animates auto-typing input (only for upgrades with value > 0) |

---

## Styles

| File | Description |
|------|-------------|
| [css/style.css](../css/style.css) | All game styling: layout, score display, three-zone interaction row, typing input, upgrade cards, auto-input fields, game-settings panel, char set toggle checkboxes, and success/error state animations |

---

## CI/CD

| File | Description |
|------|-------------|
| [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | GitHub Actions workflow: compiles TypeScript and deploys to GitHub Pages |

---

## Entry Point

| File | Description |
|------|-------------|
| [src/main.ts](../src/main.ts) | Entry point: instantiates GameManager and calls startGame on window load |
