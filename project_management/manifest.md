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
| [project_management/cdocs/system.md](cdocs/system.md) | Full system context: game loop, character pool, upgrades, input handling, display, and save/load |
| [project_management/cdocs/style.md](cdocs/style.md) | Coding conventions: naming, type annotations, DOM access patterns, serialization, and timing |

---

## Root Files

| File | Description |
|------|-------------|
| [README.md](../README.md) | One-line project description: idle typing game for steno key practice |
| [index.html](../index.html) | Main game page: score display, typing input, goal display, upgrade panel, save/load controls |
| [Dockerfile](../Dockerfile) | Docker image definition for serving the game |
| [docker-compose.yml](../docker-compose.yml) | Docker Compose config for local development server |
| [nginx.conf](../nginx.conf) | Nginx config for serving static files in the Docker container |

---

## Game Logic

| File | Description |
|------|-------------|
| [js/domUtils.js](../js/domUtils.js) | Global DOM utility functions: `safeQueryHTMLElement` and `safeQueryHTMLElementInput` with typed guards |
| [js/game.js](../js/game.js) | Core game state: score, score multiplier, goal, character pool, and upgrades; handles serialization and deserialization |
| [js/gameManager.js](../js/gameManager.js) | Top-level orchestrator: creates Game/GameDisplay/GameController, wires save/load/copy buttons, and starts the game |
| [js/gameController.js](../js/gameController.js) | Input handling and game loop: verifies typed input against goal, triggers scoring, manages upgrade auto-scoring intervals, and handles upgrade purchases |
| [js/upgrade.js](../js/upgrade.js) | Upgrade and OneTimeUpgrade classes: cost, purchase key, owned count, auto-score value, and purchase logic |
| [js/characterPool.js](../js/characterPool.js) | CharacterPool class and symbol/letter maps: tracks typeable characters, generates random goals, and builds purchase key sequences |

---

## Display

| File | Description |
|------|-------------|
| [js/gameDisplay.js](../js/gameDisplay.js) | GameDisplay class: manages DOM elements for score, goal, input feedback, and upgrade panels; creates and migrates upgrade display instances |
| [js/upgradeDisplay.js](../js/upgradeDisplay.js) | upgradeDisplay class: renders individual upgrade cards (cost, key, owned count, ch/s), reveals cards at score thresholds, and animates auto-typing input |

---

## Styles

| File | Description |
|------|-------------|
| [css/style.css](../css/style.css) | All game styling: layout, score display, typing input, upgrade cards, auto-input fields, and success/error state animations |

---

## Entry Point

| File | Description |
|------|-------------|
| [js/javascript.js](../js/javascript.js) | Entry point: instantiates GameManager and calls startGame on window load |
