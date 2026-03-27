import { describe, expect, it } from "vitest"
import { CharacterPool, getKeySymbol, getSymbols } from "../../src/characterPool"

describe("CharacterPool", () => {
	it("starts with an empty pool", () => {
		const cp = new CharacterPool("$")
		expect(cp.pool).toEqual([])
	})

	it("addSet populates the pool with those chars", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b", "c"])
		expect(cp.pool).toEqual(["a", "b", "c"])
	})

	it("addSet with multiple sets combines them", () => {
		const cp = new CharacterPool("$")
		cp.addSet("first", ["a", "b"])
		cp.addSet("second", ["x", "y"])
		expect(cp.pool).toEqual(["a", "b", "x", "y"])
	})

	it("addSet replaces chars for an existing set name", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b"])
		cp.addSet("test", ["x", "y", "z"])
		expect(cp.pool).toEqual(["x", "y", "z"])
	})

	it("toggleSet disables a set and removes its chars from the pool", () => {
		const cp = new CharacterPool("$")
		cp.addSet("first", ["a", "b"])
		cp.addSet("second", ["x", "y"])
		cp.toggleSet("first", false)
		expect(cp.pool).toEqual(["x", "y"])
	})

	it("toggleSet re-enables a set", () => {
		const cp = new CharacterPool("$")
		cp.addSet("first", ["a", "b"])
		cp.addSet("second", ["x", "y"])
		cp.toggleSet("first", false)
		cp.toggleSet("first", true)
		expect(cp.pool).toEqual(["a", "b", "x", "y"])
	})

	it("toggleSet blocks disabling the last enabled set", () => {
		const cp = new CharacterPool("$")
		cp.addSet("only", ["a", "b"])
		const result = cp.toggleSet("only", false)
		expect(result).toBe(false)
		expect(cp.pool).toEqual(["a", "b"])
	})

	it("isSetEnabled returns correct state", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a"])
		expect(cp.isSetEnabled("test")).toBe(true)
		cp.addSet("other", ["b"])
		cp.toggleSet("test", false)
		expect(cp.isSetEnabled("test")).toBe(false)
	})

	it("getSetNames returns all registered set names", () => {
		const cp = new CharacterPool("$")
		cp.addSet("symbols", ["!"])
		cp.addSet("letters", ["a"])
		expect(cp.getSetNames()).toEqual(["symbols", "letters"])
	})

	it("getRandomChar returns a char from the pool", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b", "c"])
		for (let i = 0; i < 20; i++) {
			expect(["a", "b", "c"]).toContain(cp.getRandomChar())
		}
	})

	it("getRandomSingleChar returns only single-char entries", () => {
		const cp = new CharacterPool("$")
		cp.addSet("mixed", ["a", "hello", "b", "world"])
		for (let i = 0; i < 20; i++) {
			const char = cp.getRandomSingleChar()
			expect(char.length).toBe(1)
		}
	})

	it("getRandomSingleChar falls back to full pool when no single chars exist", () => {
		const cp = new CharacterPool("$")
		cp.addSet("words", ["hello", "world"])
		for (let i = 0; i < 20; i++) {
			expect(["hello", "world"]).toContain(cp.getRandomSingleChar())
		}
	})

	it("generateKey starts with purchaseChar and has correct length", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b", "c"])
		const key = cp.generateKey(1)
		expect(key.startsWith("$")).toBe(true)
		expect(key.length).toBe(2)
	})

	it("generateKey avoids duplicates in existingKeys", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a"])
		const used = new Set<string>()
		const key1 = cp.generateKey(1, used)
		expect(key1).toBe("$a")
		expect(used.has("$a")).toBe(true)
	})

	it("generateKey produces unique keys across calls", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b", "c", "d", "e"])
		const used = new Set<string>()
		const keys: string[] = []
		for (let i = 0; i < 5; i++) {
			keys.push(cp.generateKey(1, used))
		}
		expect(new Set(keys).size).toBe(5)
	})

	it("generateCompletionKey returns array of requested length", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a", "b", "c"])
		const key = cp.generateCompletionKey(7)
		expect(key.length).toBe(7)
		for (const entry of key) {
			expect(["a", "b", "c"]).toContain(entry)
		}
	})

	it("generateCompletionKey with length 0 returns empty array", () => {
		const cp = new CharacterPool("$")
		cp.addSet("test", ["a"])
		expect(cp.generateCompletionKey(0)).toEqual([])
	})

	it("addLetters adds a letters set to the pool", () => {
		const cp = new CharacterPool("$")
		cp.addSet("symbols", getSymbols())
		cp.addLetters()
		expect(cp.isSetEnabled("letters")).toBe(true)
		expect(cp.pool).toContain("a")
		expect(cp.pool).toContain("z")
	})

	it("addWords adds a words set to the pool", () => {
		const cp = new CharacterPool("$")
		cp.addSet("symbols", getSymbols())
		cp.addWords()
		expect(cp.isSetEnabled("words")).toBe(true)
		expect(cp.pool).toContain("the")
		expect(cp.pool).toContain("about")
	})

	it("toSaveObj and fromSave round-trip correctly", () => {
		const cp = new CharacterPool("$")
		cp.addSet("symbols", getSymbols())
		cp.addSet("letters", ["a", "b"])
		cp.toggleSet("letters", false)

		const [purchaseChar, setsData] = cp.toSaveObj()
		const restored = CharacterPool.fromSave(purchaseChar, setsData)

		expect(restored.purchaseChar).toBe("$")
		expect(restored.isSetEnabled("symbols")).toBe(true)
		expect(restored.isSetEnabled("letters")).toBe(false)
		expect(restored.pool).toEqual(cp.pool)
	})
})

describe("getKeySymbol", () => {
	it("maps arrow keys to unicode symbols", () => {
		expect(getKeySymbol("ArrowUp")).toBe("↑")
		expect(getKeySymbol("ArrowDown")).toBe("↓")
		expect(getKeySymbol("ArrowLeft")).toBe("←")
		expect(getKeySymbol("ArrowRight")).toBe("→")
	})

	it("returns undefined for non-arrow keys", () => {
		expect(getKeySymbol("a")).toBeUndefined()
		expect(getKeySymbol("Enter")).toBeUndefined()
	})
})
