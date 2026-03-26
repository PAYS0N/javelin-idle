interface CharSet {
	chars: string[]
	enabled: boolean
}

const KEY_MAP = new Map<string, string>([
	["ArrowUp", "↑"],
	["ArrowDown", "↓"],
	["ArrowLeft", "←"],
	["ArrowRight", "→"],
])

export function getKeySymbol(key: string): string | undefined {
	return KEY_MAP.get(key)
}

function getLetters(): string[] {
	return [
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",
		"q",
		"r",
		"s",
		"t",
		"u",
		"v",
		"w",
		"x",
		"y",
		"z",
	]
}

function getWords(): string[] {
	return [
		"a",
		"about",
		"all",
		"also",
		"and",
		"as",
		"at",
		"be",
		"because",
		"but",
		"by",
		"can",
		"come",
		"could",
		"day",
		"do",
		"even",
		"find",
		"first",
		"for",
		"from",
		"get",
		"give",
		"go",
		"have",
		"he",
		"her",
		"here",
		"him",
		"his",
		"how",
		"i",
		"if",
		"in",
		"into",
		"it",
		"its",
		"just",
		"know",
		"like",
		"look",
		"make",
		"man",
		"many",
		"me",
		"more",
		"my",
		"new",
		"no",
		"not",
		"now",
		"of",
		"on",
		"one",
		"only",
		"or",
		"other",
		"our",
		"out",
		"people",
		"say",
		"see",
		"she",
		"so",
		"some",
		"take",
		"tell",
		"than",
		"that",
		"the",
		"their",
		"them",
		"then",
		"there",
		"these",
		"they",
		"thing",
		"think",
		"this",
		"those",
		"time",
		"to",
		"two",
		"up",
		"use",
		"very",
		"want",
		"way",
		"we",
		"well",
		"what",
		"when",
		"which",
		"who",
		"will",
		"with",
		"would",
		"year",
		"you",
		"your",
	]
}

export function getSymbols(): string[] {
	return [
		"{",
		"}",
		"(",
		")",
		"*",
		"+",
		"-",
		"^",
		"#",
		"<",
		">",
		"&",
		"_",
		"|",
		"?",
		"!",
		"~",
		"=",
		",",
		".",
		"[",
		"]",
		":",
		";",
		"\\",
		"/",
		"`",
		"'",
		'"',
		"↑",
		"↓",
		"←",
		"→",
	]
}

export class CharacterPool {
	purchaseChar: string
	sets: Record<string, CharSet>
	pool: string[]

	constructor(purchaseChar = "$") {
		this.purchaseChar = purchaseChar
		this.sets = {}
		this.pool = []
	}

	private rebuildPool(): void {
		this.pool = []
		for (const set of Object.values(this.sets)) {
			if (set.enabled) {
				this.pool.push(...set.chars)
			}
		}
	}

	addSet(name: string, chars: string[]): void {
		if (name in this.sets) {
			this.sets[name].chars = chars
		} else {
			this.sets[name] = { chars, enabled: true }
		}
		this.rebuildPool()
	}

	toggleSet(name: string, enabled: boolean): boolean {
		if (!enabled) {
			const enabledCount = Object.values(this.sets).filter((s) => s.enabled).length
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

	addWords(): void {
		this.addSet("words", getWords())
	}

	getRandomChar(): string {
		return this.pool[Math.floor(Math.random() * this.pool.length)]
	}

	getRandomSingleChar(): string {
		const pool = this.getSingleCharPool()
		return pool[Math.floor(Math.random() * pool.length)]
	}

	private getSingleCharPool(): string[] {
		const single = this.pool.filter((s) => s.length === 1)
		return single.length > 0 ? single : this.pool
	}

	generateKey(length: number, existingKeys: Set<string> = new Set()): string {
		const singleCharPool = this.getSingleCharPool()
		let key: string
		do {
			const aChars = [this.purchaseChar]
			for (let i = 0; i < length; i++) {
				aChars.push(singleCharPool[Math.floor(Math.random() * singleCharPool.length)])
			}
			key = aChars.join("")
		} while (existingKeys.has(key))
		existingKeys.add(key)
		return key
	}

	generateCompletionKey(length: number): string[] {
		const entries: string[] = []
		for (let i = 0; i < length; i++) {
			entries.push(this.getRandomChar())
		}
		return entries
	}

	toSaveObj(): [string, Record<string, { chars: string[]; enabled: boolean }>] {
		const setsObj: Record<string, { chars: string[]; enabled: boolean }> = {}
		for (const [name, set] of Object.entries(this.sets)) {
			setsObj[name] = { chars: set.chars, enabled: set.enabled }
		}
		return [this.purchaseChar, setsObj]
	}

	static fromSave(
		purchaseChar: string,
		setsData: Record<string, { chars: string[]; enabled: boolean }>,
	): CharacterPool {
		const cp = new CharacterPool(purchaseChar)
		for (const [name, data] of Object.entries(setsData)) {
			cp.sets[name] = { chars: data.chars, enabled: data.enabled }
		}
		cp.rebuildPool()
		return cp
	}
}
