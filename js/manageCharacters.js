function getLetters(){
    return {
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
}

function getSymbols() {
    return {
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
}

class CharacterPool {
    constructor(startingMap = {}) {
        this.pool = startingMap
    }

    addLetters() {
        Object.assign(this.pool, getLetters())
    }

    getSymbolByKey(key) {
        return this.pool[key]
    }

    getRandomChar() {
        let keyCodes = Object.keys(this.pool)
        let nextIndex = Math.floor(Math.random() * keyCodes.length)
        return this.pool[keyCodes[nextIndex]]
    }

    includes(character) {
        Object.keys(this.pool).includes(character)
    }
}