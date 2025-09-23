window.onload = () => {
    setConstants()
    doGameSetup()
    doPageSetup()
}

function setConstants() {
    score = 0
    goal = ""
    scoreDisplay = document.querySelector(".score-value")
    userInput = document.querySelector(".typing-input")
    goalDisplay = document.querySelector(".goal-display")
    purchaseChar = "$"
    keyCodesToSymbols = {
        "{": "{",
        "}": "}",
        "(": "(",
        ")": ")",
        "*": "*",
        "+": "+",
        "-": "-",
        "=": "=",
        ",": ",",
        ".": ".",
        "[": "[",
        "]": "]",
        ":": ":",
        ";": ";",
        "'": "'",
        "\"": "\"",
        "ArrowUp": "↑",
        "ArrowDown": "↓",
        "ArrowLeft": "←",
        "ArrowRight": "→"
    }
    if ( Object.keys(keyCodesToSymbols).includes(purchaseChar)) {console.error("chars must not contain purchase char")}
    upgrades = []    
}

function doPageSetup() {
    userInput.focus()
    updateScore()
    updateGoal()
}

function updateScore() {
    scoreDisplay.textContent = Math.floor(score)
}

function doGameSetup() {
    runGameLogic()
    userInput.addEventListener("keydown", (e) => {verifyInput(e)})
    let twoFingerTyper = new Upgrade("Two finger typer", 20, 3, generateKey(3), 3, 1/3, .25, document.querySelector(".first-upgrade"))
    upgrades.push(twoFingerTyper)
    let practicedTwoFingerTyper = new Upgrade("Practiced two finger typer", 100, 50, generateKey(5), 5, 2/3, .75, document.querySelector(".second-upgrade"))
    upgrades.push(practicedTwoFingerTyper)
}

function getInput(e) {
    return userInput.value + keyCodesToSymbols[e.key]
}

function runGameLogic() {
    setInterval(() => {
        revealUpgrades()
        displayUpgrades()
        updateScore()
    }, 100)
    let timesPerSecond = 1
    setInterval(()=>{addAutoScore(timesPerSecond)}, 1000/timesPerSecond)
}

function verifyInput(e) {
    let input = getInput(e)
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
        userInput.value += keyCodesToSymbols[e.key]
    }

}

function addAutoScore(timesPerSecond) {
    let valueToAdd = 0
    for (upgrade of upgrades) {
        valueToAdd = valueToAdd + upgrade.owned * upgrade.value / timesPerSecond
    }
    score = score + valueToAdd
    displayAutoScore(valueToAdd)
}

function displayAutoScore(valueToAdd) {
    symbolsToAdd = valueToAdd*4
    const autoInput = document.querySelector(".auto-input")
    let maxNumberOfCharsInInput = 4
    let spaceRemaining = maxNumberOfCharsInInput - autoInput.value.length
    if (symbolsToAdd >= spaceRemaining) {
        symbolsToAdd = symbolsToAdd % spaceRemaining
        autoInput.value = ""
        inputSuccess(autoInput)
    }
    for(let i=0; i<symbolsToAdd; i++){
        autoInput.value += getRandomTypingChar()
    }
}

function inputCorrect() {
    inputSuccess(userInput)
    userInput.value = ""
    score += 1
    updateScore()
    updateGoal()
}

function inputSuccess(htmlObject) {
    htmlObject.classList.add('green-background');

    setTimeout(() => {
      htmlObject.classList.remove('green-background');
    }, 200);
}

function updateGoal() {
    let symbolToType = getRandomTypingChar()
    goal = symbolToType
    displayGoal(symbolToType)
}

function getRandomTypingChar() {
    let keyCodes = Object.keys(keyCodesToSymbols)
    let nextIndex = Math.floor(Math.random() * keyCodes.length)
    return keyCodesToSymbols[keyCodes[nextIndex]]
}

function displayGoal(symbol) {
    goalDisplay.textContent = "Type: " + symbol
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
    for (upgrade of upgrades) {
        if(score >= upgrade.cost * 3 / 4) {
            upgrade.html.classList.remove("unavailable")
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

function generateKey( number) {
    let keyCodes = Object.keys(keyCodesToSymbols)
    let aChars = [ purchaseChar]
    for(let i=0; i< number; i++){
        let nextIndex = Math.floor(Math.random() * keyCodes.length)
        aChars.push(keyCodesToSymbols[keyCodes[nextIndex]])
    }
    return aChars.join("")
}

function attemptUpgradePurchase(upgrade) {
    if (score >= upgrade.cost) {
        inputSuccess(userInput)
        userInput.value = ""
        score -= upgrade.cost
        updateScore()
        upgrade.purchase(1)
    }
    else {
        userInput.value = "---"
    }
}


class Upgrade{

    constructor(name, cost, costIncrease, key, keyLength, keyIncrease, value, htmlObject) {
        this.name = name
        this.cost = cost
        this.costIncrease = costIncrease
        this.html = htmlObject
        this.owned = 0
        this.key = key
        this.keyLength = keyLength
        this.keyIncrease = keyIncrease
        this.value = value
        this.htmlDisplay = document.querySelector(".auto-input")
    }

    display() {
        this.html.querySelector(".upgrade-name").textContent = this.name
        this.html.querySelector(".cost-value").textContent = this.cost
        this.html.querySelector(".key-value").textContent = this.key
        if (this.owned > 0) {
            this.html.querySelector(".upgrade-owned").classList.remove("unavailable")
            this.htmlDisplay.classList.remove("unavailable")
            this.html.querySelector(".owned-value").textContent = this.owned
        }
    }

    purchase() {
        this.owned += 1;
        this.cost += this.costIncrease
        this.key = generateKey(this.keyLength + (this.owned * this.keyIncrease))
    }

}