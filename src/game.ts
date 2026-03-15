import { CharacterPool, getSymbols } from "./characterPool.js"
import { Upgrade, OneTimeUpgrade } from "./upgrade.js"

export class Game {
	score: number
	scoreMulti: number
	goal: string
	characterPool: CharacterPool
	upgrades: Upgrade[]

	constructor(gameObj: Record<string, unknown> | null = null) {
		this.score = 0
		this.scoreMulti = 1
		this.goal = ""
		this.characterPool = new CharacterPool("$")
		this.upgrades = []
		if (gameObj) {
			this.createGameFromObj(gameObj)
		}
		else {
			this.createGameFromEmpty()
		}
	}

	createGameFromEmpty(): void {
		this.score = 0
		this.scoreMulti = 1
		this.goal = ""
		this.characterPool = new CharacterPool("$")
		this.characterPool.addSet("symbols", getSymbols())
		this.upgrades = []
		this.makeUpgrades()
	}

	createGameFromObj(gameObj: Record<string, unknown>): void {
		if ("score" in gameObj && typeof gameObj.score === "number") {
			this.score = Math.floor(gameObj.score)
		}
		else {
			throw new Error("Create game object invalid")
		}
		let restoredScoreMulti = 1
		if ("scoreMulti" in gameObj && typeof gameObj.scoreMulti === "number") {
			this.scoreMulti = gameObj.scoreMulti
			restoredScoreMulti = gameObj.scoreMulti
		}
		else {
			throw new Error("Create game object invalid")
		}
		if ("goal" in gameObj && typeof gameObj.goal === "string") {
			this.goal = gameObj.goal
		}
		else {
			throw new Error("Create game object invalid")
		}
		if ("characterPool" in gameObj && typeof gameObj.characterPool === "string") {
			const jsonPool = JSON.parse(gameObj.characterPool) as unknown[]
			const purchaseChar = jsonPool[0] as string
			const secondElem = jsonPool[1] as Record<string, unknown>
			const firstValue = Object.values(secondElem)[0]
			if (firstValue === undefined || typeof firstValue === "string") {
				this.characterPool = CharacterPool.fromOldSave(purchaseChar, secondElem as Record<string, string>)
			} else {
				this.characterPool = CharacterPool.fromSave(
					purchaseChar,
					secondElem as Record<string, { chars: Record<string, string>, enabled: boolean }>
				)
			}
		}
		else {
			throw new Error("Create game object invalid")
		}
		if ("upgrades" in gameObj && gameObj.upgrades instanceof Array) {
			this.upgrades = []
			this.makeUpgrades()
			let i = 0
			for (const upgrade of this.upgrades) {
				const gameUpgrade = JSON.parse(gameObj.upgrades[i] as string) as Record<string, unknown>
				upgrade.cost = gameUpgrade.cost as number
				upgrade.owned = gameUpgrade.owned as number
				upgrade.key = gameUpgrade.key as string
				if (upgrade instanceof OneTimeUpgrade && upgrade.owned > 0) {
					upgrade.onPurchase()
				}
				i++
			}
			this.scoreMulti = restoredScoreMulti
		}
		else {
			throw new Error("Create game object invalid")
		}
	}

	toString(): string {
		const gameObj: Record<string, unknown> = {}
		gameObj.score = this.score
		gameObj.scoreMulti = this.scoreMulti
		gameObj.goal = this.goal
		gameObj.characterPool = this.characterPool.toString()
		const upgradeStrings: string[] = []
		for (const upgrade of this.upgrades) {
			const upgradeObj = upgrade.toString()
			upgradeStrings.push(upgradeObj)
		}
		gameObj.upgrades = upgradeStrings
		return JSON.stringify(gameObj)
	}

	makeUpgrades(): void {
		const usedKeys = new Set<string>()
		const twoFingerTyper = new Upgrade(
			"Two finger typer",
			20,
			3,
			3 / 4,
			this.characterPool.generateKey(3, usedKeys),
			3,
			1 / 3,
			.25)
		this.upgrades.push(twoFingerTyper)
		const practicedTwoFingerTyper = new Upgrade(
			"Practiced two finger typer",
			80,
			20,
			3 / 4,
			this.characterPool.generateKey(5, usedKeys),
			5,
			2 / 3,
			.75)
		this.upgrades.push(practicedTwoFingerTyper)
		const unlockLettersUpgrade = new OneTimeUpgrade(
			"Unlock Letters",
			500,
			4 / 5,
			this.characterPool.generateKey(10, usedKeys),
			() => this.addLetters(),
			10
		)
		this.upgrades.push(unlockLettersUpgrade)
		const newTouchTyper = new Upgrade(
			"New touch typer",
			1000,
			50,
			3 / 4,
			this.characterPool.generateKey(10, usedKeys),
			10,
			1,
			1.75)
		this.upgrades.push(newTouchTyper)
	}

	addLetters(): void {
		this.scoreMulti *= 1.5
		this.characterPool.addLetters()
	}

	regenerateAllKeys(): void {
		const usedKeys = new Set<string>()
		for (const upgrade of this.upgrades) {
			const length = upgrade.keyLength + (upgrade.owned * upgrade.keyIncrease)
			upgrade.key = this.characterPool.generateKey(length, usedKeys)
		}
	}

	findUpgradeByKey(input: string): Upgrade | undefined {
		for (const upgrade of this.upgrades) {
			if (input === upgrade.key) {
				return upgrade
			}
		}
	}

	scoreSuccess(): void {
		this.score += this.scoreMulti
	}

	updateGoal(): string {
		const symbolToType = this.characterPool.getRandomChar()
		this.goal = symbolToType
		return symbolToType
	}
}
