import { Game } from "./game.js"
import { GameDisplay } from "./gameDisplay.js"
import { Upgrade, OneTimeUpgrade } from "./upgrade.js"

export class GameController {
	game: Game
	display: GameDisplay

	constructor(game: Game, display: GameDisplay) {
		this.game = game
		this.display = display
	}

	doGameSetup(): void {
		this.display.userInput.addEventListener("keydown", (e) => { this.verifyInput(e) })
		this.runGameLogic()
	}

	runGameLogic(): void {
		let lastTick = 0
		const tick = (timestamp: number): void => {
			if (timestamp - lastTick >= 100) {
				lastTick = timestamp
				this.manageUpgrades()
				this.display.revealUpgrades()
				this.display.displayUpgrades()
				this.display.displayScore()
			}
			requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
	}

	manageUpgrades(): void {
		for (const upgrade of this.game.upgrades) {
			if (!upgrade.started && upgrade.owned > 0) {
				this.runAutoScoring(upgrade)
				upgrade.started = true
			}
		}
	}

	runAutoScoring(upgrade: Upgrade, lastTime: number = performance.now()): void {
		const now = performance.now()
		const elapsed = now - lastTime
		const expectedInterval = 1000 / upgrade.owned
		this.game.score += upgrade.value * (elapsed / expectedInterval)
		this.display.getDisplayByName(upgrade.name).displayAutoScore(this.game.characterPool)
		setTimeout(() => this.runAutoScoring(upgrade, now), expectedInterval)
	}

	getInput(e: KeyboardEvent): string {
		return this.display.getValue() + this.game.characterPool.getSymbolByKey(e.key)
	}

	verifyInput(e: KeyboardEvent): void {
		if (this.display.userInput.classList.contains("error-state")) {
			this.display.userInput.value = ""
			this.display.userInput.classList.remove("error-state")
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
			const upgrade = this.game.returnUpgradeByKey(input)
			if (upgrade) {
				e.preventDefault()
				this.attemptUpgradePurchase(upgrade)
				if (upgrade instanceof OneTimeUpgrade) {
					this.display.getDisplayByName(upgrade.name).hide()
				}
				return
			}
		}
		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
			e.preventDefault()
			this.display.userInput.value += this.game.characterPool.getSymbolByKey(e.key)
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
		this.display.userInput.focus()
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
			this.display.userInput.classList.add("error-state")
			this.display.userInput.value = "---"
		}
	}
}
