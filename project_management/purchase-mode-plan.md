# Plan: Purchase Key Completion Flow

## Overview

Replace the current full-key-display-and-type system with a two-phase flow: **selection** (type a short key shown on the card) → **completion** (guided single-char typing through the remaining key sequence). The upgrade card only ever shows a short bounded key. The completion phase reuses the same single-char verification pattern as goal typing.

## Flow

1. Player types `$X` where `X` is the upgrade's selector character (pool-assigned, shown on card).
2. System checks if `$X` matches an upgrade key AND `score >= cost`.
   - No match: normal behavior (input stays, no special handling).
   - Match but can't afford: clear input, flash error.
   - Match and affordable: clear input, enter **completion mode** for that upgrade.
3. In completion mode:
   - The goal display shows the next character in the upgrade's completion sequence.
   - A progress indicator shows `x/n`.
   - Player types one character at a time, same as goal typing — correct char advances and shows next. Incorrect char does nothing (same as current goal loop).
   - If `$` is typed at any point: exit completion mode, clear input.
   - When the last character is typed correctly: purchase happens immediately, completion mode exits, input clears, flash success.
4. During completion mode, normal goal scoring is paused (input is dedicated to the purchase).

## Upgrade Key Structure

Each upgrade has two conceptual parts:
- **Selector key**: `$` + one pool character. Shown on the card. This is the `upgrade.key` field — short, bounded, always 2 chars.
- **Completion sequence**: the long random string that grows with `owned × keyIncrease`. Not shown on the card. Stored as a new field (`upgrade.completionKey`). This is what the player types through in completion mode.

Selectors are assigned from the pool. On `regenerateAllKeys()`, both selector and completion sequence are regenerated. Selectors must be unique across upgrades (same `existingKeys` set pattern used today). Completion sequences don't need to be unique since the player is already locked to a specific upgrade.

## Changes by File

### src/upgrade.ts
- Add `completionKey: string` field.
- `purchase()` regenerates both `key` (selector) and `completionKey`.
- `toString()` / deserialization includes `completionKey`.

### src/game.ts
- `makeUpgrades()`: selector key length is always 2 (the `$` + 1 char). `completionKey` length uses the current growth formula (`keyLength + owned × keyIncrease`).
- `regenerateAllKeys()`: regenerates both selectors and completion keys. Selectors share an `existingKeys` set; completion keys are independent.

### src/characterPool.ts
- `generateKey()` may need a variant for selectors (always length 1 suffix after `$`) vs completion keys (no `$` prefix, just the random sequence). Or keep `generateKey` for selectors and add `generateCompletionKey(length)` for the sequence.

### src/gameController.ts
- New state: `completionTarget: Upgrade | null`, `completionIndex: number`.
- `verifyInput()` branching:
  - If `completionTarget` is set → completion mode logic:
    - If typed char is `$` → exit completion mode, clear input.
    - If typed char matches `completionTarget.completionKey[completionIndex]` → advance index, show next char.
    - If typed char doesn't match → do nothing (same as current goal behavior).
    - If `completionIndex` reaches end → call `attemptUpgradePurchase`, exit completion mode.
  - If `completionTarget` is null → normal flow, but check for selector key matches (`$X`):
    - Match found + affordable → set `completionTarget`, `completionIndex = 0`, clear input, show first completion char in goal display.
    - Match found + not affordable → clear input, flash error.
    - No match → existing behavior.

### src/gameDisplay.ts
- New methods for completion mode UI:
  - `showCompletionChar(char: string)` — displays the next character to type in the goal display area (reuses goal display).
  - `showCompletionProgress(current: number, total: number)` — shows `x/n` progress.
  - `exitCompletionMode()` — restores normal goal display.

### src/upgradeDisplay.ts
- `renderKey()` now renders a 2-char selector — always bounded.
- No purchase progress rendering on the card; progress lives centrally in the goal display area.
- The `display()` caching still works since `upgrade.key` changes on purchase.

### css/style.css
- `.key-value` no longer needs `flex-wrap: wrap` (always short).
- `.upgrade` gets a fixed width now that key display is bounded.
- `.upgrades` changes to `flex-direction: column`, `max-height: <value>`, `overflow-y: auto` for vertical scrollable layout.
- New styles for completion progress indicator near the goal area.
- Possible `.completion-active` class on the selected upgrade card as a subtle highlight.

## Auto-Input Display

No changes. `maxDigitsToDisplay` cap of 4 remains sufficient. Auto-scoring continues during completion mode (it's passive).

## Save/Load

`completionKey` is added to `Upgrade.toString()` serialization. On load, both `key` and `completionKey` are restored. Completion mode state (`completionTarget`, `completionIndex`) is not saved — if the player saves mid-completion, they resume in normal mode.

## Context Doc Updates (on implementation)

### system.md — Upgrades section
- Document the selector key (`$` + 1 pool char) vs completion key (long random sequence) split.
- Update `purchase()` description to cover regeneration of both keys.
- Update `regenerateAllKeys()` to mention both selector and completion key regeneration.

### system.md — Input & Game Loop section
- Document completion mode state (`completionTarget`, `completionIndex`) on `GameController`.
- Document the `verifyInput()` branching: completion mode active vs normal flow.
- Document completion mode entry (selector match + affordable), exit (`$` typed or sequence finished), and the single-char verification loop.

### system.md — Display section
- Document new `GameDisplay` methods for completion mode (`showCompletionChar`, `showCompletionProgress`, `exitCompletionMode`).
- Document that goal display is reused for completion char display during purchase.
- Update `UpgradeDisplay` description: `renderKey()` now renders a 2-char selector.

### system.md — DOM Structure section
- Update `.upgrades` layout: vertical scrollable flex column with `max-height` and `overflow-y: auto`.
- Document completion progress indicator element near the goal area.
