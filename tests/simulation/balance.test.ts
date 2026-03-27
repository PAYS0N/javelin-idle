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
	scorePerSec: number
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

function calcScorePerSec(game: { scoreMulti: number; upgrades: Upgrade[] }, manualTypesPerSecond: number): number {
	const autoScore = game.upgrades
		.filter((u) => !(u instanceof OneTimeUpgrade) && u.value > 0)
		.reduce((sum, u) => sum + u.value * u.owned, 0)
	return game.scoreMulti * manualTypesPerSecond + autoScore
}

// Opportunity cost of a purchase: score deducted + typing time weighted at 3 score/sec
function effectiveCost(upgrade: Upgrade, manualTypesPerSecond: number): number {
	return upgrade.cost + (upgrade.completionKey.length / manualTypesPerSecond) * 3
}

type Strategy = (game: Game, revealedUpgrades: Set<string>, manualTypesPerSecond: number) => Upgrade | null

// Save for OneTimeUpgrades when close; otherwise buy best value / effectiveCost ratio
function greedyStrategy(game: Game, _revealedUpgrades: Set<string>, manualTypesPerSecond: number): Upgrade | null {
	for (const upgrade of game.upgrades) {
		if (upgrade instanceof OneTimeUpgrade && upgrade.owned === 0) {
			if (game.score >= upgrade.cost * (2 / 3)) {
				return game.score >= upgrade.cost ? upgrade : null
			}
		}
	}
	const candidates = game.upgrades.filter(
		(u) => !(u instanceof OneTimeUpgrade) && u.value > 0,
	)
	if (candidates.length === 0) return null
	candidates.sort(
		(a, b) => b.value / effectiveCost(b, manualTypesPerSecond) - a.value / effectiveCost(a, manualTypesPerSecond),
	)
	if (game.score < candidates[0].cost) return null
	return candidates[0]
}

// Buy the affordable upgrade with the shortest completion key, no value/cost optimization
function naiveStrategy(game: Game, _revealedUpgrades: Set<string>, _manualTypesPerSecond: number): Upgrade | null {
	const candidates = game.upgrades.filter((u) => {
		if (u instanceof OneTimeUpgrade) return u.owned === 0 && game.score >= u.cost
		return game.score >= u.cost
	})
	if (candidates.length === 0) return null
	candidates.sort((a, b) => a.completionKey.length - b.completionKey.length)
	return candidates[0]
}

// Save for the revealed upgrade with the highest effectiveCost
function saverStrategy(game: Game, revealedUpgrades: Set<string>, manualTypesPerSecond: number): Upgrade | null {
	const visible = game.upgrades.filter(
		(u) => revealedUpgrades.has(u.name) && (u instanceof OneTimeUpgrade ? u.owned === 0 : true),
	)
	if (visible.length === 0) return null
	visible.sort((a, b) => effectiveCost(b, manualTypesPerSecond) - effectiveCost(a, manualTypesPerSecond))
	const target = visible[0]
	return game.score >= target.cost ? target : null
}

// Execute a purchase, advance simTime by the completion window, accumulate auto-score during that window.
// No manual typing score during the completion window (player is typing the purchase sequence).
function executePurchase(game: Game, upgrade: Upgrade, simTime: number, manualTypesPerSecond: number): number {
	game.score -= upgrade.cost
	if (upgrade instanceof OneTimeUpgrade) {
		upgrade.purchase() // sets owned=1 and calls onPurchase internally
		const timeCost = upgrade.completionKey.length / manualTypesPerSecond
		game.regenerateCompletionKeys()
		for (const u of game.upgrades) {
			if (u.owned > 0 && !(u instanceof OneTimeUpgrade) && u.value > 0) {
				game.score += u.value * u.owned * timeCost
			}
		}
		return simTime + timeCost
	}
	// Regular upgrade: completionKey is regenerated inside purchase() with the post-increment owned
	upgrade.purchase(game.characterPool)
	const timeCost = upgrade.completionKey.length / manualTypesPerSecond
	for (const u of game.upgrades) {
		if (u.owned > 0 && !(u instanceof OneTimeUpgrade) && u.value > 0) {
			game.score += u.value * u.owned * timeCost
		}
	}
	return simTime + timeCost
}

function simulate(strategy: Strategy, manualTypesPerSecond = 1, maxSimTimeSeconds = 10800): PurchaseEvent[] {
	const game = new Game()
	const events: PurchaseEvent[] = []
	const tickInterval = 0.1
	let simTime = 0
	let lastPurchaseTime = 0
	const revealedUpgrades = new Set<string>()

	while (simTime < maxSimTimeSeconds) {
		simTime += tickInterval

		// Track first-ever reveal (score may dip later, but upgrade stays known)
		for (const upgrade of game.upgrades) {
			if (!revealedUpgrades.has(upgrade.name) && game.score >= upgrade.cost * upgrade.thresholdMulti) {
				revealedUpgrades.add(upgrade.name)
			}
		}

		// Manual typing score (not accumulated during completion windows — modeled in executePurchase)
		game.score += game.scoreMulti * manualTypesPerSecond * tickInterval

		// Auto-score: continuous approximation avoids floating-point drift from discrete fire timestamps
		for (const upgrade of game.upgrades) {
			if (upgrade.owned > 0 && !(upgrade instanceof OneTimeUpgrade) && upgrade.value > 0) {
				game.score += upgrade.value * upgrade.owned * tickInterval
			}
		}

		const chosen = strategy(game, revealedUpgrades, manualTypesPerSecond)
		if (chosen !== null) {
			const purchaseCount = chosen instanceof OneTimeUpgrade ? 1 : chosen.owned + 1
			simTime = executePurchase(game, chosen, simTime, manualTypesPerSecond)
			events.push({
				upgradeName: chosen.name,
				timestamp: simTime,
				timeSincePrev: simTime - lastPurchaseTime,
				scorePerSec: calcScorePerSec(game, manualTypesPerSecond),
				purchaseCount,
			})
			lastPurchaseTime = simTime
		}

		if (game.upgrades.every((u) => u.owned > 0)) break
	}

	return events
}

function buildTable(events: PurchaseEvent[]): string[] {
	const lines: string[] = []
	lines.push(
		`${"Event".padEnd(40)} ${"Time".padStart(10)} ${"Delta".padStart(10)} ${"#".padStart(4)} ${"Score/sec".padStart(12)}`,
	)
	lines.push("-".repeat(80))
	for (const event of events) {
		const name = `${event.upgradeName} #${event.purchaseCount}`
		lines.push(
			`${name.padEnd(40)} ${formatTime(event.timestamp).padStart(10)} ${formatTime(event.timeSincePrev).padStart(10)} ${String(event.purchaseCount).padStart(4)} ${event.scorePerSec.toFixed(2).padStart(12)}`,
		)
	}
	const last = events[events.length - 1]
	lines.push("-".repeat(80))
	lines.push(`Total purchases: ${events.length}`)
	lines.push(`Total time: ${formatTime(last.timestamp)}`)
	return lines
}

function round(n: number): number {
	return Number(n.toFixed(1))
}

interface CompactStrategy {
	totalTime: number
	totalPurchases: number
	maxGap: number
	finalScorePerSec: number
	milestones: Record<string, number | null>
	upgradeCounts: Record<string, number>
	scorePerSecAt: Record<number, number>
}

function buildCompact(events: PurchaseEvent[], sampleInterval = 300): CompactStrategy {
	const last = events[events.length - 1]
	const milestones: Record<string, number | null> = {
		firstPurchase: events.length > 0 ? round(events[0].timestamp) : null,
		unlockLetters: null,
		unlockWords: null,
		firstTouchTyper: null,
		allOwned: last ? round(last.timestamp) : null,
	}
	const upgradeCounts: Record<string, number> = {}
	let maxGap = 0

	for (const event of events) {
		if (event.upgradeName === "Unlock Letters" && milestones.unlockLetters === null) {
			milestones.unlockLetters = round(event.timestamp)
		}
		if (event.upgradeName === "Unlock Words" && milestones.unlockWords === null) {
			milestones.unlockWords = round(event.timestamp)
		}
		if (event.upgradeName === "Touch typer" && milestones.firstTouchTyper === null) {
			milestones.firstTouchTyper = round(event.timestamp)
		}
		upgradeCounts[event.upgradeName] = (upgradeCounts[event.upgradeName] || 0) + 1
		if (event.timeSincePrev > maxGap) maxGap = event.timeSincePrev
	}

	const scorePerSecAt: Record<number, number> = {}
	const maxTime = last ? last.timestamp : 0
	let eventIdx = 0
	let currentRate = 0
	for (let t = sampleInterval; t <= maxTime; t += sampleInterval) {
		while (eventIdx < events.length && events[eventIdx].timestamp <= t) {
			currentRate = events[eventIdx].scorePerSec
			eventIdx++
		}
		scorePerSecAt[t] = Number(currentRate.toFixed(2))
	}

	return {
		totalTime: last ? round(last.timestamp) : 0,
		totalPurchases: events.length,
		maxGap: round(maxGap),
		finalScorePerSec: last ? last.scorePerSec : 0,
		milestones,
		upgradeCounts,
		scorePerSecAt,
	}
}

const STRATEGIES: Array<[string, Strategy]> = [
	["Greedy", greedyStrategy],
	["Naive", naiveStrategy],
	["Saver", saverStrategy],
]

describe("Balance simulation", () => {
	it("writes timing tables for all strategies", () => {
		const manualTypesPerSec = 1
		const output: string[] = ["", `=== Balance Simulation Results (${manualTypesPerSec} manual type/sec) ===`, ""]
		const compact: Record<string, unknown> = {
			meta: { manualTypesPerSec, maxTime: 10800, simDate: new Date().toISOString().slice(0, 10) },
			strategies: {} as Record<string, CompactStrategy>,
		}
		const strategies = compact.strategies as Record<string, CompactStrategy>

		for (const [name, strategy] of STRATEGIES) {
			const events = simulate(strategy, manualTypesPerSec)
			output.push(`--- ${name} Strategy ---`, "")
			output.push(...buildTable(events))
			output.push("")
			strategies[name] = buildCompact(events)
		}

		mkdirSync(RESULTS_DIR, { recursive: true })
		writeFileSync(resolve(RESULTS_DIR, "balance-simulation.txt"), output.join("\n"))
		writeFileSync(resolve(RESULTS_DIR, "balance-simulation.json"), JSON.stringify(compact, null, "\t"))

		expect(true).toBe(true)
	})

	for (const [name, strategy] of STRATEGIES) {
		describe(`${name} strategy`, () => {
			it("first purchase within 30 seconds", () => {
				const events = simulate(strategy)
				expect(events[0].timestamp, `${name}: first purchase at ${formatTime(events[0].timestamp)}`).toBeLessThan(30)
			})

			it("no gap between purchases exceeds 30 minutes", () => {
				const events = simulate(strategy)
				for (const event of events) {
					expect(
						event.timeSincePrev,
						`${name}: gap before ${event.upgradeName} #${event.purchaseCount} was ${formatTime(event.timeSincePrev)}`,
					).toBeLessThan(1800)
				}
			})

			it("completes within time limit", () => {
				const events = simulate(strategy)
				const totalTime = events[events.length - 1].timestamp
				// Bounds are ~2× the observed baseline: tight enough to catch a broken economy,
				// loose enough to survive small balance tweaks.
				// Observed: Greedy ~3600s, Naive ~3075s, Saver ~2580s
				const limit = name === "Greedy" ? 7200 : name === "Naive" ? 6200 : 5400
				expect(totalTime, `${name}: completed in ${formatTime(totalTime)}`).toBeLessThan(limit)
			})
		})
	}
})
