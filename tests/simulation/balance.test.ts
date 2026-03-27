import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { Game } from "../../src/game"
import { OneTimeUpgrade, type Upgrade } from "../../src/upgrade"

const RESULTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../test-results")

interface PurchaseEvent {
	upgradeName: string
	timestamp: number
	timeSincePrev: number
	scoreAtPurchase: number
	purchaseCount: number
}

function formatTime(seconds: number): string {
	if (seconds < 60) return `${seconds.toFixed(1)}s`
	const minutes = Math.floor(seconds / 60)
	const secs = seconds % 60
	if (minutes < 60) return `${minutes}m ${secs.toFixed(0)}s`
	const hours = Math.floor(minutes / 60)
	const remainingMinutes = minutes % 60
	return `${hours}h ${remainingMinutes}m`
}

function valuePerCost(upgrade: Upgrade): number {
	return upgrade.value / upgrade.cost
}

function simulate(manualTypesPerSecond = 2, maxSimTimeSeconds = 36000): PurchaseEvent[] {
	const game = new Game()
	const events: PurchaseEvent[] = []
	const tickInterval = 0.1 // 100ms ticks
	let simTime = 0
	let lastPurchaseTime = 0

	// Track auto-score timing per upgrade (mirrors displayTicks in gameController)
	const lastAutoFire = new Map<string, number>()

	// When saving for a OneTimeUpgrade, store it here
	let savingTarget: OneTimeUpgrade | null = null

	while (simTime < maxSimTimeSeconds) {
		simTime += tickInterval

		// Manual typing: player types manualTypesPerSecond chars/sec
		// Each successful type adds scoreMulti to score
		game.score += game.scoreMulti * manualTypesPerSecond * tickInterval

		// Auto-score: each owned upgrade fires owned times per second
		for (const upgrade of game.upgrades) {
			if (upgrade.owned > 0 && !(upgrade instanceof OneTimeUpgrade) && upgrade.value > 0) {
				const fireInterval = 1.0 / upgrade.owned
				const lastFire = lastAutoFire.get(upgrade.name) ?? 0
				if (simTime - lastFire >= fireInterval) {
					lastAutoFire.set(upgrade.name, simTime)
					game.score += upgrade.value
				}
			}
		}

		// Check if we should start saving for a OneTimeUpgrade
		// If score >= 2/3 of any unpurchased OneTimeUpgrade cost, save for it
		if (!savingTarget) {
			for (const upgrade of game.upgrades) {
				if (upgrade instanceof OneTimeUpgrade && upgrade.owned === 0) {
					if (game.score >= upgrade.cost * (2 / 3)) {
						savingTarget = upgrade
						break
					}
				}
			}
		}

		// If saving for a OneTimeUpgrade, only buy that
		if (savingTarget) {
			if (game.score >= savingTarget.cost) {
				const upgrade = savingTarget
				game.score -= upgrade.cost
				upgrade.purchase()
				upgrade.onPurchase()
				game.regenerateCompletionKeys()

				events.push({
					upgradeName: upgrade.name,
					timestamp: simTime,
					timeSincePrev: simTime - lastPurchaseTime,
					scoreAtPurchase: game.score,
					purchaseCount: 1,
				})
				lastPurchaseTime = simTime
				savingTarget = null
			}
			// Skip buying other upgrades while saving
		} else {
			// Buy the non-OneTimeUpgrade with best value/cost ratio
			const candidates = game.upgrades.filter(
				(u) => !(u instanceof OneTimeUpgrade) && game.score >= u.cost && u.value > 0,
			)

			if (candidates.length > 0) {
				candidates.sort((a, b) => valuePerCost(b) - valuePerCost(a))
				const upgrade = candidates[0]
				const purchaseCount = upgrade.owned + 1

				game.score -= upgrade.cost
				upgrade.purchase(game.characterPool)

				events.push({
					upgradeName: upgrade.name,
					timestamp: simTime,
					timeSincePrev: simTime - lastPurchaseTime,
					scoreAtPurchase: game.score,
					purchaseCount,
				})
				lastPurchaseTime = simTime
			}
		}

		// End when all upgrades have been purchased at least once
		if (game.upgrades.every((u) => u.owned > 0)) {
			break
		}
	}

	return events
}

describe("Balance simulation", () => {
	it("prints a human-readable timing table", () => {
		const events = simulate(2, 36000)

		// Build the table
		const lines: string[] = []
		lines.push("")
		lines.push("=== Balance Simulation Results (2 manual types/sec) ===")
		lines.push("")
		lines.push(
			`${"Event".padEnd(40)} ${"Time".padStart(10)} ${"Delta".padStart(10)} ${"#".padStart(4)} ${"Score After".padStart(12)}`,
		)
		lines.push("-".repeat(80))

		for (const event of events) {
			const name = `${event.upgradeName} #${event.purchaseCount}`
			lines.push(
				`${name.padEnd(40)} ${formatTime(event.timestamp).padStart(10)} ${formatTime(event.timeSincePrev).padStart(10)} ${String(event.purchaseCount).padStart(4)} ${Math.floor(event.scoreAtPurchase).toString().padStart(12)}`,
			)
		}

		const lastEvent = events[events.length - 1]
		lines.push("-".repeat(80))
		lines.push(`Total purchases: ${events.length}`)
		lines.push(`Total time to complete: ${formatTime(lastEvent.timestamp)}`)
		lines.push("")

		// Write results to test-results/
		mkdirSync(RESULTS_DIR, { recursive: true })
		writeFileSync(resolve(RESULTS_DIR, "balance-simulation.txt"), lines.join("\n"))

		// Sanity: simulation should complete
		expect(events.length).toBeGreaterThan(0)
		expect(lastEvent.timestamp).toBeGreaterThan(0)
	})

	it("first upgrade is purchased within 15 seconds", () => {
		const events = simulate(2, 36000)
		// Two finger typer costs 20, with scoreMulti=1 and 2 types/sec = 2 score/sec → ~10s
		const firstPurchase = events[0]
		expect(firstPurchase.timestamp).toBeLessThan(15)
	})

	it("time between purchases never exceeds 20 minutes", () => {
		const events = simulate(2, 36000)
		for (const event of events) {
			expect(
				event.timeSincePrev,
				`Gap before ${event.upgradeName} #${event.purchaseCount} was ${formatTime(event.timeSincePrev)}`,
			).toBeLessThan(1200)
		}
	})
})
