# Architecture Baseline — Javelin Idle

Generated: 2026-03-26

## Module Dependency Graph

```mermaid
graph TD
    main["main.ts<br/><i>Entry</i>"]
    gm["gameManager.ts<br/><i>Orchestrator</i>"]
    g["game.ts<br/><i>Game State</i>"]
    gc["gameController.ts<br/><i>Input & Loop</i>"]
    gd["gameDisplay.ts<br/><i>Display Manager</i>"]
    u["upgrade.ts<br/><i>Upgrade Model</i>"]
    ud["upgradeDisplay.ts<br/><i>Upgrade UI</i>"]
    cp["characterPool.ts<br/><i>Character Sets</i>"]
    du["domUtils.ts<br/><i>DOM Utilities</i>"]

    main --> gm
    gm --> g
    gm --> gd
    gm --> gc
    gm --> u
    gm --> du
    gc --> g
    gc --> gd
    gc --> u
    gc --> cp
    gd --> du
    gd --> g
    gd --> u
    gd --> ud
    ud --> du
    ud --> u
    ud --> cp
    g --> u
    g --> cp
    u --> cp
```

## Layered Architecture

```mermaid
graph LR
    subgraph "Layer 0 — Entry"
        main["main.ts"]
    end
    subgraph "Layer 1 — Orchestrator"
        gm["gameManager.ts"]
    end
    subgraph "Layer 2 — Primary"
        g["game.ts"]
        gc["gameController.ts"]
        gd["gameDisplay.ts"]
    end
    subgraph "Layer 3 — Secondary"
        u["upgrade.ts"]
        ud["upgradeDisplay.ts"]
        cp["characterPool.ts"]
    end
    subgraph "Layer 4 — Utility"
        du["domUtils.ts"]
    end

    main --> gm
    gm --> g & gd & gc & u & du
    gc --> g & gd & u & cp
    gd --> du & g & u & ud
    g --> u & cp
    u --> cp
    ud --> du & u & cp
```

## DOM Access Boundary

```mermaid
graph TD
    subgraph "DOM Access Allowed"
        du["domUtils.ts"]
        gd["gameDisplay.ts"]
        ud["upgradeDisplay.ts"]
        gm["gameManager.ts<br/><i>(bootstrap only)</i>"]
    end
    subgraph "No DOM Access"
        g["game.ts"]
        gc["gameController.ts"]
        u["upgrade.ts"]
        cp["characterPool.ts"]
    end

    gd -->|uses| du
    ud -->|uses| du
    gm -->|uses| du
    gc -->|delegates to| gd
```

## State Mutation Flow

```mermaid
graph LR
    subgraph "Mutators"
        gc["gameController.ts"]
        gm["gameManager.ts<br/><i>(load only)</i>"]
    end
    subgraph "State"
        g["game.ts"]
        u["upgrade.ts"]
        cp["characterPool.ts"]
    end
    subgraph "Read-Only"
        gd["gameDisplay.ts"]
        ud["upgradeDisplay.ts"]
    end

    gc -->|score, goal| g
    gc -->|purchase| u
    gc -->|toggleSet| cp
    gm -->|restore| g
    gd -.->|reads| g
    gd -.->|reads| u
    ud -.->|reads| u
```

## Module Summary

| Module | Layer | Lines | DOM | Mutates State | Imports From |
|--------|-------|-------|-----|---------------|--------------|
| main.ts | 0 | 6 | No | No | gameManager |
| gameManager.ts | 1 | 86 | Bootstrap | Indirect (load) | game, gameDisplay, gameController, upgrade, domUtils |
| game.ts | 2 | 205 | No | Yes (own state) | upgrade, characterPool |
| gameController.ts | 2 | 187 | No (via display) | Yes (score, goal, purchases) | game, gameDisplay, upgrade, characterPool |
| gameDisplay.ts | 2 | 241 | Yes | No | domUtils, game, upgrade, upgradeDisplay |
| upgrade.ts | 3 | 56 | No | Yes (owned, cost) | characterPool |
| upgradeDisplay.ts | 3 | 77 | Yes | No | domUtils, upgrade, characterPool |
| characterPool.ts | 3 | 157 | No | Yes (set toggles) | none |
| domUtils.ts | 4 | 36 | Yes (utilities) | No | none |
