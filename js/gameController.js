// @ts-check

class GameController {
	/**
	 * 
	 * @param {Game} game 
	 * @param {GameDisplay} display 
	 */
	constructor(game, display) {
		/** @type {Game} */
		this.game = game
		/** @type {GameDisplay} */
		this.display = display
	}

	doGameSetup() {
		this.display.userInput.addEventListener("keydown", (e) => { this.verifyInput(e) })
		this.runGameLogic()
	}

	runGameLogic() {
		setInterval(() => {
			this.manageUpgrades()
			this.display.revealUpgrades()
			this.display.displayUpgrades()
			this.display.displayScore()
		}, 100)
	}

	manageUpgrades() {
		for (const upgrade of this.game.upgrades) {
			if (!upgrade.started && upgrade.owned > 0) {
				this.runAutoScoring(upgrade)
				upgrade.started = true
			}
		}
	}

	/**
	 * 
	 * @param {Upgrade} upgrade 
	 */
	runAutoScoring(upgrade) {
		this.game.score = this.game.score + upgrade.value
		this.display.getDisplayByKey(upgrade.key).displayAutoScore(this.game.characterPool)
		setTimeout(() => this.runAutoScoring(upgrade), 1000 / upgrade.owned)
	}


	/**
	 * 
	 * @param {KeyboardEvent} e 
	 * @returns {string}
	 */
	getInput(e) {
		return this.display.getValue() + this.game.characterPool.getSymbolByKey(e.key)
	}

	/**
	 * 
	 * @param {KeyboardEvent} e 
	 * @returns {void}
	 */
	verifyInput(e) {
		if (this.display.userInput.classList.contains("error-state")) {
			this.display.userInput.value = ""
			this.display.userInput.classList.remove("error-state")
		}
		let input = this.getInput(e)
		if (input === "ababvoidgloom*") {
			e.preventDefault()
			this.game.score = this.game.score + 1000
			return this.inputCorrect()
		}
		if (this.isInputScorable(input)) {
			e.preventDefault()
			return this.inputCorrect()
		}
		else {
			const upgrade = this.game.returnUpgradeByKey(input)
			if (upgrade) {
				e.preventDefault()
				this.attemptUpgradePurchase(upgrade)
				if (upgrade instanceof OneTimeUpgrade) {
					this.display.getDisplayByKey(input).hide()
				}
				return
			}
		}
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
			e.preventDefault()
			this.display.userInput.value += this.game.characterPool.getSymbolByKey(e.key)
		}
	}

	inputCorrect() {
		this.display.showInputSuccess()
		this.game.scoreSuccess()
		this.display.setValue("")
		this.display.displayScore()
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
	}

	/**
	 * 
	 * @param {string} input 
	 * @returns {Boolean}
	 */
	isInputScorable(input) {
		return input === this.game.goal
	}


	doPageSetup() {
		this.display.userInput.focus()
		this.display.displayScore()
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
	}

	/**
	 * 
	 * @param {Upgrade} upgrade 
	 */
	attemptUpgradePurchase(upgrade) {
		if (this.game.score >= upgrade.cost) {
			this.display.showInputSuccess()
			this.display.setValue("")
			this.game.score -= upgrade.cost
			this.display.displayScore()
			upgrade.purchase(this.game.characterPool)
		}
		else {
			this.display.userInput.classList.add("error-state")
			this.display.userInput.value = "---"
		}
	}
}