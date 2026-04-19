import { test, expect } from "./fixtures";

import {
	completeConsentStep,
	fillSignupAccountStep,
	fillSignupAcademicStep,
	fillSignupPersonalStep,
	loginWithStudentId,
	whitelistAccounts,
} from "./signup-helpers";

function account(index: number) {
	return whitelistAccounts[index];
}

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
		const acc = account(12);
		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();

		await fillSignupPersonalStep(page, { age: "22", jlptLabel: "N4 (Elementary)" });
		await page.locator('button:has-text("Next")').click();

		await fillSignupAcademicStep(page, {
			studyGroup: "Experiment",
			japaneseLearningDuration: "12",
			mediaConsumption: "4",
		});
		await page.locator('button:has-text("Next")').click();

		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();

		await expect(page.locator("text=Account created successfully")).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("should login immediately after signup", async ({ page }) => {
		const acc = account(13);
		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Control", japaneseLearningDuration: "6", mediaConsumption: "2" });
		await page.locator('button:has-text("Next")').click();
		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();
		await expect(page).toHaveURL("/login");

		await loginWithStudentId(page, acc.studentId, acc.password);
		await expect(page).toHaveURL("/dashboard/assignments");
	});

	test("should persist session across page reloads after signup", async ({ page }) => {
		const acc = account(14);
		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "25", jlptLabel: "N3 (Intermediate)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "24", mediaConsumption: "8" });
		await page.locator('button:has-text("Next")').click();
		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();
		await expect(page).toHaveURL("/login");

		await loginWithStudentId(page, acc.studentId, acc.password);
		await expect(page).toHaveURL("/dashboard/assignments");
		await page.reload();
		await expect(page).toHaveURL("/dashboard/assignments");
	});

	test("should not share session between different browser contexts", async ({ browser }) => {
		const acc = account(15);
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		await page1.goto("/signup");
		await fillSignupAccountStep(page1, acc);
		await page1.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page1, { age: "21", jlptLabel: "N4 (Elementary)" });
		await page1.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page1, { studyGroup: "Control", japaneseLearningDuration: "12", mediaConsumption: "5" });
		await page1.locator('button:has-text("Next")').click();
		await completeConsentStep(page1);
		await page1.locator('button:has-text("Create Account")').click();
		await expect(page1).toHaveURL("/login");

		await loginWithStudentId(page1, acc.studentId, acc.password);
		await expect(page1).toHaveURL("/dashboard/assignments");

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await page2.goto("/dashboard/assignments");
		await expect(page2).toHaveURL("/login");

		await context1.close();
		await context2.close();
	});

	test("should prevent new signup while authenticated", async ({ page }) => {
		const acc = account(16);
		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "23", jlptLabel: "N4 (Elementary)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "18", mediaConsumption: "6" });
		await page.locator('button:has-text("Next")').click();
		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();
		await expect(page).toHaveURL("/login");

		await loginWithStudentId(page, acc.studentId, acc.password);
		await expect(page).toHaveURL("/dashboard/assignments");

		await page.goto("/signup");
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});
