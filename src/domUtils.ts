export function safeQueryHTMLElement(identifier: string, base: Element | Document = document): HTMLElement {
	const element = base.querySelector(identifier)
	if (element instanceof HTMLElement) {
		return element
	}
	throw new TypeError(`${identifier} not found, or not an HTMLElement.`)
}

export function safeQueryHTMLElementInput(identifier: string, base: Element | Document = document): HTMLInputElement {
	const element = base.querySelector(identifier)
	if (element instanceof HTMLInputElement) {
		return element
	}
	throw new TypeError(`${identifier} not found, or not of type HTMLInputElement.`)
}

export function flashClass(element: HTMLElement, className: string, durationMs: number): void {
	element.classList.add(className)
	setTimeout(() => {
		element.classList.remove(className)
	}, durationMs)
}

export function clearChildren(element: HTMLElement): void {
	while (element.firstChild) {
		element.removeChild(element.firstChild)
	}
}

export function createCharToken(text: string): HTMLDivElement {
	const div = document.createElement("div")
	div.classList.add("char-token")
	div.textContent = text
	return div
}
