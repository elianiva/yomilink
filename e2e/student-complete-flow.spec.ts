import { test, expect } from "@playwright/test";

import {
	completeConsentStep,
	fillSignupAccountStep,
	fillSignupAcademicStep,
	fillSignupPersonalStep,
	loginWithStudentId,
	whitelistAccounts,
} from "./signup-helpers";

test.describe.configure({ mode: "serial" });

test.describe("Student Complete Learning Flow", () => {
	test("should sign up, log in, and reach assignments", async ({ page }) => {
		const account = whitelistAccounts[18];
		await page.goto("/signup");
		await fillSignupAccountStep(page, account);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "6", mediaConsumption: "2" });
		await page.locator('button:has-text("Next")').click();
		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();

		await expect(page).toHaveURL("/login");
		await loginWithStudentId(page, account.studentId, account.password);
		await expect(page).toHaveURL("/dashboard/assignments");
	});
});
