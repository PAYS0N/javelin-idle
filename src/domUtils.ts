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
