# Architecture Health Check Prompt

Run this prompt every 10–15 commits to validate architectural integrity.

---

Read `project_management/manifest.md` before proceeding.

## Task

Perform a full architectural health check on the Javelin Idle codebase. Present all findings before making any changes.

### Step 1 — Read Standards

Read `project_management/standards/architecture.md` (conventions and forbidden patterns) and `project_management/architecture-baseline.md` (previous baseline diagram).

### Step 2 — Map Current Architecture

Read every `src/*.ts` file. For each file, record:
- All `import` statements (what it imports and from where)
- Whether it accesses the DOM (calls to `document.*`, `safeQueryHTMLElement`, `createElement`, `classList`, `appendChild`, `textContent`, etc.)
- Whether it mutates game state (writes to `game.score`, `game.goal`, `upgrade.owned`, etc.)
- Its approximate line count

### Step 3 — Generate Current Diagram

From the import map, produce a Mermaid dependency graph in the same format as the baseline in `architecture-baseline.md`. Include all four diagram sections: Module Dependency Graph, Layered Architecture, DOM Access Boundary, State Mutation Flow. Update the Module Summary table.

### Step 4 — Run Forbidden Pattern Checks

Execute each grep command listed in the "Forbidden Patterns" section of `architecture.md`. Report pass/fail for each:

- **F1**: `grep -n "document\." src/game.ts src/upgrade.ts src/characterPool.ts src/gameController.ts`
- **F2**: `grep -rn "innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|eval(" src/`
- **F3**: `grep -n "\.score\s*=" src/gameDisplay.ts src/upgradeDisplay.ts` and `grep -n "\.owned\s*=" src/gameDisplay.ts src/upgradeDisplay.ts`
- **F4**: `grep -rn "\.querySelector\|\.getElementById" src/ --include="*.ts"` (results should be only in `domUtils.ts`)
- **F5**: Review import graph for cycles

### Step 5 — Run Linter

Run `npx biome check src/` and `npm run build`. Report any errors or warnings.

### Step 6 — Compare to Baseline

Diff the current diagram against the stored baseline. Flag:
- New dependencies (imports that didn't exist in the baseline)
- Removed dependencies
- New modules or removed modules
- Any dependency that violates the layer hierarchy (upward import)
- Any module whose responsibility has shifted (e.g., a display module now mutating state)

### Step 7 — Verdict

Produce a verdict:

**PASS** — No violations found. Architecture matches conventions. Update the baseline date.

**PASS WITH NOTES** — No violations, but there are new dependencies or structural changes that are intentional and conform to conventions. List the changes. Update the baseline to reflect them.

**FAIL** — One or more violations found. List each violation with:
- Which rule was broken (reference the F-number or convention)
- Which file and line
- Suggested fix

Do not update the baseline when the verdict is FAIL.

### Step 8 — Update Baseline (if PASS or PASS WITH NOTES)

Overwrite `project_management/architecture-baseline.md` with the newly generated diagram and updated Module Summary table. Set the "Generated" date to today.

If the verdict is PASS WITH NOTES, add a "Ratified Changes" section to the baseline listing what changed and why.
