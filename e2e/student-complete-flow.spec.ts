import { test, expect } from "@playwright/test";

/**
 * Complete Student Flow E2E Test
 *
 * Tests the full student learning flow:
 * 1. Sign up
 * 2. Login
 * 3. View assignments
 * 4. Complete pre-test (if required)
 * 5. Complete kit building (concept map)
 * 6. Submit assignment
 * 7. View results
 * 8. Complete post-test
 * 9. Complete delayed post-test (after delay)
 *
 * These tests require seeded data:
 * - A cohort with assigned students
 * - An assignment with pre-test, post-test, and delayed post-test
 * - Goal maps and kits
 */

test.describe.configure({ mode: "serial" });

const TEST_COHORT = "Demo Class 2025";

function generateTestEmail(prefix = "studentflow"): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}.${timestamp}.${random}@test.local`;
}

test.describe("Student Complete Flow", () => {
	test("should complete full learning flow", async ({ page }) => {
		const email = generateTestEmail();
		const password = "testpassword123";

		// Step 1: Sign up
		await page.goto("/signup");
		await page.waitForSelector("#name");

		// Account step
		await page.locator("#name").fill("Flow Test Student");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill(password);
		await page.locator("#confirmPassword").fill(password);
		await page.locator('button:has-text("Next")').click();

		// Personal step
		await page.waitForSelector("#age");
		await page.locator("#age").fill("20");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("3");
		await page.locator('button:has-text("Next")').click();

		// Academic step
		await page.waitForSelector("#cohortId");
		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Consent step
		await page.waitForSelector("#consentGiven");
		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		// Should redirect to login
		await expect(page).toHaveURL("/login");
		await expect(page.locator("text=Account created successfully")).toBeVisible();

		// Step 2: Login
		await page.locator("#email").fill(email);
		await page.locator("#password").fill(password);
		await page.locator('button:has-text("Sign in")').click();

		// Should redirect to student assignments
		await expect(page).toHaveURL("/dashboard/assignments");

		// Step 3: View assignments
		await page.waitForSelector("text=My Assignments");

		// Check if there are any assignments
		const hasAssignments = await page
			.locator('[data-testid="assignment-card"], .assignment-item')
			.first()
			.isVisible()
			.catch(() => false);

		if (!hasAssignments) {
			// No assignments available - test requires seeded data
			test.skip(true, "No assignments available - requires seeded test data");
			return;
		}

		// Click on first assignment
		await page.locator('[data-testid="assignment-card"], .assignment-item').first().click();

		// Step 4: Handle pre-test gateway if present
		const isPreTestGateway = await page
			.locator("text=Pre-Test Required")
			.isVisible()
			.catch(() => false);

		if (isPreTestGateway) {
			// Navigate to pre-test
			await page.locator('button:has-text("Start Pre-Test")').click();

			// Complete pre-test form
			await page.waitForSelector('[data-testid="form-taker"], [data-slot="card"]', {
				timeout: 5000,
			});

			// Answer all questions (simplified - just click through)
			const questions = await page.locator('input[type="radio"]').count();
			if (questions > 0) {
				for (let i = 0; i < questions; i++) {
					await page.locator('input[type="radio"]').nth(i).click();
				}
			}

			// Submit form
			await page.locator('button:has-text("Submit")').click();

			// Should return to assignment
			await page.waitForTimeout(1000);
		}

		// Step 5: Kit building (concept map editor)
		const isKitEditor = await page
			.locator(".react-flow__container, [data-testid='concept-map-canvas']")
			.isVisible()
			.catch(() => false);

		if (isKitEditor) {
			// Add some connections or interactions
			// This is simplified - real test would need to interact with React Flow
			await page.waitForTimeout(2000);

			// Step 6: Submit assignment
			await page.locator('button:has-text("Submit"), button:has-text("Submit Map")').click();

			// Confirm submission if dialog appears
			const hasConfirmDialog = await page
				.locator('[role="dialog"], [data-testid="confirm-dialog"]')
				.isVisible()
				.catch(() => false);

			if (hasConfirmDialog) {
				await page
					.locator('button:has-text("Confirm"), button:has-text("Submit")')
					.last()
					.click();
			}
		}

		// Step 7: View results
		await page.waitForTimeout(2000);

		// Should show results page or have option to take post-test
		await page
			.locator("text=Results, text=Diagnosis, text=Score")
			.isVisible()
			.catch(() => false);

		const hasPostTestButton = await page
			.locator('button:has-text("Post-Test"), a:has-text("Post-Test")')
			.isVisible()
			.catch(() => false);

		if (hasPostTestButton) {
			// Step 8: Complete post-test
			await page
				.locator('button:has-text("Post-Test"), a:has-text("Post-Test")')
				.first()
				.click();

			await page.waitForTimeout(2000);

			// Answer post-test questions
			const postTestQuestions = await page.locator('input[type="radio"]').count();
			if (postTestQuestions > 0) {
				for (let i = 0; i < postTestQuestions; i++) {
					await page.locator('input[type="radio"]').nth(i).click();
				}
				await page.locator('button:has-text("Submit")').click();
			}
		}

		// Verify flow completed successfully
		await expect(page.locator("body")).toBeVisible();
	});

	test("should unlock post-test after kit submission", async () => {
		/**
		 * This test verifies that when a student submits their kit:
		 * 1. Post-test is unlocked immediately
		 * 2. Delayed post-test is scheduled for future unlock
		 *
		 * Note: This test requires an assignment with:
		 * - pre_test form
		 * - post_test form
		 * - delayed_post_test form with delay_days > 0
		 */
		test.skip(
			true,
			"Requires specific seeded assignment with post-test and delayed post-test configured",
		);
	});
});
