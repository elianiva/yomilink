import { test, expect } from "@playwright/test";

import {
	fillSignupAccountStep,
	fillSignupAcademicStep,
	fillSignupPersonalStep,
	whitelistAccounts,
} from "./signup-helpers";

test.describe("Signup - Step 1: Account", () => {
	test("should complete account step with valid data", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[0]);
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should show error when passwords don't match", async ({ page }) => {
		await page.goto("/signup");
		await page.locator("#studentId").click();
		await page.getByPlaceholder("Search your name or student ID").fill(whitelistAccounts[0].studentId);
		await page.getByText(whitelistAccounts[0].name + " (" + whitelistAccounts[0].studentId + ")", { exact: true }).click();
		await page.locator("#password").fill("password123");
		await page.locator("#confirmPassword").fill("differentpassword");
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator("text=Passwords do not match")).toBeVisible();
	});

	test("should prevent reusing the same reserved account", async ({ page }) => {
		const acc = whitelistAccounts[1];
		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "6", mediaConsumption: "3" });
		await page.locator('button:has-text("Next")').click();
		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();
		await expect(page).toHaveURL("/login");

		await page.goto("/signup");
		await fillSignupAccountStep(page, acc);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "6", mediaConsumption: "3" });
		await page.locator('button:has-text("Next")').click();
		await page.locator("#consentGiven").click();
		await page.locator('button:has-text("Create Account")').click();
		await expect(page.locator("text=already exists")).toBeVisible();
	});
});

test.describe("Signup - Step 2: Personal", () => {
	test("should complete personal step with required fields", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[2]);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N4 (Elementary)" });
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});

	test("should fill optional fields in personal step", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[3]);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "22", jlptLabel: "N3 (Intermediate)" });
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Step 3: Academic", () => {
	test("should require academic details step to be valid", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[4]);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();
	});

	test("should select study group from dropdown", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[5]);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Experiment", japaneseLearningDuration: "6", mediaConsumption: "2" });
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Step 4: Consent", () => {
	test("should require consent checkbox", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[6]);
		await page.locator('button:has-text("Next")').click();
		await fillSignupPersonalStep(page, { age: "20", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();
		await fillSignupAcademicStep(page, { studyGroup: "Control", japaneseLearningDuration: "6", mediaConsumption: "2" });
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator('button:has-text("Create Account")')).toBeDisabled();
	});
});
