import { CharacterPool } from "./characterPool.js"

export class Upgrade {
	name: string
	cost: number
	costIncrease: number
	thresholdMulti: number
	owned: number
	key: string
	keyLength: number
	keyIncrease: number
	value: number

	constructor(name: string, cost: number, costIncrease: number, multi: number, key: string, keyLength: number, keyIncrease: number, value: number) {
		this.name = name
		this.cost = cost
		this.costIncrease = costIncrease
		this.thresholdMulti = multi
		this.owned = 0
		this.key = key
		this.keyLength = keyLength
		this.keyIncrease = keyIncrease
		this.value = value
	}

	purchase(characterPool: CharacterPool, existingKeys: Set<string> = new Set()): void {
		this.owned += 1
		this.cost += this.costIncrease
		this.key = characterPool.generateKey(this.keyLength + (this.owned * this.keyIncrease), existingKeys)
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

	constructor(name: string, cost: number, multi: number, key: string, onPurchase: () => void, keyLength = 0) {
		super(name, cost, 0, multi, key, keyLength, 0, 0)
		this.onPurchase = onPurchase
	}

	purchase(): void {
		this.owned = 1
		this.onPurchase()
	}
}
