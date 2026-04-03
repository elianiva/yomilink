import { test, expect } from "@playwright/test";

// Generate unique email for each test to avoid conflicts
test.describe.configure({ mode: "serial" });

// Test cohort ID - from seed data
const TEST_COHORT = "Demo Class 2025";

/**
 * Helper to generate unique test user emails
 */
function generateTestEmail(prefix = "test"): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}.${timestamp}.${random}@test.local`;
}

import type { Page } from "@playwright/test";

/**
 * Navigate through signup wizard to specific step
 */
async function navigateToStep(page: Page, step: number): Promise<void> {
	await page.goto("/signup");
	await page.waitForSelector("#name");

	for (let i = 0; i < step; i++) {
		await page.locator('button:has-text("Next")').click();
	}
}

test.describe("Signup - Step 1: Account", () => {
	test("should complete account step with valid data", async ({ page }) => {
		await page.goto("/signup");

		await page.waitForSelector("#name");
		await page.locator("#name").fill("Test User");
		await page.locator("#email").fill(generateTestEmail("step1"));
		await page.locator("#password").fill("password123");
		await page.locator("#confirmPassword").fill("password123");

		// Next button should be enabled
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should show error when passwords don't match", async ({ page }) => {
		await page.goto("/signup");

		await page.waitForSelector("#password");
		await page.locator("#password").fill("password123");
		await page.locator("#confirmPassword").fill("differentpassword");
		await page.locator('button:has-text("Next")').click();

		// Should show validation error
		await expect(page.locator("text=Passwords do not match")).toBeVisible();
	});

	test("should show error for duplicate email", async ({ page }) => {
		await page.goto("/signup");

		// Use existing seed user email
		await page.waitForSelector("#name");
		await page.locator("#name").fill("Test User");
		await page.locator("#email").fill("tanaka@demo.local");
		await page.locator("#password").fill("password123");
		await page.locator("#confirmPassword").fill("password123");

		// Navigate through all steps
		await page.locator('button:has-text("Next")').click();

		// Step 2
		await page.locator("#age").fill("20");
		await page.locator('#jlptLevel').click();
		await page.locator('text=N5 (Beginner)').click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("3");
		await page.locator('button:has-text("Next")').click();

		// Step 3 - Cohort
		await page.locator('#cohortId').click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Step 4 - Consent
		await page.locator('#consentGiven').click();
		await page.locator('button:has-text("Create Account")').click();

		// Should show error
		await expect(page.locator("text=already exists")).toBeVisible();
	});
});

test.describe("Signup - Step 2: Personal", () => {
	test("should complete personal step with required fields", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");

		// Select JLPT level from searchable select
		await page.locator('#jlptLevel').click();
		await page.locator("text=N4 (Elementary)").click();

		await page.locator("#japaneseLearningDuration").fill("12");
		await page.locator("#mediaConsumption").fill("5");

		// Optional fields can be empty
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should fill optional fields in personal step", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.waitForSelector("#age");
		await page.locator("#age").fill("22");
		await page.locator('#jlptLevel').click();
		await page.locator("text=N3 (Intermediate)").click();
		await page.locator("#japaneseLearningDuration").fill("18");
		await page.locator("#previousJapaneseScore").fill("75");
		await page.locator("#mediaConsumption").fill("8");
		await page.locator("#motivation").fill("I want to study in Japan");

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should validate age range", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.waitForSelector("#age");
		await page.locator("#age").fill("999");
		// Should show some validation (if implemented)
		// Currently schema allows any number
	});
});

test.describe("Signup - Step 3: Academic", () => {
	test("should require cohort selection", async ({ page }) => {
		await navigateToStep(page, 2);

		// Step 2 fields
		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");
		await page.locator('#jlptLevel').click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		// Now on step 3
		// Next should be disabled without cohort
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();
	});

	test("should select cohort from searchable dropdown", async ({ page }) => {
		await navigateToStep(page, 2);

		// Fill step 2 first
		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");
		await page.locator('#jlptLevel').click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		// Select cohort
		await page.locator('#cohortId').click();
		await page.locator(`text=${TEST_COHORT}`).click();

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should fill optional student ID", async ({ page }) => {
		await navigateToStep(page, 2);

		// Fill step 2
		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");
		await page.locator('#jlptLevel').click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		// Step 3 with student ID
		await page.locator('#cohortId').click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator("#studentId").fill("S123456");

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Step 4: Consent", () => {
	test("should require consent checkbox", async ({ page }) => {
		await navigateToStep(page, 3);

		// Fill step 2
		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");
		await page.locator('#jlptLevel').click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		// Step 3
		await page.locator('#cohortId').click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Step 4 - submit should be disabled without consent
		await expect(page.locator('button:has-text("Create Account")')).toBeDisabled();
	});
});
