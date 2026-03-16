import { Game } from "./game.js"
import { GameDisplay } from "./gameDisplay.js"
import { Upgrade, OneTimeUpgrade } from "./upgrade.js"

export class GameController {
	game: Game
	display: GameDisplay
	private pendingValidation: ReturnType<typeof setTimeout> | null

	constructor(game: Game, display: GameDisplay) {
		this.game = game
		this.display = display
		this.pendingValidation = null
	}

	doGameSetup(): void {
		this.display.userInput.addEventListener("keydown", (e) => { this.verifyInput(e) })
		this.display.onSetToggled = (name, enabled) => this.handleSetToggle(name, enabled)
		this.display.onSpacingToggled = (enabled) => this.handleSpacingToggle(enabled)
		this.runGameLogic()
	}

	handleSpacingToggle(enabled: boolean): void {
		this.game.spacingMode = enabled
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
	}

	handleSetToggle(name: string, enabled: boolean): boolean {
		const success = this.game.characterPool.toggleSet(name, enabled)
		if (!success) {
			return false
		}
		this.game.regenerateAllKeys()
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
		return true
	}

	runGameLogic(): void {
		let lastTick = 0
		const displayTicks = new Map<string, number>()
		const tick = (timestamp: number): void => {
			const delta = timestamp - lastTick
			if (delta >= 100) {
				lastTick = timestamp
				for (const upgrade of this.game.upgrades) {
					if (upgrade.owned > 0 && !(upgrade instanceof OneTimeUpgrade)) {
						const displayInterval = 1000 / upgrade.owned
						const lastDisplay = displayTicks.get(upgrade.name) ?? 0
						if (timestamp - lastDisplay >= displayInterval) {
							displayTicks.set(upgrade.name, timestamp)
							const scoreGain = this.display.getDisplayByName(upgrade.name).displayAutoScore(this.game.characterPool)
							this.game.score += scoreGain
						}
					}
				}
				this.display.revealUpgrades()
				this.display.displayUpgrades()
				this.display.displayScore()
				this.display.updateSettingsPanel()
			}
			requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
	}

	getInput(e: KeyboardEvent): string {
		return this.display.getValue() + this.game.characterPool.getSymbolByKey(e.key)
	}

	verifyInput(e: KeyboardEvent): void {
		if (this.pendingValidation !== null) {
			e.preventDefault()
			if (e.key === " ") {
				clearTimeout(this.pendingValidation)
				this.pendingValidation = null
				this.display.setValue("")
				this.display.showError("---")
			}
			return
		}
		if (this.display.hasError()) {
			this.display.clearError()
		}
		// Handle space explicitly for spacing mode (space is not in the char pool)
		if (e.key === " " && this.game.spacingMode) {
			e.preventDefault()
			const input = this.display.getValue() + " "
			if (this.isInputScorable(input)) {
				this.display.setValue(input)
				return this.inputCorrect()
			}
			if (this.game.goal.startsWith(input)) {
				this.display.appendToInput(" ")
			} else {
				this.display.showError("---")
			}
			return
		}
		const input = this.getInput(e)
		if (input === "ababvoidgloom*") {
			e.preventDefault()
			this.game.score = this.game.score + 1000
			return this.inputCorrect()
		}
		if (this.isInputScorable(input)) {
			e.preventDefault()
			if (this.game.spacingMode && !this.game.goal.endsWith(" ")) {
				this.pendingValidation = setTimeout(() => {
					this.pendingValidation = null
					this.inputCorrect()
				}, 50)
			} else {
				return this.inputCorrect()
			}
			return
		}
		else {
			const upgrade = this.game.findUpgradeByKey(input)
			if (upgrade) {
				e.preventDefault()
				this.attemptUpgradePurchase(upgrade)
				if (upgrade instanceof OneTimeUpgrade) {
					this.display.getDisplayByName(upgrade.name).hide()
					this.game.regenerateAllKeys()
					const nextGoal = this.game.updateGoal()
					this.display.displayGoal(nextGoal)
				}
				return
			}
		}
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
			e.preventDefault()
			this.display.appendToInput(this.game.characterPool.getSymbolByKey(e.key))
		}
	}

	inputCorrect(): void {
		this.display.showInputSuccess()
		this.game.scoreSuccess()
		this.display.setValue("")
		this.display.displayScore()
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
	}

	isInputScorable(input: string): boolean {
		return input === this.game.goal
	}

	doPageSetup(): void {
		this.display.focusInput()
		this.display.displayScore()
		const nextGoal = this.game.updateGoal()
		this.display.displayGoal(nextGoal)
	}

	attemptUpgradePurchase(upgrade: Upgrade): void {
		if (this.game.score >= upgrade.cost) {
			this.display.showInputSuccess()
			this.display.setValue("")
			this.game.score -= upgrade.cost
			this.display.displayScore()
			const existingKeys = new Set(this.game.upgrades.filter(u => u !== upgrade).map(u => u.key))
			upgrade.purchase(this.game.characterPool, existingKeys)
		}
		else {
			this.display.showError("---")
		}
	}
}
