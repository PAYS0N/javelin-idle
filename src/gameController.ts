import { Game } from "./game.js"
import { GameDisplay } from "./gameDisplay.js"
import { Upgrade, OneTimeUpgrade } from "./upgrade.js"
import { getKeySymbol } from "./characterPool.js"

export class GameController {
	game: Game
	display: GameDisplay
	completionTarget: Upgrade | null
	completionIndex: number

	constructor(game: Game, display: GameDisplay) {
		this.game = game
		this.display = display
		this.completionTarget = null
		this.completionIndex = 0
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
		this.game.regenerateCompletionKeys()
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
		const char = getKeySymbol(e.key) ?? e.key
		if (this.completionTarget) {
			if (char === this.game.characterPool.purchaseChar) {
				e.preventDefault()
				this.exitCompletionMode()
				return
			}
			if (char === this.completionTarget.completionKey[this.completionIndex]) {
				e.preventDefault()
				this.completionIndex++
				this.display.setValue("")
				this.display.showInputSuccess()
				if (this.completionIndex >= this.completionTarget.completionKey.length) {
					this.finishCompletionPurchase()
				} else {
					this.display.showCompletionChar(this.completionTarget.completionKey[this.completionIndex])
					this.display.showCompletionProgress(this.completionIndex, this.completionTarget.completionKey.length)
				}
				return
			}
			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
				e.preventDefault()
				this.display.appendToInput(char)
			}
			return
		}
		const input = this.display.getValue() + char
		if (input === "ababvoidgloom*") {
			e.preventDefault()
			this.game.score = this.game.score + 1000
			return this.inputCorrect()
		}
		if (this.isInputScorable(input)) {
			e.preventDefault()
			return this.inputCorrect()
		}
		const upgrade = this.game.findUpgradeByKey(input)
		if (upgrade) {
			e.preventDefault()
if (this.game.score >= upgrade.cost) {
				this.display.setValue("")
				this.enterCompletionMode(upgrade)
			} else {
				this.display.showError("---")
			}
			return
		}
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
			e.preventDefault()
			this.display.appendToInput(char)
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

	enterCompletionMode(upgrade: Upgrade): void {
		this.completionTarget = upgrade
		this.completionIndex = 0
		this.display.getDisplayByName(upgrade.name).purchaseHtml.classList.add("completion-active")
		this.display.showCompletionChar(upgrade.completionKey[0])
		this.display.showCompletionProgress(0, upgrade.completionKey.length)
	}

	exitCompletionMode(): void {
		this.display.getDisplayByName(this.completionTarget!.name).purchaseHtml.classList.remove("completion-active")
		this.completionTarget = null
		this.completionIndex = 0
		this.display.setValue("")
		this.display.exitCompletionMode()
	}

	finishCompletionPurchase(): void {
		const upgrade = this.completionTarget!
		this.display.getDisplayByName(upgrade.name).purchaseHtml.classList.remove("completion-active")
		this.completionTarget = null
		this.completionIndex = 0
		this.attemptUpgradePurchase(upgrade)
		if (upgrade instanceof OneTimeUpgrade) {
			this.display.getDisplayByName(upgrade.name).hide()
			this.game.regenerateCompletionKeys()
		}
		this.display.exitCompletionMode()
	}

	attemptUpgradePurchase(upgrade: Upgrade): void {
		if (this.game.score >= upgrade.cost) {
			this.display.showInputSuccess()
			this.display.setValue("")
			this.game.score -= upgrade.cost
			this.display.displayScore()
			upgrade.purchase(this.game.characterPool)
		} else {
			console.error("attemptUpgradePurchase called with insufficient score — this should be unreachable")
		}
	}
}
