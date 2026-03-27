import { expect, test } from "@playwright/test"

test.describe("Javelin Idle functional tests", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/")
		// Wait for the game to initialize — score display should be present
		await expect(page.locator(".score-value")).toBeVisible()
	})

	test("game initializes with score 0 and a goal displayed", async ({ page }) => {
		const score = await page.locator(".score-value").textContent()
		expect(score).toBe("0")

		const goalChars = page.locator(".goal-value .char-token")
		await expect(goalChars.first()).toBeVisible()
	})

	test("cheat code adds 1000 to score", async ({ page }) => {
		const input = page.locator(".typing-input")
		await input.focus()

		// Type the cheat code character by character
		for (const char of "ababvoidgloom*") {
			await input.press(char)
		}

		// Score should be at least 1000 (scoreMulti=1, so scoreSuccess adds 1 on top of the 1000)
		await expect(async () => {
			const scoreText = await page.locator(".score-value").textContent()
			const score = Number.parseInt(scoreText ?? "0", 10)
			expect(score).toBeGreaterThanOrEqual(1000)
		}).toPass({ timeout: 2000 })
	})

	test("upgrade card is revealed when score reaches threshold", async ({ page }) => {
		const input = page.locator(".typing-input")
		await input.focus()

		// First upgrade (Two finger typer) has cost=20, threshold=20*3/4=15
		// Use cheat code to get score above threshold
		for (const char of "ababvoidgloom*") {
			await input.press(char)
		}

		// Wait for the game loop to reveal upgrades (runs every 100ms)
		await expect(async () => {
			const firstUpgrade = page.locator(".upgrade").first()
			await expect(firstUpgrade).not.toHaveClass(/unavailable/)
		}).toPass({ timeout: 2000 })
	})

	test("typing correct goal character scores a point", async ({ page }) => {
		const input = page.locator(".typing-input")
		await input.focus()

		// Read the current goal character
		const goalToken = page.locator(".goal-value .char-token")
		const goalChar = await goalToken.first().textContent()
		expect(goalChar).toBeTruthy()

		// Type the goal character
		await input.press(goalChar as string)

		// Score should now be 1
		await expect(async () => {
			const scoreText = await page.locator(".score-value").textContent()
			expect(scoreText).toBe("1")
		}).toPass({ timeout: 2000 })
	})

	test("completion mode activates when selector key is typed with enough score", async ({ page }) => {
		const input = page.locator(".typing-input")
		await input.focus()

		// Use cheat code to get score
		for (const char of "ababvoidgloom*") {
			await input.press(char)
		}

		// Wait for upgrade to be revealed
		await expect(async () => {
			const firstUpgrade = page.locator(".upgrade").first()
			await expect(firstUpgrade).not.toHaveClass(/unavailable/)
		}).toPass({ timeout: 2000 })

		// Read the selector key from the first upgrade card's key-value char-tokens
		const keyTokens = page.locator(".upgrade").first().locator(".key-value .char-token")
		await expect(keyTokens.first()).toBeVisible()
		const tokenCount = await keyTokens.count()
		let selectorKey = ""
		for (let i = 0; i < tokenCount; i++) {
			selectorKey += await keyTokens.nth(i).textContent()
		}

		// Type the selector key
		for (const char of selectorKey) {
			await input.press(char)
		}

		// The upgrade card should now have completion-active class
		await expect(page.locator(".upgrade").first()).toHaveClass(/completion-active/)

		// Goal title should change to "Purchase: "
		await expect(page.locator(".goal-title")).toHaveText("Purchase: ")
	})

	test("pressing $ exits completion mode", async ({ page }) => {
		const input = page.locator(".typing-input")
		await input.focus()

		// Use cheat code to get score
		for (const char of "ababvoidgloom*") {
			await input.press(char)
		}

		// Wait for upgrade to be revealed
		await expect(async () => {
			const firstUpgrade = page.locator(".upgrade").first()
			await expect(firstUpgrade).not.toHaveClass(/unavailable/)
		}).toPass({ timeout: 2000 })

		// Read the selector key
		const keyTokens = page.locator(".upgrade").first().locator(".key-value .char-token")
		await expect(keyTokens.first()).toBeVisible()
		const tokenCount = await keyTokens.count()
		let selectorKey = ""
		for (let i = 0; i < tokenCount; i++) {
			selectorKey += await keyTokens.nth(i).textContent()
		}

		// Enter completion mode
		for (const char of selectorKey) {
			await input.press(char)
		}
		await expect(page.locator(".upgrade").first()).toHaveClass(/completion-active/)

		// Press $ to exit
		await input.press("$")

		// Should be back to normal mode
		await expect(page.locator(".upgrade").first()).not.toHaveClass(/completion-active/)
		await expect(page.locator(".goal-title")).toHaveText("Type: ")
	})

	test("all upgrade cards start hidden", async ({ page }) => {
		// Before any scoring, all upgrade cards should have .unavailable
		const upgrades = page.locator(".upgrade")
		const count = await upgrades.count()
		expect(count).toBe(6)
		for (let i = 0; i < count; i++) {
			await expect(upgrades.nth(i)).toHaveClass(/unavailable/)
		}
	})
})
