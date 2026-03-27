import { describe, expect, it, vi } from "vitest"
import { CharacterPool, getSymbols } from "../../src/characterPool"
import { OneTimeUpgrade, Upgrade } from "../../src/upgrade"

function makePool(): CharacterPool {
	const cp = new CharacterPool("$")
	cp.addSet("symbols", getSymbols())
	return cp
}

function makeUpgrade(overrides: Partial<{
	name: string
	cost: number
	costIncrease: number
	thresholdMulti: number
	keyLength: number
	keyIncrease: number
	value: number
}> = {}): Upgrade {
	const cp = makePool()
	return new Upgrade(
		overrides.name ?? "Test Upgrade",
		overrides.cost ?? 20,
		overrides.costIncrease ?? 3,
		overrides.thresholdMulti ?? 0.75,
		cp.generateKey(1),
		cp.generateCompletionKey(overrides.keyLength ?? 3),
		overrides.keyLength ?? 3,
		overrides.keyIncrease ?? 1,
		overrides.value ?? 0.25,
	)
}

describe("Upgrade", () => {
	it("starts with owned = 0", () => {
		const u = makeUpgrade()
		expect(u.owned).toBe(0)
	})

	it("purchase increments owned by 1", () => {
		const cp = makePool()
		const u = makeUpgrade()
		u.purchase(cp)
		expect(u.owned).toBe(1)
		u.purchase(cp)
		expect(u.owned).toBe(2)
	})

	it("purchase adds costIncrease to cost", () => {
		const cp = makePool()
		const u = makeUpgrade({ cost: 20, costIncrease: 3 })
		u.purchase(cp)
		expect(u.cost).toBe(23)
		u.purchase(cp)
		expect(u.cost).toBe(26)
	})

	it("purchase regenerates completionKey with correct length", () => {
		const cp = makePool()
		const u = makeUpgrade({ keyLength: 3, keyIncrease: 1 })
		expect(u.completionKey.length).toBe(3)
		u.purchase(cp)
		expect(u.completionKey.length).toBe(3 + 1 * 1)
		u.purchase(cp)
		expect(u.completionKey.length).toBe(3 + 2 * 1)
	})

	it("purchase with fractional keyIncrease grows correctly", () => {
		const cp = makePool()
		const u = makeUpgrade({ keyLength: 3, keyIncrease: 1 / 3 })
		u.purchase(cp)
		// generateCompletionKey receives 3 + 1*(1/3) = 3.33; the for loop runs ceil-ish (i < 3.33 → 4 iterations)
		expect(u.completionKey.length).toBe(4)
		u.purchase(cp)
		// 3 + 2*(1/3) = 3.66 → 4 iterations
		expect(u.completionKey.length).toBe(4)
		u.purchase(cp)
		// 3 + 3*(1/3) = 4.0 → 4 iterations
		expect(u.completionKey.length).toBe(4)
	})

	it("selector key is unchanged after purchase", () => {
		const cp = makePool()
		const u = makeUpgrade()
		const originalKey = u.key
		u.purchase(cp)
		expect(u.key).toBe(originalKey)
	})

	it("toString serializes cost, owned, and key", () => {
		const u = makeUpgrade({ cost: 50 })
		const parsed = JSON.parse(u.toString()) as Record<string, unknown>
		expect(parsed.cost).toBe(50)
		expect(parsed.owned).toBe(0)
		expect(typeof parsed.key).toBe("string")
	})
})

describe("OneTimeUpgrade", () => {
	it("purchase sets owned to 1 and calls onPurchase", () => {
		const cp = makePool()
		const callback = vi.fn()
		const u = new OneTimeUpgrade(
			"Test OneTime",
			500,
			0.8,
			cp.generateKey(1),
			cp.generateCompletionKey(10),
			callback,
			10,
		)
		u.purchase()
		expect(u.owned).toBe(1)
		expect(callback).toHaveBeenCalledOnce()
	})

	it("second purchase still caps owned at 1", () => {
		const cp = makePool()
		const callback = vi.fn()
		const u = new OneTimeUpgrade(
			"Test OneTime",
			500,
			0.8,
			cp.generateKey(1),
			cp.generateCompletionKey(10),
			callback,
			10,
		)
		u.purchase()
		u.purchase()
		expect(u.owned).toBe(1)
		expect(callback).toHaveBeenCalledTimes(2)
	})

	it("has costIncrease of 0 and value of 0", () => {
		const cp = makePool()
		const u = new OneTimeUpgrade(
			"Test OneTime",
			500,
			0.8,
			cp.generateKey(1),
			cp.generateCompletionKey(10),
			() => {},
			10,
		)
		expect(u.costIncrease).toBe(0)
		expect(u.value).toBe(0)
	})
})
