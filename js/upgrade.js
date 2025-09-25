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