function getLetters(): Record<string, string> {
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

export function getSymbols(): Record<string, string> {
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

export class CharacterPool {
	purchaseChar: string
	pool: Record<string, string>

	constructor(purchaseChar = "$", startingMap: Record<string, string> = {}) {
		this.purchaseChar = purchaseChar
		this.pool = startingMap
	}

	addLetters(): void {
		Object.assign(this.pool, getLetters())
	}

	getSymbolByKey(key: string): string {
		return this.pool[key]
	}

	getRandomChar(): string {
		const keyCodes = Object.keys(this.pool)
		const nextIndex = Math.floor(Math.random() * keyCodes.length)
		return this.pool[keyCodes[nextIndex]]
	}

	includes(character: string): boolean {
		return Object.keys(this.pool).includes(character)
	}

	generateKey(number: number, existingKeys: Set<string> = new Set()): string {
		let key: string
		do {
			const aChars = [this.purchaseChar]
			for (let i = 0; i < number; i++) {
				aChars.push(this.getRandomChar())
			}
			key = aChars.join("")
		} while (existingKeys.has(key))
		existingKeys.add(key)
		return key
	}

	toString(): string {
		const poolObj: Record<string, string> = {}
		for (const key in this.pool) {
			poolObj[key] = this.pool[key]
		}
		return JSON.stringify([this.purchaseChar, poolObj])
	}
}
