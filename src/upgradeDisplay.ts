import { safeQueryHTMLElement } from "./domUtils.js"
import { CharacterPool } from "./characterPool.js"
import { Upgrade } from "./upgrade.js"

export class UpgradeDisplay {
	upgrade: Upgrade
	purchaseHtml: HTMLElement
	autoTypeHtml: HTMLInputElement
	firstPurchase: boolean
	isRevealed: boolean
	maxDigitsToDisplay: number
	threshold: number
	pendingScore: number

	constructor(upgrade: Upgrade, displayHtml: HTMLElement, autoTypeHtml: HTMLInputElement, thresholdMulti: number) {
		this.upgrade = upgrade
		this.purchaseHtml = displayHtml
		this.autoTypeHtml = autoTypeHtml
		this.firstPurchase = true
		this.isRevealed = false
		this.maxDigitsToDisplay = 4
		this.threshold = this.upgrade.cost * thresholdMulti
		this.pendingScore = 0
	}

	display(): void {
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

	reveal(): void {
		this.purchaseHtml.classList.remove("unavailable")
	}

	hide(): void {
		this.purchaseHtml.classList.add("unavailable")
	}

	displayAutoScore(characterPool: CharacterPool): number {
		this.pendingScore += this.upgrade.value
		let symbolsToAdd = this.upgrade.value * 4
		const autoInput = this.autoTypeHtml
		const spaceRemaining = this.maxDigitsToDisplay - autoInput.value.length
		let scoreGain = 0
		if (symbolsToAdd >= spaceRemaining) {
			symbolsToAdd = (symbolsToAdd - spaceRemaining) % this.maxDigitsToDisplay
			autoInput.value = ""
			scoreGain = this.pendingScore
			this.pendingScore = 0
			this.showInputSuccess()
		}
		for (let i = 0; i < symbolsToAdd; i++) {
			autoInput.value += characterPool.getRandomChar()
		}
		return scoreGain
	}

	showInputSuccess(): void {
		this.autoTypeHtml.classList.add('green-background')

		setTimeout(() => {
			this.autoTypeHtml.classList.remove('green-background')
		}, 200)
	}
}
