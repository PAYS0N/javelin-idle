// @ts-check

class GameDisplay {
	/**
	 *
	 * @param {Game} game
	 */
	constructor(game) {
		/** @type {Game} */
		this.game = game
		/** @type {HTMLElement} */
		this.scoreDisplay = safeQueryHTMLElement(".score-value")
		/** @type {HTMLInputElement} */
		this.userInput = safeQueryHTMLElementInput(".typing-input")
		/** @type {HTMLElement} */
		this.goalDisplay = safeQueryHTMLElement(".goal-value")
		/** @type {HTMLElement} */
		this.upgradesDisplay = safeQueryHTMLElement(".upgrades")
		/** @type {UpgradeDisplay[]} */
		this.upgradeDisplays = this.createDisplays(game.upgrades)
		/** @type {UpgradeDisplay[]} */
		this.lockedUpgradeDisplays = [...this.upgradeDisplays]
	}

	/**
	 *
	 * @param {Upgrade[]} upgrades
	 * @returns {UpgradeDisplay[]}
	 */
	createDisplays(upgrades) {
		let displays = []
		for (const upgrade of upgrades) {
			displays.push(this.createDisplayFromUpgrade(upgrade))
		}
		return displays
	}

	/**
	 *
	 * @param {Upgrade[]} upgrades
	 */
	migrateDisplays(upgrades) {
		let i = 0
		for (const display of this.upgradeDisplays) {
			display.upgrade = upgrades[i]
			display.isRevealed = false
			display.threshold = display.upgrade.cost
			i++
		}
	}

	/**
	 *
	 * @param {Upgrade} upgrade
	 */
	createDisplayFromUpgrade(upgrade) {
		const display = new UpgradeDisplay(
			upgrade,
			this.createUpdateHtml(upgrade.name),
			this.createDisplayHTML(),
			upgrade.thresholdMulti
		)
		return display
	}

	/**
	 *
	 * @param {string} input
	 * @returns {UpgradeDisplay}
	 */
	getDisplayByName(input) {
		for (const display of this.upgradeDisplays) {
			if (input === display.upgrade.name) {
				return display
			}
		}
		throw new Error(`No display found with upgrade with key ${input}`)
	}

	displayScore() {
		this.scoreDisplay.textContent = String(Math.floor(this.game.score))
		if (this.game.scoreMulti > 1) {
			safeQueryHTMLElement('.multi-display').classList.remove("unavailable")
			safeQueryHTMLElement('.multi-value').textContent = String(this.game.scoreMulti)
		}
	}

	showInputSuccess() {
		this.userInput.classList.add('green-background')

		setTimeout(() => {
			this.userInput.classList.remove('green-background')
		}, 200)
	}

	/**
	 *
	 * @param {string} symbol
	 */
	displayGoal(symbol) {
		this.goalDisplay.textContent = symbol
	}

	displayUpgrades() {
		for (const display of this.upgradeDisplays) {
			display.display()
		}
	}

	/**
	 *
	 * @returns {string}
	 */
	getValue() {
		return this.userInput.value
	}

	/**
	 *
	 * @param {string} value
	 */
	setValue(value) {
		this.userInput.value = value
	}

	revealUpgrades() {
		for (const display of this.lockedUpgradeDisplays) {
			if (this.game.score >= display.threshold) {
				display.reveal()
				this.lockedUpgradeDisplays.splice(this.lockedUpgradeDisplays.indexOf(display), 1)
			}
		}
	}

	/**
	 *
	 * @returns {HTMLDivElement}
	 * @param {string} name
	 */
	createUpdateHtml(name) {
		const upgrade = document.createElement('div')
		upgrade.classList.add("upgrade")
		upgrade.classList.add("unavailable")

		const upgradeName = document.createElement('div')
		upgradeName.classList.add("upgrade-name")
		upgradeName.textContent = name
		upgrade.appendChild(upgradeName)

		let upgradeCost = this.createValueDisplayHtml("cost", "Cost: ")
		upgrade.appendChild(upgradeCost)

		let upgradeKey = this.createValueDisplayHtml("key", "Purchase: ")
		upgrade.appendChild(upgradeKey)

		let upgradeOwned = this.createValueDisplayHtml("owned", "Owned: ")
		upgradeOwned.classList.add("unavailable")
		upgrade.appendChild(upgradeOwned)

		let charPerSec = this.createValueDisplayHtml("chps", "Ch/s: ")
		charPerSec.classList.add("unavailable")
		upgrade.appendChild(charPerSec)

		this.upgradesDisplay.appendChild(upgrade)
		return upgrade
	}

	/**
	 *
	 * @param {string} phrase
	 * @param {string} text
	 * @returns
	 */
	createValueDisplayHtml(phrase, text) {
		const upgradeCost = document.createElement('div')
		upgradeCost.classList.add("upgrade-" + phrase)

		const costTitle = document.createElement('div')
		costTitle.classList.add(phrase + "-title")
		costTitle.textContent = text
		upgradeCost.appendChild(costTitle)

		const costValue = document.createElement('div')
		costValue.classList.add(phrase + "-value")
		upgradeCost.appendChild(costValue)
		return upgradeCost
	}

	createDisplayHTML() {
		const inputs = safeQueryHTMLElement(".auto-inputs")
		const input = document.createElement("input")
		input.classList.add("auto-input")
		input.classList.add("unavailable")
		inputs.appendChild(input)
		return input
	}

}
