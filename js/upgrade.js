// @ts-check

class Upgrade {

	/**
	 * 
	 * @param {string} name 
	 * @param {number} cost 
	 * @param {number} costIncrease 
	 * @param {number} multi 
	 * @param {string} key 
	 * @param {number} keyLength 
	 * @param {number} keyIncrease 
	 * @param {number} value 
	 */
	constructor(name, cost, costIncrease, multi, key, keyLength, keyIncrease, value) {
		this.name = name
		this.cost = cost
		this.costIncrease = costIncrease
		this.thresholdMulti = multi
		this.owned = 0
		this.key = key
		this.keyLength = keyLength
		this.keyIncrease = keyIncrease
		this.value = value
		this.started = false
	}

	/**
	 * 
	 * @param {CharacterPool} characterPool 
	 */
	purchase(characterPool) {
		this.owned += 1;
		this.cost += this.costIncrease
		this.key = characterPool.generateKey(this.keyLength + (this.owned * this.keyIncrease))
	}
}

class OneTimeUpgrade extends Upgrade {
	/**
	 * 
	 * @param {string} name 
	 * @param {number} cost 
	 * @param {string} key 
	 * @param {number} multi 
	 * @param {function} onPurchase 
	 */
	constructor(name, cost, multi, key, onPurchase) {
		super(name, cost, 0, multi, key, 0, 0, 0)
		this.onPurchase = onPurchase
	}

	purchase() {
		this.onPurchase()
	}
}