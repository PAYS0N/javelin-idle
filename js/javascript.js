window.onload = () => {
    setConstants()
    doGameSetup()
    doPageSetup()
}

function setConstants() {
    score = 0
    goal = ""
    scoreDisplay = document.querySelector(".score-display")
    userInput = document.querySelector(".typing-input")
    goalDisplay = document.querySelector(".goal-display")
    purchaseChar = "$"
    charactersToType = ["{", "}", "(", ")", "*", "+", "="]
    if (charactersToType.includes(purchaseChar)) {console.error("chars must not contain purchase char")}
    upgrades = []    
}

function doPageSetup() {
    userInput.focus()
    updateScore()
    updateGoal()
}

function updateScore() {
    scoreDisplay.textContent = "Score: " + score
}

function doGameSetup() {
    userInput.addEventListener("keyup", () => {runGameLogic(getInput())})
    let autoTyper = new Upgrade("Auto-typer", 20, generateKey(3), 3, document.querySelector(".first-upgrade"))
    upgrades.push(autoTyper)
}

function getInput() {
    return userInput.value
}

function runGameLogic(input) {
    if (isInputScorable(input)) {
        inputCorrect()
    }
    else {
        upgrade = returnUpgradeByKey(input)
        if (upgrade) {
            purchaseUpgrade(upgrade)
        }
    }
    displayUpgrades()
}

function inputCorrect() {
    userInput.value = ""
    score += 1
    updateScore()
    updateGoal()
}

function updateGoal() {
    let nextIndex = Math.floor(Math.random() * charactersToType.length)
    let charToType = charactersToType[nextIndex]
    goal = charToType
    displayGoal()
}

function displayGoal() {
    goalDisplay.textContent = "Type: " + goal
}

function isInputScorable(input) {
    return input === goal
}

function displayUpgrades() {
    for (upgrade of upgrades) {
        if(score > upgrade.cost * 3 / 4) {
            upgrade.html.classList.remove("unavailable")
            upgrade.display()
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

function generateKey(num) {
    return purchaseChar + "#{+"
}

function purchaseUpgrade(upgrade) {
    userInput.value = ""
    score -= upgrade.cost
    updateScore()
    upgrade.purchase(1)
}


class Upgrade{

    constructor(name, cost, key, keyLength, htmlObject) {
        this.name = name
        this.cost = cost
        this.html = htmlObject
        this.owned = 0
        this.key = key
    }

    display() {
        this.html.querySelector(".upgrade-name").textContent = this.name
        this.html.querySelector(".cost-value").textContent = this.cost
        this.html.querySelector(".key-value").textContent = this.key
        if (this.owned > 0) {
            this.html.querySelector(".upgrade-owned").classList.remove("unavailable")
            this.html.querySelector(".owned-value").textContent = this.owned
        }
    }

    purchase() {
        this.owned += 1;
        this.cost += 3
        this.key = generateKey(keyLength + (this.owned / 3))
    }

}