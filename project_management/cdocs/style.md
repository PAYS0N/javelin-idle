# Style Context: Javelin Idle

## Language & Tooling

Vanilla JS (ES2020+), no bundler, no transpiler, no linter config. Files are loaded via `<script>` tags in dependency order in `index.html`. `// @ts-check` appears at the top of every JS file that contains a class; it enables VS Code's JSDoc-driven type checking without a build step.

## Module Pattern

Each file defines exactly one class (or one group of closely related functions in `characterPool.js`). There are no ES modules (`import`/`export`) — all classes are globals, available across files by load order. Free functions (`getSymbols`, `getLetters`) are module-level helpers defined before the class in the same file.

## Naming

- Classes: PascalCase (`Game`, `GameController`, `GameDisplay`, `CharacterPool`, `Upgrade`, `OneTimeUpgrade`, `UpgradeDisplay`).
- Methods and properties: camelCase throughout.
- DOM query strings and CSS classes use kebab-case matching the HTML (`".score-value"`, `"#save-game-button"`).

## Type Annotations

JSDoc annotations are used for method parameters and return types wherever the type is non-obvious or a DOM type is involved. `@param` and `@returns` tags are written on their own lines above the method. Property types are annotated inline with `/** @type {Type} */` directly above the assignment, including on properties initialized in the constructor body. Type annotations are present but not exhaustive — some short helper methods have none.

## DOM Access

All DOM queries go through two global utility functions in `domUtils.js`: `safeQueryHTMLElement(identifier, base = document)` and `safeQueryHTMLElementInput(identifier, base = document)`. Both throw a `TypeError` with a descriptive message if the element is missing or the wrong type. Passing a base element as the second argument scopes the query to that subtree.

## Formatting

- Tabs for indentation.
- No semicolons (ASI-reliant style).
- Single blank line between methods.
- Opening braces on the same line as the declaration.
- Arrow functions used for event listeners and `setTimeout`/`setInterval` callbacks; regular methods otherwise.

## Error Handling

Missing DOM elements throw `TypeError` via the `safeQuery*` wrappers. Invalid save data throws `Error` with the message `"Create game object invalid"` in `createGameFromObj`. No try/catch at call sites — errors propagate to the browser console. No user-facing error UI beyond the `error-state` class on the input field (currently has no CSS rule).

## Serialization

`toString()` methods on `Game`, `Upgrade`, and `CharacterPool` return `JSON.stringify(...)` of a plain object. `Game.toString()` is the top-level save format: a JSON string containing score, scoreMulti, goal, a nested JSON string for characterPool, and an array of nested JSON strings for each upgrade. Deserialization mirrors this in `createGameFromObj` / `createGameFromObj` with explicit `typeof` and `instanceof` guards before each assignment.

## CSS

One stylesheet (`css/style.css`). No preprocessor, no CSS variables, no utility framework. Rules are ordered structurally: reset → layout regions (header, center, footer) → individual components. Selectors use classes for reusable components and IDs for unique page elements (save/load buttons, header title). No nesting; each rule block is a flat selector. Units: `rem` for spacing and font sizes, `dvh` for full-viewport height, `%` for element-relative widths. State classes (`.unavailable`, `.green-background`, `.error-state`) are toggled by JS via `classList`. `.unavailable` is `display: none`. `.green-background` and `.error-state` are transitioned via `transition: background-color 0.2s ease` on the input elements they apply to.

## HTML

Single-page, static HTML (`index.html`). No templating engine. Upgrade cards and auto-input elements are created entirely in JS and appended to `.upgrades` and `.auto-inputs` at runtime — the HTML contains only the empty container divs. Script tags are in `<head>`: dependencies loaded synchronously in order, `javascript.js` loaded with `defer` so it runs after DOM parse. Attributes use double quotes. Indentation is tabs.

## Intervals & Timing

The main game loop uses `setInterval` at 100ms for UI updates and upgrade reveal checks. Auto-scoring uses recursive `setTimeout` with dynamic delay (`1000 / upgrade.owned`) to vary tick frequency. No `requestAnimationFrame` or `performance.now` is used.
