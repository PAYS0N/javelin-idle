import { describe, expect, it } from "vitest"
import { Game } from "../../src/game"
import { OneTimeUpgrade } from "../../src/upgrade"

describe("Game", () => {
	it("initializes with default state", () => {
		const game = new Game()
		expect(game.score).toBe(0)
		expect(game.scoreMulti).toBe(1)
		expect(game.goal).toBe("")
		expect(game.upgrades.length).toBe(6)
	})

	it("scoreSuccess adds scoreMulti to score", () => {
		const game = new Game()
		game.scoreSuccess()
		expect(game.score).toBe(1)
		game.scoreSuccess()
		expect(game.score).toBe(2)
	})

	it("scoreSuccess respects changed scoreMulti", () => {
		const game = new Game()
		game.scoreMulti = 5
		game.scoreSuccess()
		expect(game.score).toBe(5)
	})

	it("updateGoal sets a non-empty goal from the pool", () => {
		const game = new Game()
		const goal = game.updateGoal()
		expect(goal.length).toBeGreaterThan(0)
		expect(game.goal).toBe(goal)
	})

	it("makeUpgrades creates upgrades in the correct order with correct names", () => {
		const game = new Game()
		const names = game.upgrades.map((u) => u.name)
		expect(names).toEqual([
			"Two finger typer",
			"Practiced two finger typer",
			"Unlock Letters",
			"New touch typer",
			"Touch typer",
			"Unlock Words",
		])
	})

	it("makeUpgrades assigns correct base costs", () => {
		const game = new Game()
		const costs = game.upgrades.map((u) => u.cost)
		expect(costs).toEqual([20, 80, 500, 1000, 5000, 8000])
	})

	it("makeUpgrades assigns unique selector keys", () => {
		const game = new Game()
		const keys = game.upgrades.map((u) => u.key)
		expect(new Set(keys).size).toBe(6)
	})

	it("all selector keys start with $", () => {
		const game = new Game()
		for (const upgrade of game.upgrades) {
			expect(upgrade.key.startsWith("$")).toBe(true)
		}
	})

	it("OneTimeUpgrades are at indices 2 and 5", () => {
		const game = new Game()
		expect(game.upgrades[2]).toBeInstanceOf(OneTimeUpgrade)
		expect(game.upgrades[5]).toBeInstanceOf(OneTimeUpgrade)
	})

	it("findUpgradeByKey returns the matching upgrade", () => {
		const game = new Game()
		const firstKey = game.upgrades[0].key
		expect(game.findUpgradeByKey(firstKey)).toBe(game.upgrades[0])
	})

	it("findUpgradeByKey returns undefined for unknown key", () => {
		const game = new Game()
		expect(game.findUpgradeByKey("$zzz")).toBeUndefined()
	})

	it("regenerateCompletionKeys updates all completion keys", () => {
		const game = new Game()
		const originalKeys = game.upgrades.map((u) => [...u.completionKey])
		game.regenerateCompletionKeys()
		let anyChanged = false
		for (let i = 0; i < game.upgrades.length; i++) {
			const original = originalKeys[i]
			const current = game.upgrades[i].completionKey
			expect(current.length).toBe(original.length)
			if (JSON.stringify(current) !== JSON.stringify(original)) {
				anyChanged = true
			}
		}
		// With a pool of 33 symbols and keys of length 3+, extremely unlikely all stay the same
		expect(anyChanged).toBe(true)
	})

	it("addLetters multiplies scoreMulti by 5 and adds letters to pool", () => {
		const game = new Game()
		game.addLetters()
		expect(game.scoreMulti).toBe(5)
		expect(game.characterPool.isSetEnabled("letters")).toBe(true)
	})

	it("addWords multiplies scoreMulti by 10 and adds words to pool", () => {
		const game = new Game()
		game.addWords()
		expect(game.scoreMulti).toBe(10)
		expect(game.characterPool.isSetEnabled("words")).toBe(true)
	})

	it("serialization round-trip preserves game state", () => {
		const game = new Game()
		game.score = 42
		game.scoreMulti = 5
		game.updateGoal()
		game.upgrades[0].purchase(game.characterPool)

		const json = game.toString()
		const parsed = JSON.parse(json) as Record<string, unknown>
		const restored = new Game(parsed)

		expect(restored.score).toBe(42)
		expect(restored.scoreMulti).toBe(5)
		expect(restored.goal).toBe(game.goal)
		expect(restored.upgrades[0].owned).toBe(1)
		expect(restored.upgrades[0].cost).toBe(game.upgrades[0].cost)
		expect(restored.upgrades[0].key).toBe(game.upgrades[0].key)
	})

	it("serialization round-trip preserves OneTimeUpgrade purchased state", () => {
		const game = new Game()
		game.score = 10000
		game.addLetters()
		game.upgrades[2].owned = 1

		const json = game.toString()
		const parsed = JSON.parse(json) as Record<string, unknown>
		const restored = new Game(parsed)

		expect(restored.upgrades[2].owned).toBe(1)
		expect(restored.upgrades[2]).toBeInstanceOf(OneTimeUpgrade)
		// scoreMulti should be preserved (addLetters was called on load via onPurchase, then overwritten by saved value)
		expect(restored.scoreMulti).toBe(game.scoreMulti)
	})
})
