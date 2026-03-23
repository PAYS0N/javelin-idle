# Character Pool Context: Javelin Idle

`CharacterPool` (characterPool.ts) holds typeable characters as named sets. Each set is a `CharSet`: `{ chars: string[], enabled: boolean }`, stored in `sets: Record<string, CharSet>`. The active `pool: string[]` is derived from all enabled sets and rebuilt on any change.

---

## Sets

The starting set is `"symbols"`: programming punctuation and unicode arrows (`↑↓←→`). The purchase character `$` is reserved and excluded from the pool. Arrow key input is handled separately by the key mapping system, not by the pool.

`addSet(name, chars)` registers a new set (enabled by default) and rebuilds the pool. If the set already exists, only `chars` is updated and the existing `enabled` state is preserved.

`addLetters()` calls `addSet("letters", getLetters())` to merge a–z into the pool.

`addWords()` calls `addSet("words", getWords())` to merge the top 100 most common English words into the pool. Each word is a single pool entry (a multi-character string).

`toggleSet(name, enabled)` enables or disables a named set. If disabling the set would leave zero enabled sets, the call is a no-op and returns `false`; otherwise it updates the state, rebuilds the pool, and returns `true`.

`isSetEnabled(name)` and `getSetNames()` expose per-set state for the settings panel.

---

## Key Generation

`generateKey(length, existingKeys?)` builds a selector key string: `$` followed by `length` randomly sampled entries from the single-char pool (pool entries filtered to `length === 1`, falling back to the full pool if empty). Ensures selector keys remain short and typeable even when multi-char words are in the pool. Used only for selector keys (always called with `length = 1` to produce 2-char keys like `$+`).

`generateCompletionKey(length)` returns a `string[]` of `length` entries randomly sampled from the full pool (including words). Each entry may be a single character or a multi-character word.

---

## Goal & Auto-Typer

`getRandomChar()` picks a random entry from the pool array to serve as the next typing goal. May return a multi-character word if the words set is active.

`getRandomSingleChar()` picks a random entry from the single-char pool (filtered to `length === 1`, falling back to full pool). Used by the auto-typer display so it never shows words in the animation slots.

---

## Key Symbol Mapping

`getKeySymbol(key: string): string | undefined` (exported from `characterPool.ts`) maps physical key names to display symbols using a module-level `KEY_MAP`. Only the four arrow keys have non-identity entries (`ArrowUp → ↑`, etc.). Used by `GameController.getInput(e)` as `getKeySymbol(e.key) ?? e.key`.

---

## Serialization

`toSaveObj()` returns a plain serializable tuple `[purchaseChar, setsConfig]` where `setsConfig` is `Record<string, { chars: string[], enabled: boolean }>`. This is embedded directly in the game JSON (not double-encoded). Static method `fromSave(purchaseChar, setsConfig)` reconstructs the pool from a saved tuple.
