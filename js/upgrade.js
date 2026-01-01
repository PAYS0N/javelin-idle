class Upgrade{

    constructor(name, cost, costIncrease, thresholdMulti, key, keyLength, keyIncrease, value, createDisplayHTML = true) {
        this.name = name
        this.cost = cost
        this.costIncrease = costIncrease
        this.html = this.createUpgradeHtml()
        this.owned = 0
        this.key = key
        this.keyLength = keyLength
        this.keyIncrease = keyIncrease
        this.value = value
        this.htmlDisplay = createDisplayHTML ? this.createDisplayHTML() : null
        this.threshold = this.cost * thresholdMulti
        this.firstPurchase = true
        this.isRevealed = false
        this.maxDigitsToDisplay = 4
    }

    display() {
        this.html.querySelector(".upgrade-name").textContent = this.name
        this.html.querySelector(".cost-value").textContent = this.cost
        this.html.querySelector(".key-value").textContent = this.key
        this.html.querySelector(".chps-value").textContent = this.value * this.owned
        this.html.querySelector(".owned-value").textContent = this.owned
        if (this.owned > 0 && !this.isRevealed) {
            this.html.querySelector(".upgrade-owned").classList.remove("unavailable")
            this.html.querySelector(".upgrade-chps").classList.remove("unavailable")
            this.htmlDisplay.classList.remove("unavailable")
            this.isRevealed = true
        }
    }

    createDisplayHTML() {
        const inputs = document.querySelector(".auto-inputs")
        const input = document.createElement("input")
        input.classList.add("auto-input")
        input.classList.add("unavailable")
        inputs.appendChild(input)
        return input
    }

    purchase() {
        this.owned += 1;
        this.cost += this.costIncrease
        this.key = characterPool.generateKey(this.keyLength + (this.owned * this.keyIncrease))
        if (this.firstPurchase) {
            this.firstPurchase = false
            this.runAutoScoreUpdates()
        }
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

        let charPerSec = this.createValueDisplayHtml("chps", "Ch/s: ")
        charPerSec.classList.add("unavailable")
        upgrade.appendChild(charPerSec)

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

    runAutoScoreUpdates() {
        score = score + this.value
        this.displayAutoScore()
        setTimeout(() => this.runAutoScoreUpdates(), 1000/this.owned)
    }

    displayAutoScore() {
        let symbolsToAdd = this.value*4
        const autoInput = this.htmlDisplay
        let spaceRemaining = this.maxDigitsToDisplay - autoInput.value.length
        if (symbolsToAdd >= spaceRemaining) {
            symbolsToAdd = (symbolsToAdd - spaceRemaining) % this.maxDigitsToDisplay
            autoInput.value = ""
            inputSuccess(autoInput)
        }
        for(let i=0; i<symbolsToAdd; i++){
            autoInput.value += characterPool.getRandomChar()
        }
    }
}

class OneTimeUpgrade extends Upgrade {
    constructor(name, cost, thresholdMulti, key, onPurchase) {
        super(name, cost, 0, thresholdMulti, key, 0, 0, 0, false)
        this.onPurchase = onPurchase
    }

    purchase() {
        if (this.owned > 0) return;
        this.owned = 1
        this.onPurchase?.()
        this.html.classList.add("unavailable")
    }
}