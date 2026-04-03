import { test, expect } from "./fixtures";

test.describe("Login - Basic Flows", () => {
	test("should login as student and redirect to assignments", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("demo12345");
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL("/dashboard/assignments");
		await expect(page.locator("body")).toContainText("Assignments");
	});

	test("should login as teacher and redirect to dashboard", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("teacher@demo.local");
		await page.locator("#password").fill("teacher123");
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL("/dashboard");
		await expect(page.locator("body")).toContainText("Dashboard");
	});

	test("should show loading state during submit", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("demo12345");

		// Click and immediately check for loading text
		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		// Button should show loading text briefly
		await expect(submitButton).toContainText("Signing in...");
	});

	test("should persist session on page reload", async ({ page }) => {
		// Login first
		await page.goto("/login");
		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("demo12345");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL("/dashboard/assignments");

		// Reload and verify still authenticated
		await page.reload();
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});

test.describe("Login - Validation Errors", () => {
	test("should show error for empty email", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#password");
		await page.locator("#password").fill("demo12345");
		await page.locator('button[type="submit"]').click();

		// Check validation error appears
		await expect(page.locator("text=Required")).toBeVisible();
	});

	test("should show error for empty password", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator('button[type="submit"]').click();

		// Check validation error appears
		await expect(page.locator("text=Required")).toBeVisible();
	});

	test("should show error for wrong password", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("wrongpassword");
		await page.locator('button[type="submit"]').click();

		await expect(page.locator("text=Incorrect email or password")).toBeVisible();
	});

	test("should show error for non-existent account", async ({ page }) => {
		await page.goto("/login");

		await page.waitForSelector("#email");
		await page.locator("#email").fill("nonexistent@demo.local");
		await page.locator("#password").fill("somepassword123");
		await page.locator('button[type="submit"]').click();

		await expect(page.locator("text=Account not found")).toBeVisible();
	});

	test("should clear error when user fixes input", async ({ page }) => {
		await page.goto("/login");

		// Trigger error
		await page.waitForSelector("#email");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("wrongpassword");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Incorrect email or password")).toBeVisible();

		// Fix password and submit again
		await page.locator("#password").fill("demo12345");
		await page.locator('button[type="submit"]').click();

		// Should redirect successfully
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});
