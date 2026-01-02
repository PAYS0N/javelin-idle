// @ts-check

class Game {
	constructor() {
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
		/** @type {Upgrade[]} */
		this.lockedUpgrades = []
		this.makeUpgrades()
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
		/** @type {Upgrade[]} */
		this.lockedUpgrades = [...this.upgrades]
	}

	/**
 * @returns {undefined}
 */
	addLetters() {
		this.scoreMulti *= 1.5
		this.characterPool.addLetters()
	}

	/**
 * @param {String} input
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