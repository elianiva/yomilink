import { test, expect } from "./fixtures";

/**
 * Signup authentication flow tests using fixtures.
 * Tests the complete signup-to-authenticated-session flow.
 * All tests run serially to avoid user creation conflicts.
 */

function generateTestEmail(prefix = "authspec"): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}.${timestamp}.${random}@test.local`;
}

const TEST_COHORT = "Demo Class 2025";

test.describe("Signup - Authenticated Redirection", () => {
	test("should redirect authenticated student away from signup", async ({ studentPage }) => {
		await studentPage.goto("/signup");

		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});

	test("should redirect authenticated teacher away from signup", async ({ teacherPage }) => {
		await teacherPage.goto("/signup");

		await expect(teacherPage).toHaveURL("/dashboard");
	});

	test("should redirect authenticated student away from login", async ({ studentPage }) => {
		await studentPage.goto("/login");

		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});
});

test.describe("Signup - Complete Flow with Auth", () => {
	test("should signup new user and redirect to login", async ({ page }) => {
		const email = generateTestEmail("newuser");

		await page.goto("/signup");

		// Step 1: Account
		await page.locator("#name").fill("Auth Test User");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("authpassword123");
		await page.locator("#confirmPassword").fill("authpassword123");
		await page.locator('button:has-text("Next")').click();

		// Step 2: Personal
		await page.locator("#age").fill("22");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N4 (Elementary)").click();
		await page.locator("#japaneseLearningDuration").fill("12");
		await page.locator("#mediaConsumption").fill("4");
		await page.locator('button:has-text("Next")').click();

		// Step 3: Academic
		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		// Step 4: Consent
		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		// Should redirect to login on success
		await expect(page.locator("text=Account created successfully")).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("should login immediately after signup", async ({ page }) => {
		const email = generateTestEmail("immediate");
		const password = "immediate123";

		// Signup
		await page.goto("/signup");
		await page.locator("#name").fill("Immediate Login Test");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill(password);
		await page.locator("#confirmPassword").fill(password);
		await page.locator('button:has-text("Next")').click();

		await page.locator("#age").fill("20");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N5 (Beginner)").click();
		await page.locator("#japaneseLearningDuration").fill("6");
		await page.locator("#mediaConsumption").fill("2");
		await page.locator('button:has-text("Next")').click();

		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		await expect(page).toHaveURL("/login");

		// Login with newly created credentials
		await page.locator("#email").fill(email);
		await page.locator("#password").fill(password);
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL("/dashboard/assignments");
	});
});

test.describe("Signup - Session Persistence", () => {
	test("should persist session across page reloads after signup", async ({ page }) => {
		const email = generateTestEmail("persist");

		// Complete signup
		await page.goto("/signup");
		await page.locator("#name").fill("Persistence Test");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("persist123");
		await page.locator("#confirmPassword").fill("persist123");
		await page.locator('button:has-text("Next")').click();

		await page.locator("#age").fill("25");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N3 (Intermediate)").click();
		await page.locator("#japaneseLearningDuration").fill("24");
		await page.locator("#mediaConsumption").fill("8");
		await page.locator('button:has-text("Next")').click();

		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		await expect(page).toHaveURL("/login");

		// Login
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("persist123");
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL("/dashboard/assignments");

		// Reload and verify still authenticated
		await page.reload();
		await expect(page).toHaveURL("/dashboard/assignments");
		await expect(page.locator("body")).toContainText("Assignments");
	});
});

test.describe("Signup - Session Isolation", () => {
	test("should not share session between different browser contexts", async ({ browser }) => {
		const email = generateTestEmail("isolated");

		// Signup and login in context 1
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		await page1.goto("/signup");
		await page1.locator("#name").fill("Isolated User 1");
		await page1.locator("#email").fill(email);
		await page1.locator("#password").fill("isolated123");
		await page1.locator("#confirmPassword").fill("isolated123");
		await page1.locator('button:has-text("Next")').click();

		await page1.locator("#age").fill("21");
		await page1.locator("#jlptLevel").click();
		await page1.locator("text=N4 (Elementary)").click();
		await page1.locator("#japaneseLearningDuration").fill("12");
		await page1.locator("#mediaConsumption").fill("5");
		await page1.locator('button:has-text("Next")').click();

		await page1.locator("#cohortId").click();
		await page1.locator(`text=${TEST_COHORT}`).click();
		await page1.locator('button:has-text("Next")').click();

		await page1.locator("#consentGiven").click();
		await page1.locator('button:has-text("Create Account")').click();

		await expect(page1).toHaveURL("/login");

		await page1.locator("#email").fill(email);
		await page1.locator("#password").fill("isolated123");
		await page1.locator('button[type="submit"]').click();

		await expect(page1).toHaveURL("/dashboard/assignments");

		// Context 2 should not be authenticated
		const context2 = await browser.newContext();
		const page2 = await context2.newPage();

		await page2.goto("/dashboard/assignments");
		await expect(page2).toHaveURL("/login");

		await context1.close();
		await context2.close();
	});
});

test.describe("Signup - Access Control After Auth", () => {
	test("should prevent new signup while authenticated", async ({ page }) => {
		const email = generateTestEmail("accesscontrol");

		// Signup first user
		await page.goto("/signup");
		await page.locator("#name").fill("First User");
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("access123");
		await page.locator("#confirmPassword").fill("access123");
		await page.locator('button:has-text("Next")').click();

		await page.locator("#age").fill("23");
		await page.locator("#jlptLevel").click();
		await page.locator("text=N4 (Elementary)").click();
		await page.locator("#japaneseLearningDuration").fill("18");
		await page.locator("#mediaConsumption").fill("6");
		await page.locator('button:has-text("Next")').click();

		await page.locator("#cohortId").click();
		await page.locator(`text=${TEST_COHORT}`).click();
		await page.locator('button:has-text("Next")').click();

		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();

		await expect(page).toHaveURL("/login");

		// Login
		await page.locator("#email").fill(email);
		await page.locator("#password").fill("access123");
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL("/dashboard/assignments");

		// Try to access signup while logged in
		await page.goto("/signup");

		// Should be redirected away
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});
