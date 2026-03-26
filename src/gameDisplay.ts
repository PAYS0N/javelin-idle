import {
	clearChildren,
	createCharToken,
	flashClass,
	safeQueryHTMLElement,
	safeQueryHTMLElementInput,
} from "./domUtils.js"
import type { Game } from "./game.js"
import type { Upgrade } from "./upgrade.js"
import { UpgradeDisplay } from "./upgradeDisplay.js"

export class GameDisplay {
	game: Game
	scoreDisplay: HTMLElement
	userInput: HTMLInputElement
	goalDisplay: HTMLElement
	goalTitle: HTMLElement
	completionProgress: HTMLElement
	upgradesDisplay: HTMLElement
	settingsPanel: HTMLElement
	charSetToggles: HTMLElement
	upgradeDisplays: UpgradeDisplay[]
	lockedUpgradeDisplays: UpgradeDisplay[]
	onSetToggled: ((name: string, enabled: boolean) => boolean) | null
	private renderedSetCount: number

	constructor(game: Game) {
		this.game = game
		this.scoreDisplay = safeQueryHTMLElement(".score-value")
		this.userInput = safeQueryHTMLElementInput(".typing-input")
		this.goalDisplay = safeQueryHTMLElement(".goal-value")
		this.goalTitle = safeQueryHTMLElement(".goal-title")
		this.completionProgress = document.createElement("div")
		this.completionProgress.classList.add("completion-progress")
		this.completionProgress.classList.add("unavailable")
		safeQueryHTMLElement(".goal-display").appendChild(this.completionProgress)
		this.upgradesDisplay = safeQueryHTMLElement(".upgrades")
		this.settingsPanel = safeQueryHTMLElement(".game-settings")
		this.charSetToggles = safeQueryHTMLElement(".char-set-toggles")
		this.onSetToggled = null
		this.renderedSetCount = 0
		this.upgradeDisplays = this.createDisplays(game.upgrades)
		this.lockedUpgradeDisplays = [...this.upgradeDisplays]
	}

	createDisplays(upgrades: Upgrade[]): UpgradeDisplay[] {
		const autoInputs = safeQueryHTMLElement(".auto-inputs")
		clearChildren(this.upgradesDisplay)
		clearChildren(autoInputs)
		const displays: UpgradeDisplay[] = []
		for (const upgrade of upgrades) {
			displays.push(this.createDisplayFromUpgrade(upgrade))
		}
		return displays
	}

	createDisplayFromUpgrade(upgrade: Upgrade): UpgradeDisplay {
		const display = new UpgradeDisplay(
			upgrade,
			this.createUpgradeCardHtml(upgrade.name),
			this.createDisplayHTML(),
			upgrade.thresholdMulti,
		)
		return display
	}

	getDisplayByName(input: string): UpgradeDisplay {
		for (const display of this.upgradeDisplays) {
			if (input === display.upgrade.name) {
				return display
			}
		}
		throw new Error(`No display found with upgrade with key ${input}`)
	}

	displayScore(): void {
		this.scoreDisplay.textContent = String(Math.floor(this.game.score))
		if (this.game.scoreMulti > 1) {
			safeQueryHTMLElement(".multi-display").classList.remove("unavailable")
			safeQueryHTMLElement(".multi-value").textContent = String(this.game.scoreMulti)
		}
	}

	showInputSuccess(): void {
		flashClass(this.userInput, "green-background", 200)
	}

	displayGoal(symbol: string): void {
		clearChildren(this.goalDisplay)
		this.goalDisplay.appendChild(createCharToken(symbol))
	}

	showCompletionChar(char: string): void {
		this.goalTitle.textContent = "Purchase: "
		clearChildren(this.goalDisplay)
		this.goalDisplay.appendChild(createCharToken(char))
	}

	showCompletionProgress(current: number, total: number): void {
		this.completionProgress.classList.remove("unavailable")
		this.completionProgress.textContent = `${current}/${total}`
	}

	exitCompletionMode(): void {
		this.goalTitle.textContent = "Type: "
		this.completionProgress.classList.add("unavailable")
		this.displayGoal(this.game.goal)
	}

	displayUpgrades(): void {
		for (const display of this.upgradeDisplays) {
			display.display()
		}
	}

	getValue(): string {
		return this.userInput.value
	}

	setValue(value: string): void {
		this.userInput.value = value
	}

	appendToInput(text: string): void {
		this.userInput.value += text
	}

	focusInput(): void {
		this.userInput.focus()
	}

	clearError(): void {
		this.userInput.value = ""
		this.userInput.classList.remove("error-state")
	}

	hasError(): boolean {
		return this.userInput.classList.contains("error-state")
	}

	showError(text: string): void {
		this.userInput.classList.add("error-state")
		this.userInput.value = text
	}

	revealUpgrades(): void {
		for (const display of this.lockedUpgradeDisplays) {
			if (this.game.score >= display.threshold) {
				display.reveal()
				this.lockedUpgradeDisplays.splice(this.lockedUpgradeDisplays.indexOf(display), 1)
			}
		}
	}

	updateSettingsPanel(): void {
		const setNames = this.game.characterPool.getSetNames()
		if (setNames.length < 2) {
			this.settingsPanel.classList.add("unavailable")
			return
		}
		if (setNames.length === this.renderedSetCount) {
			return
		}
		this.renderedSetCount = setNames.length
		this.settingsPanel.classList.remove("unavailable")
		for (const name of setNames) {
			const existing = this.charSetToggles.querySelector(`[data-set-name="${name}"]`)
			if (!existing) {
				const label = document.createElement("label")
				label.classList.add("char-set-toggle")

				const checkbox = document.createElement("input")
				checkbox.type = "checkbox"
				checkbox.dataset.setName = name
				checkbox.checked = this.game.characterPool.isSetEnabled(name)
				checkbox.addEventListener("change", () => {
					if (this.onSetToggled) {
						const success = this.onSetToggled(name, checkbox.checked)
						if (!success) {
							checkbox.checked = true
						}
					}
				})

				const labelText = document.createElement("div")
				labelText.textContent = name.charAt(0).toUpperCase() + name.slice(1)

				label.appendChild(checkbox)
				label.appendChild(labelText)
				this.charSetToggles.appendChild(label)
			}
		}
	}

	createUpgradeCardHtml(name: string): HTMLDivElement {
		const upgrade = document.createElement("div")
		upgrade.classList.add("upgrade")
		upgrade.classList.add("unavailable")

		const upgradeName = document.createElement("div")
		upgradeName.classList.add("upgrade-name")
		upgradeName.textContent = name
		upgrade.appendChild(upgradeName)

		const upgradeCost = this.createValueDisplayHtml("cost", "Cost: ")
		upgrade.appendChild(upgradeCost)

		const upgradeKey = this.createValueDisplayHtml("key", "Purchase: ")
		upgrade.appendChild(upgradeKey)

		const upgradeOwned = this.createValueDisplayHtml("owned", "Owned: ")
		upgradeOwned.classList.add("unavailable")
		upgrade.appendChild(upgradeOwned)

		const charPerSec = this.createValueDisplayHtml("chps", "Ch/s: ")
		charPerSec.classList.add("unavailable")
		upgrade.appendChild(charPerSec)

		this.upgradesDisplay.appendChild(upgrade)
		return upgrade
	}

	createValueDisplayHtml(phrase: string, text: string): HTMLDivElement {
		const upgradeCost = document.createElement("div")
		upgradeCost.classList.add(`upgrade-${phrase}`)

		const costTitle = document.createElement("div")
		costTitle.classList.add(`${phrase}-title`)
		costTitle.textContent = text
		upgradeCost.appendChild(costTitle)

		const costValue = document.createElement("div")
		costValue.classList.add(`${phrase}-value`)
		upgradeCost.appendChild(costValue)
		return upgradeCost
	}

	createDisplayHTML(): HTMLDivElement {
		const inputs = safeQueryHTMLElement(".auto-inputs")
		const input = document.createElement("div")
		input.classList.add("auto-input")
		input.classList.add("unavailable")
		inputs.appendChild(input)
		return input
	}
}
