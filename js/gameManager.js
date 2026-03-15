// @ts-check
class GameManager {
	constructor() {
		this.game = new Game()
		this.gameDisplay = new GameDisplay(this.game)
		this.gameController = new GameController(this.game, this.gameDisplay)
	}

	startGame() {
		this.setupListeners()
		this.gameController.doGameSetup()
		this.gameController.doPageSetup()
	}

	setupListeners() {
		safeQueryHTMLElement('#copy-game-save').addEventListener("click", () => {
			const saveString = this.getSaveString()
			navigator.clipboard.writeText(saveString)
		})
		safeQueryHTMLElement('#save-game-button').addEventListener("click", () => {
			this.saveGame()
		})
		safeQueryHTMLElement('#load-game-button').addEventListener("click", () => {
			const input = safeQueryHTMLElementInput('#load-game-input')
			const saveString = input.value
			if (saveString === "") {
				if (this.loadGame() === false) {
					alert("No save found")
				}
			}
			else {
				this.loadGameFromString(saveString)
			}
		})
	}

	/**
	 *
	 * @returns {string}
	 */
	getSaveString() {
		return this.game.toString()
	}

	saveGame() {
		const gameJson = this.game.toString()
		localStorage.setItem("gameSave", gameJson)
	}

	/**
	 *
	 * @returns {false | void}
	 */
	loadGame() {
		const saveString = localStorage.getItem("gameSave")
		if (saveString) {
			const gameObj = JSON.parse(saveString)
			this.createGameFromObj(gameObj)
		}
		else {
			return false
		}
	}

	/**
	 *
	 * @param {string} saveString
	 */
	loadGameFromString(saveString) {
		const gameObj = JSON.parse(saveString)
		this.createGameFromObj(gameObj)
	}

	/**
	 *
	 * @param {object} gameObj
	 */
	createGameFromObj(gameObj) {
		this.game = new Game(gameObj)
		this.gameDisplay.game = this.game
		this.gameDisplay.upgradeDisplays = this.gameDisplay.createDisplays(this.game.upgrades)
		this.gameController.game = this.game
		this.gameController.doPageSetup()
	}

}
