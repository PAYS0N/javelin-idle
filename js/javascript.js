window.onload = () => {
    setConstants()
    doGameSetup()
    doPageSetup()
}

function setConstants() {
    score = 0
    scoreMulti = 1
    multiDisplayed = false
    goal = ""
    scoreDisplay = document.querySelector(".score-value")
    userInput = document.querySelector(".typing-input")
    goalDisplay = document.querySelector(".goal-value")
    characterPool = new CharacterPool("$", getSymbols())
    if ( characterPool.includes(characterPool.purchaseChar)) {console.error("chars must not contain purchase char")}
    upgrades = []    
}

function doPageSetup() {
    userInput.focus()
    displayScore()
    updateGoal()
}

function displayScore() {
    scoreDisplay.textContent = Math.floor(score)
    if (!multiDisplayed && scoreMulti > 1) {
        document.querySelector('.multi-display').classList.remove("unavailable")
        document.querySelector('.multi-value').textContent = scoreMulti
    }
}

function doGameSetup() {
    userInput.addEventListener("keydown", (e) => {verifyInput(e)})
    const twoFingerTyper = new Upgrade("Two finger typer", 20, 3, 3/4, characterPool.generateKey(3), 3, 1/3, .25)
    upgrades.push(twoFingerTyper)
    const practicedTwoFingerTyper = new Upgrade("Practiced two finger typer", 80, 20, 3/4, characterPool.generateKey(5), 5, 2/3, .75)
    upgrades.push(practicedTwoFingerTyper)
    const unlockLettersUpgrade = new OneTimeUpgrade("Unlock Letters", 500, 4/5, characterPool.generateKey(10), addLetters)
    upgrades.push(unlockLettersUpgrade)
    const newTouchTyper = new Upgrade("New touch typer", 1000, 50, 3/4, characterPool.generateKey(10), 10, 1, 1.5)
    upgrades.push(newTouchTyper)
    // const unlockWords = new OneTimeUpgrade("Unlock top 100 words", 3000, 3/5, generateKey(15), addWords)
    // upgrades.push(unlockWords)
    lockedUpgrades = [...upgrades]
    runGameLogic()
}

function getInput(e) {
    return userInput.value + characterPool.getSymbolByKey(e.key)
}

function runGameLogic() {
    setInterval(() => {
        revealUpgrades()
        displayUpgrades()
        displayScore()
    }, 100)
}

function verifyInput(e) {
    if (userInput.classList.contains("error-state")) {
        userInput.value = ""
        userInput.classList.remove("error-state")
    }
    let input = getInput(e)
    if (input === "ababvoidgloom*") {
        e.preventDefault()
        score = score + 1000
        return inputCorrect()
    }
    if (isInputScorable(input)) {
        e.preventDefault()
        return inputCorrect()
    }
    else {
        upgrade = returnUpgradeByKey(input)
        if (upgrade) {
            e.preventDefault()
            return attemptUpgradePurchase(upgrade)
        }
    }
    if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)){
        e.preventDefault()
        userInput.value += characterPool.getSymbolByKey(e.key)
    }

}

function displayAutoScore(valueToAdd) {
    symbolsToAdd = valueToAdd*4
    const autoInput = document.querySelector(".auto-input")
    let maxNumberOfCharsInInput = 4
    let spaceRemaining = maxNumberOfCharsInInput - autoInput.value.length
    if (symbolsToAdd >= spaceRemaining) {
        symbolsToAdd = (symbolsToAdd - spaceRemaining) % maxNumberOfCharsInInput
        autoInput.value = ""
        inputSuccess(autoInput)
    }
    for(let i=0; i<symbolsToAdd; i++){
        autoInput.value += characterPool.getRandomChar()
    }
}

function inputCorrect() {
    inputSuccess(userInput)
    userInput.value = ""
    score += scoreMulti
    displayScore()
    updateGoal()
}

function inputSuccess(htmlObject) {
    htmlObject.classList.add('green-background');

    setTimeout(() => {
      htmlObject.classList.remove('green-background');
    }, 200);
}

function updateGoal() {
    let symbolToType = characterPool.getRandomChar()
    goal = symbolToType
    displayGoal(symbolToType)
}

function displayGoal(symbol) {
    goalDisplay.textContent = symbol
}

function isInputScorable(input) {
    return input === goal
}

function displayUpgrades() {
    for (upgrade of upgrades) {
        upgrade.display()
    }
}

function revealUpgrades(){
    for (upgrade of lockedUpgrades) {
        if(score >= upgrade.threshold) {
            upgrade.html.classList.remove("unavailable")
            lockedUpgrades.splice(lockedUpgrades.indexOf(upgrade), 1);
        }
    }
}

function returnUpgradeByKey(input) {
    for (upgrade of upgrades) {
        if (input === upgrade.key) {
            return upgrade
        }
    }
}

function attemptUpgradePurchase(upgrade) {
    if (score >= upgrade.cost) {
        inputSuccess(userInput)
        userInput.value = ""
        score -= upgrade.cost
        displayScore()
        upgrade.purchase(1)
    }
    else {
        userInput.classList.add("error-state")
        userInput.value = "---"
    }
}

function addLetters() {
    scoreMulti *= 1.5
    characterPool.addLetters()
}

// function addWords() {
// }