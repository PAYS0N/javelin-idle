import { CharacterPool } from "./characterPool.js"

export class Upgrade {
	name: string
	cost: number
	costIncrease: number
	thresholdMulti: number
	owned: number
	key: string
	completionKey: string[]
	keyLength: number
	keyIncrease: number
	value: number

	constructor(name: string, cost: number, costIncrease: number, multi: number, key: string, completionKey: string[], keyLength: number, keyIncrease: number, value: number) {
		this.name = name
		this.cost = cost
		this.costIncrease = costIncrease
		this.thresholdMulti = multi
		this.owned = 0
		this.key = key
		this.completionKey = completionKey
		this.keyLength = keyLength
		this.keyIncrease = keyIncrease
		this.value = value
	}

	purchase(characterPool: CharacterPool): void {
		this.owned += 1
		this.cost += this.costIncrease
		this.completionKey = characterPool.generateCompletionKey(this.keyLength + (this.owned * this.keyIncrease))
	}

	toString(): string {
		const upgradeObj: Record<string, unknown> = {}
		upgradeObj.cost = this.cost
		upgradeObj.owned = this.owned
		upgradeObj.key = this.key
		return JSON.stringify(upgradeObj)
	}
}

export class OneTimeUpgrade extends Upgrade {
	onPurchase: () => void

	constructor(name: string, cost: number, multi: number, key: string, completionKey: string[], onPurchase: () => void, keyLength = 0) {
		super(name, cost, 0, multi, key, completionKey, keyLength, 0, 0)
		this.onPurchase = onPurchase
	}

	purchase(): void {
		this.owned = 1
		this.onPurchase()
	}
}
