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
		await page.fill("#name", "Test Student");
		await page.fill("#email", email);
		await page.fill("#password", "testpassword123");
		await page.fill("#confirmPassword", "testpassword123");
		await page.click('button:has-text("Next")');

		// === Step 2: Personal ===
		await page.fill("#age", "21");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N4 (Elementary)");
		await page.fill("#japaneseLearningDuration", "12");
		await page.fill("#previousJapaneseScore", "80");
		await page.fill("#mediaConsumption", "5");
		await page.fill("#motivation", "Planning to study abroad in Japan");
		await page.click('button:has-text("Next")');

		// === Step 3: Academic ===
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.fill("#studentId", "STU12345");
		await page.click('button:has-text("Next")');

		// === Step 4: Consent ===
		await page.click('input[id="consentGiven"]');

		// Submit
		await page.click('button:has-text("Create Account")');

		// Wait for success and redirect
		await expect(page.locator("text=Account created successfully")).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("should login with newly created account", async ({ page }) => {
		const email = generateTestEmail("newuser");

		// Signup new user first
		await page.goto("/signup");

		// Step 1
		await page.fill("#name", "New Test User");
		await page.fill("#email", email);
		await page.fill("#password", "mypassword123");
		await page.fill("#confirmPassword", "mypassword123");
		await page.click('button:has-text("Next")');

		// Step 2
		await page.fill("#age", "19");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "3");
		await page.fill("#mediaConsumption", "2");
		await page.click('button:has-text("Next")');

		// Step 3
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.click('button:has-text("Next")');

		// Step 4
		await page.click('input[id="consentGiven"]');
		await page.click('button:has-text("Create Account")');

		await expect(page).toHaveURL("/login");

		// Now login with the new account
		await page.fill("#email", email);
		await page.fill("#password", "mypassword123");
		await page.click('button[type="submit"]');

		// Should redirect to assignments (new users are students by default)
		await expect(page).toHaveURL("/dashboard/assignments");
	});

	test("should show progress indicator through all steps", async ({ page }) => {
		await page.goto("/signup");

		// Initial - Step 1 active
		await expect(page.locator("text=Account")).toHaveClass(/text-primary/);

		// Step 1
		await page.fill("#name", "Progress User");
		await page.fill("#email", generateTestEmail("progress"));
		await page.fill("#password", "progress123");
		await page.fill("#confirmPassword", "progress123");
		await page.click('button:has-text("Next")');

		// Step 2 active
		await expect(page.locator("text=Personal Information")).toBeVisible();

		// Step 2
		await page.fill("#age", "25");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N3 (Intermediate)");
		await page.fill("#japaneseLearningDuration", "24");
		await page.fill("#mediaConsumption", "10");
		await page.click('button:has-text("Next")');

		// Step 3 active
		await expect(page.locator("text=Academic Information")).toBeVisible();

		// Step 3
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.click('button:has-text("Next")');

		// Step 4 active
		await expect(page.locator("text=Research participation agreement")).toBeVisible();
	});

	test("should navigate back through steps", async ({ page }) => {
		await page.goto("/signup");

		// Fill Step 1
		await page.fill("#name", "Back Navigation User");
		await page.fill("#email", generateTestEmail("back"));
		await page.fill("#password", "back123456");
		await page.fill("#confirmPassword", "back123456");
		await page.click('button:has-text("Next")');

		// Step 2
		await page.fill("#age", "23");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N2 (Pre-Advanced)");
		await page.fill("#japaneseLearningDuration", "48");
		await page.fill("#mediaConsumption", "15");

		// Navigation from Step 2
		await page.click('button:has-text("Previous")');

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
		await page.fill("#email", "test@example.com");
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();

		// Complete step 1
		await page.fill("#name", "Complete User");
		await page.fill("#password", "complete123");
		await page.fill("#confirmPassword", "complete123");
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Animation/Interaction", () => {
	test("should show step transition animations", async ({ page }) => {
		await page.goto("/signup");

		// Fill Step 1
		await page.fill("#name", "Animation User");
		await page.fill("#email", generateTestEmail("anim"));
		await page.fill("#password", "anim123456");
		await page.fill("#confirmPassword", "anim123456");

		// Trigger navigation
		await page.click('button:has-text("Next")');

		// Should see Personal step after animation
		await expect(page.locator("text=Personal Information")).toBeVisible();
	});

	test("should handle rapid button clicks", async ({ page }) => {
		await page.goto("/signup");

		await page.fill("#name", "Rapid User");
		await page.fill("#email", generateTestEmail("rapid"));
		await page.fill("#password", "rapid12345");
		await page.fill("#confirmPassword", "rapid12345");

		// Multiple rapid clicks
		const nextButton = page.locator('button:has-text("Next")');
		await nextButton.click();
		await nextButton.click();
		await nextButton.click();

		// Should only advance once
		await expect(page.locator("text=Personal Information")).toBeVisible();
	});
});
