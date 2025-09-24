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
    const twoFingerTyper = new Upgrade("Two finger typer", 20, 3, 3/4, generateKey(3), 3, 1/3, .25)
    upgrades.push(twoFingerTyper)
    const practicedTwoFingerTyper = new Upgrade("Practiced two finger typer", 100, 25, 4/5, generateKey(5), 5, 2/3, .75)
    upgrades.push(practicedTwoFingerTyper)
    const unlockLettersUpgrade = new OneTimeUpgrade("Unlock Letters", 500, 9/10, generateKey(10), addLetters)
    upgrades.push(unlockLettersUpgrade)
    lockedUpgrades = [...upgrades]
    runGameLogic()
}

function getInput(e) {
    return userInput.value + keyCodesToSymbols[e.key]
}

function runGameLogic() {
    setInterval(() => {
        revealUpgrades()
        displayUpgrades()
        displayScore()
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
    score = score + valueToAdd * scoreMulti
    displayAutoScore(valueToAdd * scoreMulti)
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
        displayScore()
        upgrade.purchase(1)
    }
    else {
        userInput.value = "---"
    }
}

function addLetters() {
    scoreMulti *= 1.5
    letters = {
        "a": "a",
        "b": "b",
        "c": "c",
        "d": "d",
        "e": "e",
        "f": "f",
        "g": "g",
        "h": "h",
        "i": "i",
        "j": "j",
        "k": "k",
        "l": "l",
        "m": "m",
        "n": "n",
        "o": "o",
        "p": "p",
        "q": "q",
        "r": "r",
        "s": "s",
        "t": "t",
        "u": "u",
        "v": "v",
        "w": "w",
        "x": "x",
        "y": "y",
        "z": "z"
    }
    Object.assign(keyCodesToSymbols, letters)
}


class Upgrade{

    constructor(name, cost, costIncrease, thresholdMulti, key, keyLength, keyIncrease, value) {
        this.name = name
        this.cost = cost
        this.costIncrease = costIncrease
        this.html = this.createUpgradeHtml()
        this.owned = 0
        this.key = key
        this.keyLength = keyLength
        this.keyIncrease = keyIncrease
        this.value = value
        this.htmlDisplay = document.querySelector(".auto-input")
        this.threshold = this.cost * thresholdMulti
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

    createUpgradeHtml() {
        const upgrade = document.createElement('div')
        upgrade.classList.add("upgrade")
        upgrade.classList.add("unavailable")

        const upgradeName = document.createElement('div')
        upgradeName.classList.add("upgrade-name")
        upgrade.appendChild(upgradeName)

        let upgradeCost = this.createValueDisplayHtml("cost", "Cost: ")
        upgrade.appendChild(upgradeCost)

        let upgradeKey = this.createValueDisplayHtml("key", "Purchase: ")
        upgrade.appendChild(upgradeKey)

        let upgradeOwned = this.createValueDisplayHtml("owned", "Owned: ")
        upgradeOwned.classList.add("unavailable")
        upgrade.appendChild(upgradeOwned)

        document.querySelector(".upgrades").appendChild(upgrade)
        return upgrade
    }

    createValueDisplayHtml(phrase, text) {
        const upgradeCost = document.createElement('div')
        upgradeCost.classList.add("upgrade-"+phrase)

            const costTitle = document.createElement('div')
            costTitle.classList.add(phrase+"-title")
            costTitle.textContent = text
            upgradeCost.appendChild(costTitle)
    
            const costValue = document.createElement('div')
            costValue.classList.add(phrase+"-value")
            upgradeCost.appendChild(costValue)
        return upgradeCost
    }

}

class OneTimeUpgrade extends Upgrade {
    constructor(name, cost, thresholdMulti, key, onPurchase) {
        super(name, cost, 0, thresholdMulti, key, 0, 0, 0)
        this.onPurchase = onPurchase
    }

    purchase() {
        if (this.owned > 0) return;
        this.owned = 1
        this.onPurchase?.()
        this.html.classList.add("unavailable")
    }
}