import type { CharacterPool } from "./characterPool.js"
import { clearChildren, createCharToken, flashClass, safeQueryHTMLElement } from "./domUtils.js"
import type { Upgrade } from "./upgrade.js"

export class UpgradeDisplay {
	upgrade: Upgrade
	purchaseHtml: HTMLElement
	autoTypeHtml: HTMLElement
	ownedStatsShown: boolean
	maxDigitsToDisplay: number
	threshold: number
	pendingScore: number

	constructor(upgrade: Upgrade, displayHtml: HTMLElement, autoTypeHtml: HTMLElement, thresholdMulti: number) {
		this.upgrade = upgrade
		this.purchaseHtml = displayHtml
		this.autoTypeHtml = autoTypeHtml
		this.ownedStatsShown = false
		this.maxDigitsToDisplay = 4
		this.threshold = this.upgrade.cost * thresholdMulti
		this.pendingScore = 0
	}

	display(): void {
		safeQueryHTMLElement(".cost-value", this.purchaseHtml).textContent = String(this.upgrade.cost)
		this.renderKey(safeQueryHTMLElement(".key-value", this.purchaseHtml), this.upgrade.key)
		safeQueryHTMLElement(".chps-value", this.purchaseHtml).textContent = String(this.upgrade.value * this.upgrade.owned)
		safeQueryHTMLElement(".owned-value", this.purchaseHtml).textContent = String(this.upgrade.owned)
		if (this.upgrade.owned > 0 && !this.ownedStatsShown) {
			safeQueryHTMLElement(".upgrade-owned", this.purchaseHtml).classList.remove("unavailable")
			safeQueryHTMLElement(".upgrade-chps", this.purchaseHtml).classList.remove("unavailable")
			if (this.upgrade.value > 0) {
				this.autoTypeHtml.classList.remove("unavailable")
			}
			this.ownedStatsShown = true
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
		const spaceRemaining = this.maxDigitsToDisplay - autoInput.childElementCount
		let scoreGain = 0
		if (symbolsToAdd >= spaceRemaining) {
			symbolsToAdd = (symbolsToAdd - spaceRemaining) % this.maxDigitsToDisplay
			clearChildren(autoInput)
			scoreGain = this.pendingScore
			this.pendingScore = 0
			this.showInputSuccess()
		}
		for (let i = 0; i < symbolsToAdd; i++) {
			autoInput.appendChild(createCharToken(characterPool.getRandomSingleChar()))
		}
		return scoreGain
	}

	private renderKey(el: HTMLElement, key: string): void {
		clearChildren(el)
		for (const char of key) {
			el.appendChild(createCharToken(char))
		}
	}

	showInputSuccess(): void {
		flashClass(this.autoTypeHtml, "green-background", 200)
	}
}
