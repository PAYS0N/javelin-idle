import { safeQueryHTMLElement } from "./domUtils.js"
import { Game } from "./game.js"
import { Upgrade } from "./upgrade.js"
import { UpgradeDisplay } from "./upgradeDisplay.js"

export class GameDisplay {
	game: Game
	scoreDisplay: HTMLElement
	userInput: HTMLInputElement
	goalDisplay: HTMLElement
	upgradesDisplay: HTMLElement
	settingsPanel: HTMLElement
	charSetToggles: HTMLElement
	upgradeDisplays: UpgradeDisplay[]
	lockedUpgradeDisplays: UpgradeDisplay[]

	constructor(game: Game) {
		this.game = game
		this.scoreDisplay = safeQueryHTMLElement(".score-value")
		this.userInput = document.querySelector(".typing-input") as HTMLInputElement
		this.goalDisplay = safeQueryHTMLElement(".goal-value")
		this.upgradesDisplay = safeQueryHTMLElement(".upgrades")
		this.settingsPanel = safeQueryHTMLElement(".game-settings")
		this.charSetToggles = safeQueryHTMLElement(".char-set-toggles")
		this.upgradeDisplays = this.createDisplays(game.upgrades)
		this.lockedUpgradeDisplays = [...this.upgradeDisplays]
	}

	createDisplays(upgrades: Upgrade[]): UpgradeDisplay[] {
		const autoInputs = safeQueryHTMLElement(".auto-inputs")
		while (this.upgradesDisplay.firstChild) {
			this.upgradesDisplay.removeChild(this.upgradesDisplay.firstChild)
		}
		while (autoInputs.firstChild) {
			autoInputs.removeChild(autoInputs.firstChild)
		}
		const displays: UpgradeDisplay[] = []
		for (const upgrade of upgrades) {
			displays.push(this.createDisplayFromUpgrade(upgrade))
		}
		return displays
	}

	migrateDisplays(upgrades: Upgrade[]): void {
		let i = 0
		for (const display of this.upgradeDisplays) {
			display.upgrade = upgrades[i]
			display.isRevealed = false
			display.threshold = display.upgrade.cost
			i++
		}
	}

	createDisplayFromUpgrade(upgrade: Upgrade): UpgradeDisplay {
		const display = new UpgradeDisplay(
			upgrade,
			this.createUpdateHtml(upgrade.name),
			this.createDisplayHTML(),
			upgrade.thresholdMulti
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
			safeQueryHTMLElement('.multi-display').classList.remove("unavailable")
			safeQueryHTMLElement('.multi-value').textContent = String(this.game.scoreMulti)
		}
	}

	showInputSuccess(): void {
		this.userInput.classList.add('green-background')

		setTimeout(() => {
			this.userInput.classList.remove('green-background')
		}, 200)
	}

	displayGoal(symbol: string): void {
		while (this.goalDisplay.firstChild) {
			this.goalDisplay.removeChild(this.goalDisplay.firstChild)
		}
		const div = document.createElement("div")
		div.classList.add("char-token")
		div.textContent = symbol
		this.goalDisplay.appendChild(div)
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
					const success = this.game.characterPool.toggleSet(name, checkbox.checked)
					if (!success) {
						checkbox.checked = true
						return
					}
					this.game.regenerateAllKeys()
					const nextGoal = this.game.updateGoal()
					this.displayGoal(nextGoal)
				})

				const labelText = document.createElement("span")
				labelText.textContent = name.charAt(0).toUpperCase() + name.slice(1)

				label.appendChild(checkbox)
				label.appendChild(labelText)
				this.charSetToggles.appendChild(label)
			} else {
				const checkbox = existing as HTMLInputElement
				checkbox.checked = this.game.characterPool.isSetEnabled(name)
			}
		}
	}

	createUpdateHtml(name: string): HTMLDivElement {
		const upgrade = document.createElement('div')
		upgrade.classList.add("upgrade")
		upgrade.classList.add("unavailable")

		const upgradeName = document.createElement('div')
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

	createDisplayHTML(): HTMLDivElement {
		const inputs = safeQueryHTMLElement(".auto-inputs")
		const input = document.createElement("div")
		input.classList.add("auto-input")
		input.classList.add("unavailable")
		inputs.appendChild(input)
		return input
	}
}
