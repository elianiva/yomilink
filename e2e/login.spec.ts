import { test, expect } from "./fixtures";

import {
	completeConsentStep,
	fillSignupAccountStep,
	fillSignupAcademicStep,
	fillSignupPersonalStep,
	loginWithStudentId,
	whitelistAccounts,
} from "./signup-helpers";

async function createAccount(page: import("@playwright/test").Page, index: number) {
	const account = whitelistAccounts[index];
	await page.goto("/signup");
	await fillSignupAccountStep(page, account);
	await page.locator('button:has-text("Next")').click();
	await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
	await page.locator('button:has-text("Next")').click();
	await fillSignupAcademicStep(page, {
		studyGroup: "Experiment",
		japaneseLearningDuration: "6",
		mediaConsumption: "2",
	});
	await page.locator('button:has-text("Next")').click();
	await completeConsentStep(page);
	await page.locator('button:has-text("Create Account")').click();
	await expect(page).toHaveURL("/login");
	return account;
}

test.describe("Login - Basic Flows", () => {
	test("should login as student and redirect to assignments", async ({ page }) => {
		const account = await createAccount(page, 5);
		await loginWithStudentId(page, account.studentId, account.password);

		await expect(page).toHaveURL("/dashboard/assignments");
		await expect(page.locator("body")).toContainText("Assignments");
	});

	test("should show loading state during submit", async ({ page }) => {
		const account = await createAccount(page, 6);
		await page.goto("/login");
		await page.locator("#studentId").fill(account.studentId);
		await page.locator("#password").fill(account.password);

		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();
		await expect(submitButton).toContainText("Signing in...");
	});

	test("should persist session on page reload", async ({ page }) => {
		const account = await createAccount(page, 7);
		await loginWithStudentId(page, account.studentId, account.password);
		await expect(page).toHaveURL("/dashboard/assignments");

		await page.reload();
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});

test.describe("Login - Validation Errors", () => {
	test("should show error for empty student id", async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#password");
		await page.locator("#password").fill("demo12345");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Student ID is required")).toBeVisible();
	});

	test("should show error for empty password", async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#studentId");
		await page.locator("#studentId").fill("20260099");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Password is required")).toBeVisible();
	});

	test("should show error for wrong password", async ({ page }) => {
		const account = await createAccount(page, 8);
		await page.goto("/login");
		await page.waitForSelector("#studentId");
		await page.locator("#studentId").fill(account.studentId);
		await page.locator("#password").fill("wrongpassword");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Unable to sign in")).toBeVisible();
	});

	test("should show error for non-existent account", async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#studentId");
		await page.locator("#studentId").fill("99999999");
		await page.locator("#password").fill("somepassword123");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Account not found")).toBeVisible();
	});

	test("should clear error when user fixes input", async ({ page }) => {
		const account = await createAccount(page, 9);
		await page.goto("/login");
		await page.waitForSelector("#studentId");
		await page.locator("#studentId").fill(account.studentId);
		await page.locator("#password").fill("wrongpassword");
		await page.locator('button[type="submit"]').click();
		await expect(page.locator("text=Unable to sign in")).toBeVisible();

		await page.locator("#password").fill(account.password);
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});
