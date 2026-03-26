import { safeQueryHTMLElement, safeQueryHTMLElementInput } from "./domUtils.js"
import { Game } from "./game.js"
import { GameController } from "./gameController.js"
import { GameDisplay } from "./gameDisplay.js"
import { OneTimeUpgrade } from "./upgrade.js"

export class GameManager {
	game: Game
	gameDisplay: GameDisplay
	gameController: GameController

	constructor() {
		this.game = new Game()
		this.gameDisplay = new GameDisplay(this.game)
		this.gameController = new GameController(this.game, this.gameDisplay)
	}

	startGame(): void {
		this.setupListeners()
		this.gameController.doGameSetup()
		this.gameController.doPageSetup()
	}

	setupListeners(): void {
		safeQueryHTMLElement("#copy-game-save").addEventListener("click", () => {
			const saveString = this.getSaveString()
			navigator.clipboard.writeText(saveString)
		})
		safeQueryHTMLElement("#save-game-button").addEventListener("click", () => {
			this.saveGame()
		})
		safeQueryHTMLElement("#load-game-button").addEventListener("click", () => {
			const input = safeQueryHTMLElementInput("#load-game-input")
			const saveString = input.value
			if (saveString === "") {
				if (this.loadGame() === false) {
					alert("No save found")
				}
			} else {
				this.loadGameFromString(saveString)
			}
		})
	}

	getSaveString(): string {
		return this.game.toString()
	}

	saveGame(): void {
		const gameJson = this.game.toString()
		localStorage.setItem("gameSave", gameJson)
	}

	loadGame(): false | undefined {
		const saveString = localStorage.getItem("gameSave")
		if (saveString) {
			const gameObj = JSON.parse(saveString) as Record<string, unknown>
			this.createGameFromObj(gameObj)
		} else {
			return false
		}
	}

	loadGameFromString(saveString: string): void {
		const gameObj = JSON.parse(saveString) as Record<string, unknown>
		this.createGameFromObj(gameObj)
	}

	createGameFromObj(gameObj: Record<string, unknown>): void {
		this.game = new Game(gameObj)
		this.gameDisplay.game = this.game
		this.gameDisplay.upgradeDisplays = this.gameDisplay.createDisplays(this.game.upgrades)
		const lockedDisplays = this.gameDisplay.upgradeDisplays.filter((d) => {
			if (d.upgrade instanceof OneTimeUpgrade && d.upgrade.owned > 0) {
				d.hide()
				return false
			}
			return true
		})
		this.gameDisplay.lockedUpgradeDisplays = lockedDisplays
		this.gameController.game = this.game
		this.gameController.doPageSetup()
	}
}
