import { Game } from "./game.js"
import { GameDisplay } from "./gameDisplay.js"
import { Upgrade, OneTimeUpgrade } from "./upgrade.js"
import { getKeySymbol } from "./characterPool.js"

export class GameController {
	game: Game
	display: GameDisplay

	constructor(game: Game, display: GameDisplay) {
		this.game = game
		this.display = display
	}

	doGameSetup(): void {
		this.display.userInput.addEventListener("keydown", (e) => { this.verifyInput(e) })
		this.display.onSetToggled = (name, enabled) => this.handleSetToggle(name, enabled)
		this.runGameLogic()
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
		return this.display.getValue() + (getKeySymbol(e.key) ?? e.key)
	}

	verifyInput(e: KeyboardEvent): void {
		if (this.display.hasError()) {
			this.display.clearError()
		}
		const input = this.getInput(e)
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
			this.display.appendToInput(getKeySymbol(e.key)!)
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
