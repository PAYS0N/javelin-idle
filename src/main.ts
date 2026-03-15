import { GameManager } from "./gameManager.js"

window.onload = () => {
	const gameManager = new GameManager()
	gameManager.startGame()
}
