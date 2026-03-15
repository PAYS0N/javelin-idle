// @ts-check

class UpgradeDisplay {
	/**
	 *
	 * @param {Upgrade} upgrade
	 * @param {HTMLElement} displayHtml
	 * @param {HTMLInputElement} autoTypeHtml
	 * @param {number} thresholdMulti
	 */
	constructor(upgrade, displayHtml, autoTypeHtml, thresholdMulti) {
		this.upgrade = upgrade
		this.purchaseHtml = displayHtml
		this.autoTypeHtml = autoTypeHtml
		this.firstPurchase = true
		this.isRevealed = false
		this.maxDigitsToDisplay = 4
		this.threshold = this.upgrade.cost * thresholdMulti

	}

	display() {
		safeQueryHTMLElement(".cost-value", this.purchaseHtml).textContent = String(this.upgrade.cost)
		safeQueryHTMLElement(".key-value", this.purchaseHtml).textContent = String(this.upgrade.key)
		safeQueryHTMLElement(".chps-value", this.purchaseHtml).textContent = String(this.upgrade.value * this.upgrade.owned)
		safeQueryHTMLElement(".owned-value", this.purchaseHtml).textContent = String(this.upgrade.owned)
		if (this.upgrade.owned > 0 && !this.isRevealed) {
			safeQueryHTMLElement(".upgrade-owned", this.purchaseHtml).classList.remove("unavailable")
			safeQueryHTMLElement(".upgrade-chps", this.purchaseHtml).classList.remove("unavailable")
			this.autoTypeHtml.classList.remove("unavailable")
			this.isRevealed = true
		}
	}

	reveal() {
		this.purchaseHtml.classList.remove("unavailable")
	}

	hide() {
		this.purchaseHtml.classList.add("unavailable")
	}

	/**
	 *
	 * @param {CharacterPool} characterPool
	 */
	displayAutoScore(characterPool) {
		let symbolsToAdd = this.upgrade.value * 4
		const autoInput = this.autoTypeHtml
		let spaceRemaining = this.maxDigitsToDisplay - autoInput.value.length
		if (symbolsToAdd >= spaceRemaining) {
			symbolsToAdd = (symbolsToAdd - spaceRemaining) % this.maxDigitsToDisplay
			autoInput.value = ""
			this.showInputSuccess()
		}
		for (let i = 0; i < symbolsToAdd; i++) {
			autoInput.value += characterPool.getRandomChar()
		}
	}

	showInputSuccess() {
		this.autoTypeHtml.classList.add('green-background')

		setTimeout(() => {
			this.autoTypeHtml.classList.remove('green-background')
		}, 200)
	}

}
