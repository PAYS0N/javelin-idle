// @ts-check

/**
 * @param {string} identifier
 * @param {Element | Document} base
 * @returns {HTMLElement}
 */
function safeQueryHTMLElement(identifier, base = document) {
	const element = base.querySelector(identifier)
	if (element instanceof HTMLElement) {
		return element
	}
	throw new TypeError(`${identifier} not found, or not an HTMLElement.`)
}

/**
 * @param {string} identifier
 * @param {Element | Document} base
 * @returns {HTMLInputElement}
 */
function safeQueryHTMLElementInput(identifier, base = document) {
	const element = base.querySelector(identifier)
	if (element instanceof HTMLInputElement) {
		return element
	}
	throw new TypeError(`${identifier} not found, or not of type HTMLInputElement.`)
}
