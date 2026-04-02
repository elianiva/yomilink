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

	for (let i = 0; i < step; i++) {
		await page.click('button:has-text("Next")');
	}
}

test.describe("Signup - Step 1: Account", () => {
	test("should complete account step with valid data", async ({ page }) => {
		await page.goto("/signup");

		await page.fill("#name", "Test User");
		await page.fill("#email", generateTestEmail("step1"));
		await page.fill("#password", "password123");
		await page.fill("#confirmPassword", "password123");

		// Next button should be enabled
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should show error when passwords don't match", async ({ page }) => {
		await page.goto("/signup");

		await page.fill("#password", "password123");
		await page.fill("#confirmPassword", "differentpassword");
		await page.click('button:has-text("Next")');

		// Should show validation error
		await expect(page.locator("text=Passwords do not match")).toBeVisible();
	});

	test("should show error for duplicate email", async ({ page }) => {
		await page.goto("/signup");

		// Use existing seed user email
		await page.fill("#name", "Test User");
		await page.fill("#email", "tanaka@demo.local");
		await page.fill("#password", "password123");
		await page.fill("#confirmPassword", "password123");

		// Navigate through all steps
		await page.click('button:has-text("Next")');

		// Step 2
		await page.fill("#age", "20");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "6");
		await page.fill("#mediaConsumption", "3");
		await page.click('button:has-text("Next")');

		// Step 3 - Cohort
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.click('button:has-text("Next")');

		// Step 4 - Consent
		await page.click('input[id="consentGiven"]');
		await page.click('button:has-text("Create Account")');

		// Should show error
		await expect(page.locator("text=already exists")).toBeVisible();
	});
});

test.describe("Signup - Step 2: Personal", () => {
	test("should complete personal step with required fields", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.fill("#age", "20");

		// Select JLPT level from searchable select
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N4 (Elementary)");

		await page.fill("#japaneseLearningDuration", "12");
		await page.fill("#mediaConsumption", "5");

		// Optional fields can be empty
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should fill optional fields in personal step", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.fill("#age", "22");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N3 (Intermediate)");
		await page.fill("#japaneseLearningDuration", "18");
		await page.fill("#previousJapaneseScore", "75");
		await page.fill("#mediaConsumption", "8");
		await page.fill("#motivation", "I want to study in Japan");

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should validate age range", async ({ page }) => {
		await navigateToStep(page, 1);

		await page.fill("#age", "999");
		// Should show some validation (if implemented)
		// Currently schema allows any number
	});
});

test.describe("Signup - Step 3: Academic", () => {
	test("should require cohort selection", async ({ page }) => {
		await navigateToStep(page, 2);

		// Step 2 fields
		await page.fill("#age", "20");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "6");
		await page.fill("#mediaConsumption", "2");
		await page.click('button:has-text("Next")');

		// Now on step 3
		// Next should be disabled without cohort
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();
	});

	test("should select cohort from searchable dropdown", async ({ page }) => {
		await navigateToStep(page, 2);

		// Fill step 2 first
		await page.fill("#age", "20");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "6");
		await page.fill("#mediaConsumption", "2");
		await page.click('button:has-text("Next")');

		// Select cohort
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should fill optional student ID", async ({ page }) => {
		await navigateToStep(page, 2);

		// Fill step 2
		await page.fill("#age", "20");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "6");
		await page.fill("#mediaConsumption", "2");
		await page.click('button:has-text("Next")');

		// Step 3 with student ID
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.fill("#studentId", "S123456");

		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Step 4: Consent", () => {
	test("should require consent checkbox", async ({ page }) => {
		await navigateToStep(page, 3);

		// Fill step 2
		await page.fill("#age", "20");
		await page.locator('[id="jlptLevel"]').click();
		await page.click("text=N5 (Beginner)");
		await page.fill("#japaneseLearningDuration", "6");
		await page.fill("#mediaConsumption", "2");
		await page.click('button:has-text("Next")');

		// Step 3
		await page.locator('[id="cohortId"]').click();
		await page.click(`text=${TEST_COHORT}`);
		await page.click('button:has-text("Next")');

		// Step 4 - submit should be disabled without consent
		await expect(page.locator('button:has-text("Create Account")')).toBeDisabled();
	});
});
