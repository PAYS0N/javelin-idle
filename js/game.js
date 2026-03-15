// @ts-check
class Game {

	constructor(gameObj = null) {
		/** @type {number} */
		this.score = 0
		/** @type {number} */
		this.scoreMulti = 1
		/** @type {string} */
		this.goal = ""
		/** @type {CharacterPool} */
		this.characterPool = new CharacterPool("$", getSymbols())
		/** @type {Upgrade[]} */
		this.upgrades = []
		if (gameObj) {
			this.createGameFromObj(gameObj)
		}
		else {
			this.createGameFromEmpty()
		}

	}

	createGameFromEmpty() {
		/** @type {number} */
		this.score = 0
		/** @type {number} */
		this.scoreMulti = 1
		/** @type {string} */
		this.goal = ""
		/** @type {CharacterPool} */
		this.characterPool = new CharacterPool("$", getSymbols())
		/** @type {Upgrade[]} */
		this.upgrades = []
		this.makeUpgrades()
	}

	/**
	 * 
	 * @param {object} gameObj 
	 */
	createGameFromObj(gameObj) {
		if ("score" in gameObj && typeof gameObj.score === "number") {
			this.score = Math.floor(gameObj.score)
		}
		else {
			throw new Error("Create game object invalid")
		}
		if ("scoreMulti" in gameObj && typeof gameObj.scoreMulti === "number") {
			this.scoreMulti = gameObj.scoreMulti
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
			const jsonPool = JSON.parse(gameObj.characterPool)
			this.characterPool = new CharacterPool(jsonPool[0], jsonPool[1])
		}
		else {
			throw new Error("Create game object invalid")
		}
		if ("upgrades" in gameObj && gameObj.upgrades instanceof Array) {
			this.upgrades = []
			this.makeUpgrades()
			let i = 0
			for (const upgrade of this.upgrades) {
				const gameUpgrade = JSON.parse(gameObj.upgrades[i])
				upgrade.cost = gameUpgrade.cost
				upgrade.owned = gameUpgrade.owned
				upgrade.key = gameUpgrade.key
				if (upgrade instanceof OneTimeUpgrade && upgrade.owned > 0) {
					console.log(upgrade)
					upgrade.onPurchase()
				}
				i++
			}
		}
		else {
			throw new Error("Create game object invalid")
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		const gameObj = {}
		gameObj.score = this.score
		gameObj.scoreMulti = this.scoreMulti
		gameObj.goal = this.goal
		gameObj.characterPool = this.characterPool.toString()
		/** @type {string[]} */
		gameObj.upgrades = []
		for (const upgrade of this.upgrades) {
			const upgradeObj = upgrade.toString()
			gameObj.upgrades.push(upgradeObj)
		}
		return JSON.stringify(gameObj)
	}

	/**
 * @returns {undefined}
 */
	makeUpgrades() {
		const twoFingerTyper = new Upgrade(
			"Two finger typer",
			20,
			3,
			3 / 4,
			this.characterPool.generateKey(3),
			3,
			1 / 3,
			.25)
		this.upgrades.push(twoFingerTyper)
		const practicedTwoFingerTyper = new Upgrade(
			"Practiced two finger typer",
			80,
			20,
			3 / 4,
			this.characterPool.generateKey(5),
			5,
			2 / 3,
			.75)
		this.upgrades.push(practicedTwoFingerTyper)
		const unlockLettersUpgrade = new OneTimeUpgrade(
			"Unlock Letters",
			500,
			4 / 5,
			this.characterPool.generateKey(10),
			() => this.addLetters()
		)
		this.upgrades.push(unlockLettersUpgrade)
		const newTouchTyper = new Upgrade(
			"New touch typer",
			1000,
			50,
			3 / 4,
			this.characterPool.generateKey(10),
			10,
			1,
			1.75)
		this.upgrades.push(newTouchTyper)
		// const unlockWords = new OneTimeUpgrade("Unlock top 100 words", 3000, 3/5, generateKey(15), addWords)
		// upgrades.push(unlockWords)
	}

	/**
 * @returns {undefined}
 */
	addLetters() {
		this.scoreMulti *= 1.5
		this.characterPool.addLetters()
	}

	/**
	 * 
	 * @param {string} input 
	 * @returns {Upgrade | undefined}
	 */
	returnUpgradeByKey(input) {
		for (const upgrade of this.upgrades) {
			if (input === upgrade.key) {
				return upgrade
			}
		}
	}

	/**
 * @returns {undefined}
 */
	scoreSuccess() {
		this.score += this.scoreMulti
	}

	/**
	 * @returns {string}
	 */
	updateGoal() {
		let symbolToType = this.characterPool.getRandomChar()
		this.goal = symbolToType
		return symbolToType
	}
}