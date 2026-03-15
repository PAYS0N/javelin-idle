# Style Context: Javelin Idle

## Language & Tooling

TypeScript (ES2020 target), compiled via `tsc` to `dist/`. Strict mode enabled. No bundler or linter config. Source files live in `src/`, compiled output in `dist/` (gitignored). The `npm run build` script runs `tsc`. The Docker build uses a multi-stage Dockerfile: a Node stage compiles TypeScript, then a Debian/Nginx stage serves the static output.

## Module Pattern

ES modules (`import`/`export`). Each file defines exactly one class (or one group of closely related functions in `characterPool.ts`). The entry point is `src/main.ts`, loaded via `<script type="module" src="./dist/main.js">` in `index.html`. Import paths use `.js` extensions (required for ES module resolution of compiled output).

## Naming

- Classes: PascalCase (`Game`, `GameController`, `GameDisplay`, `CharacterPool`, `Upgrade`, `OneTimeUpgrade`, `UpgradeDisplay`).
- Methods and properties: camelCase throughout.
- DOM query strings and CSS classes use kebab-case matching the HTML (`".score-value"`, `"#save-game-button"`).

## Type Annotations

Native TypeScript types are used throughout. Class properties are declared with type annotations in the class body. Method parameters and return types are annotated inline. `Record<string, string>` is used for string-keyed maps. `Record<string, unknown>` is used for loosely-typed deserialized JSON objects. Type assertions (`as`) are used sparingly for JSON parse results.

## DOM Access

All DOM queries go through two utility functions in `domUtils.ts`: `safeQueryHTMLElement(identifier, base = document)` and `safeQueryHTMLElementInput(identifier, base = document)`. Both throw a `TypeError` with a descriptive message if the element is missing or the wrong type. Passing a base element as the second argument scopes the query to that subtree.

## Formatting

- Tabs for indentation.
- No semicolons (ASI-reliant style).
- Single blank line between methods.
- Opening braces on the same line as the declaration.
- Arrow functions used for event listeners and `setTimeout`/`setInterval` callbacks; regular methods otherwise.

## Error Handling

Missing DOM elements throw `TypeError` via the `safeQuery*` wrappers. Invalid save data throws `Error` with the message `"Create game object invalid"` in `createGameFromObj`. No try/catch at call sites — errors propagate to the browser console. No user-facing error UI beyond the `error-state` class on the input field (currently has no CSS rule).

## Serialization

`toString()` methods on `Game`, `Upgrade`, and `CharacterPool` return `JSON.stringify(...)` of a plain object. `Game.toString()` is the top-level save format: a JSON string containing score, scoreMulti, goal, a nested JSON string for characterPool, and an array of nested JSON strings for each upgrade. Deserialization mirrors this in `createGameFromObj` with explicit `typeof` and `instanceof` guards before each assignment.

## CSS

One stylesheet (`css/style.css`). No preprocessor, no CSS variables, no utility framework. Rules are ordered structurally: reset → layout regions (header, center, footer) → individual components. Selectors use classes for reusable components and IDs for unique page elements (save/load buttons, header title). No nesting; each rule block is a flat selector. Units: `rem` for spacing and font sizes, `dvh` for full-viewport height, `%` for element-relative widths. State classes (`.unavailable`, `.green-background`, `.error-state`) are toggled by JS via `classList`. `.unavailable` is `display: none`. `.green-background` and `.error-state` are transitioned via `transition: background-color 0.2s ease` on the input elements they apply to.

## HTML

Single-page, static HTML (`index.html`). No templating engine. Upgrade cards and auto-input elements are created entirely in TypeScript and appended to `.upgrades` and `.auto-inputs` at runtime — the HTML contains only the empty container divs. A single `<script type="module" src="./dist/main.js">` tag loads the compiled entry point. Attributes use double quotes. Indentation is tabs.

## Intervals & Timing

The main game loop uses `setInterval` at 100ms for UI updates and upgrade reveal checks. Auto-scoring uses recursive `setTimeout` with dynamic delay (`1000 / upgrade.owned`) to vary tick frequency. No `requestAnimationFrame` or `performance.now` is used.
