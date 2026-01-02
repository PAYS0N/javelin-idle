window.onload = () => {
	const game = new Game();
	const gameDisplay = new GameDisplay(game);
	const gameController = new GameController(game, gameDisplay);
	gameController.doGameSetup()
	gameController.doPageSetup()
}
