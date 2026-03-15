interface CharSet {
	chars: Record<string, string>
	enabled: boolean
}

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
		"\\": "\\",
		"/": "/",
		"`": "`",
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
	sets: Record<string, CharSet>
	pool: Record<string, string>

	constructor(purchaseChar = "$") {
		this.purchaseChar = purchaseChar
		this.sets = {}
		this.pool = {}
	}

	private rebuildPool(): void {
		this.pool = {}
		for (const set of Object.values(this.sets)) {
			if (set.enabled) {
				Object.assign(this.pool, set.chars)
			}
		}
	}

	addSet(name: string, chars: Record<string, string>): void {
		if (name in this.sets) {
			this.sets[name].chars = chars
		} else {
			this.sets[name] = { chars, enabled: true }
		}
		this.rebuildPool()
	}

	toggleSet(name: string, enabled: boolean): boolean {
		if (!enabled) {
			const enabledCount = Object.values(this.sets).filter(s => s.enabled).length
			if (enabledCount <= 1) {
				return false
			}
		}
		this.sets[name].enabled = enabled
		this.rebuildPool()
		return true
	}

	isSetEnabled(name: string): boolean {
		return this.sets[name]?.enabled ?? false
	}

	getSetNames(): string[] {
		return Object.keys(this.sets)
	}

	addLetters(): void {
		this.addSet("letters", getLetters())
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
		const setsObj: Record<string, { chars: Record<string, string>, enabled: boolean }> = {}
		for (const [name, set] of Object.entries(this.sets)) {
			setsObj[name] = { chars: set.chars, enabled: set.enabled }
		}
		return JSON.stringify([this.purchaseChar, setsObj])
	}

	static fromSave(purchaseChar: string, setsData: Record<string, { chars: Record<string, string>, enabled: boolean }>): CharacterPool {
		const cp = new CharacterPool(purchaseChar)
		for (const [name, data] of Object.entries(setsData)) {
			cp.sets[name] = { chars: data.chars, enabled: data.enabled }
		}
		cp.rebuildPool()
		return cp
	}

	static fromOldSave(purchaseChar: string, poolObj: Record<string, string>): CharacterPool {
		const cp = new CharacterPool(purchaseChar)
		const symbolKeys = new Set(Object.keys(getSymbols()))
		const letterKeys = new Set(Object.keys(getLetters()))
		const symbolsInPool: Record<string, string> = {}
		const lettersInPool: Record<string, string> = {}
		for (const [k, v] of Object.entries(poolObj)) {
			if (symbolKeys.has(k)) {
				symbolsInPool[k] = v
			} else if (letterKeys.has(k)) {
				lettersInPool[k] = v
			}
		}
		if (Object.keys(symbolsInPool).length > 0) {
			cp.sets["symbols"] = { chars: symbolsInPool, enabled: true }
		} else {
			cp.sets["symbols"] = { chars: getSymbols(), enabled: true }
		}
		if (Object.keys(lettersInPool).length > 0) {
			cp.sets["letters"] = { chars: lettersInPool, enabled: true }
		}
		cp.rebuildPool()
		return cp
	}
}
