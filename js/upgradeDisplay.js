// @ts-check

class upgradeDisplay {
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
		this.safeQueryHTMLElement(this.purchaseHtml, ".cost-value").textContent = String(this.upgrade.cost)
		this.safeQueryHTMLElement(this.purchaseHtml, ".key-value").textContent = String(this.upgrade.key)
		this.safeQueryHTMLElement(this.purchaseHtml, ".chps-value").textContent = String(this.upgrade.value * this.upgrade.owned)
		this.safeQueryHTMLElement(this.purchaseHtml, ".owned-value").textContent = String(this.upgrade.owned)
		if (this.upgrade.owned > 0 && !this.isRevealed) {
			this.safeQueryHTMLElement(this.purchaseHtml, ".upgrade-owned").classList.remove("unavailable")
			this.safeQueryHTMLElement(this.purchaseHtml, ".upgrade-chps").classList.remove("unavailable")
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
 * @param {HTMLElement} base 
 * @param {string} identifier 
 * @returns {HTMLElement}
 */
	safeQueryHTMLElement(base, identifier) {
		const element = base.querySelector(identifier)
		if (element instanceof HTMLElement) {
			return element;
		}
		else {
			throw new TypeError(`${identifier} not found, or not an HTMLElement.`)
		}
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
		this.autoTypeHtml.classList.add('green-background');

		setTimeout(() => {
			this.autoTypeHtml.classList.remove('green-background');
		}, 200);
	}

}