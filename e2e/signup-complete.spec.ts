import { test, expect } from "@playwright/test";

/**
 * End-to-end signup flow tests.
 * Creates actual user accounts - run serially to avoid conflicts.
 */
test.describe.configure({ mode: "serial" });

function generateTestEmail(prefix = "complete"): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}.${timestamp}.${random}@test.local`;
}

const TEST_COHORT = "Demo Class 2025";

test.describe("Signup - Complete Flow", () => {
	test("should complete full signup wizard and redirect to login", async ({ page }) => {
		const email = generateTestEmail("full");

		// Start signup
		await page.goto("/signup");

		// === Step 1: Account ===
		await page.locator("#name").fill("Test Student");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("testpassword123");
		await page.locator("#confirmPassword").fill("testpassword123");
		await page.locator('button:has-text("Next")').click();

		// === Step 2: Personal ===
		await page.locator("#age").fill("21");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N4 (Elementary)").click();
		await page.locator("#japaneseLearningDuration").fill("12");
		await page.locator("#previousJapaneseScore").fill("80");
		await page.locator("#mediaConsumption").fill("5");
		await page.locator("#motivation").fill("Planning to study abroad in Japan");
		await page.locator('button:has-text("Next")').click();

		// === Step 3: Academic ===
		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator("#studentId").fill("STU12345");
		await page.locator('button:has-text("Next")').click();

		// === Step 4: Consent ===
		await page.locator("#consentGiven").click();

		// Submit
		await page.locator('button:has-text("Create Account")').click();

		// Wait for success and redirect
		await expect(page.locator("text=Account created successfully")).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("should login with newly created account", async ({ page }) => {
		const email = generateTestEmail("newuser");

		// Signup new user first
		await page.goto("/signup");

		// Step 1
		await page.locator("#name").fill("New Test User");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("mypassword123");
		await page.locator("#confirmPassword").fill("mypassword123");
		await page.locator('button:has-text("Next")').click();

		// Step 2
		await page.locator("#age").fill("19");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("3");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		// Step 3
		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Step 4
		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		await expect(page).toHaveURL("/login");

		// Now login with the new account
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("mypassword123");
		await page.locator('button[type="submit"]').click();

		// Should redirect to assignments (new users are students by default)
		await expect(page).toHaveURL("/dashboard/assignments");
	});

	test("should show progress indicator through all steps", async ({ page }) => {
		await page.goto("/signup");

		// Initial - Step 1 active
		await expect(page.locator("text=Account")).toHaveClass(/text-primary/);

		// Step 1
		await page.locator("#name").fill("Progress User");
		await page.locator("#email").fill(generateTestEmail("progress"));
		await page.locator("#password").fill("progress123");
		await page.locator("#confirmPassword").fill("progress123");
		await page.locator('button:has-text("Next")').click();

		// Step 2 active
		await expect(page.locator("text=Personal Information")).toBeVisible();

		// Step 2
		await page.locator("#age").fill("25");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N3 (Intermediate)").click();
		await page.locator("#japaneseLearningDuration").fill("24");
		await page.locator("#mediaConsumption").fill("10");
		await page.locator('button:has-text("Next")').click();

		// Step 3 active
		await expect(page.locator("text=Academic Information")).toBeVisible();

		// Step 3
		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Step 4 active
		await expect(page.locator("text=Research participation agreement")).toBeVisible();
	});

	test("should navigate back through steps", async ({ page }) => {
		await page.goto("/signup");

		// Fill Step 1
		await page.locator("#name").fill("Back Navigation User");
		await page.locator("#email").fill(generateTestEmail("back"));
		await page.locator("#password").fill("back123456");
		await page.locator("#confirmPassword").fill("back123456");
		await page.locator('button:has-text("Next")').click();

		// Step 2
		await page.locator("#age").fill("23");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N2 (Pre-Advanced)").click();
		await page.locator("#japaneseLearningDuration").fill("48");
		await page.locator("#mediaConsumption").fill("15");

		// Navigation from Step 2
		await page.locator('button:has-text("Previous")').click();

		// Back to Step 1 - form data should persist
		await expect(page.locator("input#name")).toHaveValue("Back Navigation User");
		await expect(page.locator("input#email")).toHaveValue(/back.*@test\.local/);
		await expect(page.locator("input#password")).toHaveValue("back123456");
	});

	test("should disable navigation buttons appropriately", async ({ page }) => {
		await page.goto("/signup");

		// Next disabled initially (empty form)
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();

		// Fill some but not all fields
		await page.locator("#email").fill("test@example.com");
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();

		// Complete step 1
		await page.locator("#name").fill("Complete User");
		await page.locator("#password").fill("complete123");
		await page.locator("#confirmPassword").fill("complete123");
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Animation/Interaction", () => {
	test("should show step transition animations", async ({ page }) => {
		await page.goto("/signup");

		// Fill Step 1
		await page.locator("#name").fill("Animation User");
		await page.locator("#email").fill(generateTestEmail("anim"));
		await page.locator("#password").fill("anim123456");
		await page.locator("#confirmPassword").fill("anim123456");

		// Trigger navigation
		await page.locator('button:has-text("Next")').click();

		// Should see Personal step after animation
		await expect(page.locator("text=Personal Information")).toBeVisible();
	});

	test("should handle rapid button clicks", async ({ page }) => {
		await page.goto("/signup");

		await page.locator("#name").fill("Rapid User");
		await page.locator("#email").fill(generateTestEmail("rapid"));
		await page.locator("#password").fill("rapid12345");
		await page.locator("#confirmPassword").fill("rapid12345");

		// Multiple rapid clicks
		const nextButton = page.locator('button:has-text("Next")');
		await nextButton.click();
		await nextButton.click();
		await nextButton.click();

		// Should only advance once
		await expect(page.locator("text=Personal Information")).toBeVisible();
	});
});
