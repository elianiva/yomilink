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

const TEST_ACCOUNT_1 = whitelistAccounts[10];
const TEST_ACCOUNT_2 = whitelistAccounts[11];

test.describe("Signup - Complete Flow", () => {
	test("should complete full signup wizard and redirect to login", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, TEST_ACCOUNT_1);
		await page.locator('button:has-text("Next")').click();

		await fillSignupPersonalStep(page, { age: "21", jlptLabel: "N4 (Elementary)" });
		await page.locator('button:has-text("Next")').click();

		await fillSignupAcademicStep(page, {
			studyGroup: "Experiment",
			japaneseLearningDuration: "12",
			previousJapaneseScore: "80",
			mediaConsumption: "5",
			motivation: "Planning to study abroad in Japan",
		});
		await page.locator('button:has-text("Next")').click();

		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();

		await expect(page.locator("text=Account created successfully")).toBeVisible();
		await expect(page).toHaveURL("/login");
	});

	test("should login with newly created account", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, TEST_ACCOUNT_2);
		await page.locator('button:has-text("Next")').click();

		await fillSignupPersonalStep(page, { age: "19", jlptLabel: "N5 (Beginner)" });
		await page.locator('button:has-text("Next")').click();

		await fillSignupAcademicStep(page, {
			studyGroup: "Control",
			japaneseLearningDuration: "3",
			mediaConsumption: "2",
		});
		await page.locator('button:has-text("Next")').click();

		await completeConsentStep(page);
		await page.locator('button:has-text("Create Account")').click();
		await expect(page).toHaveURL("/login");

		await loginWithStudentId(page, TEST_ACCOUNT_2.studentId, TEST_ACCOUNT_2.password);
		await expect(page).toHaveURL("/dashboard/assignments");
	});

	test("should show progress indicator through all steps", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.locator("text=Whitelist")).toBeVisible();

		await fillSignupAccountStep(page, whitelistAccounts[7]);
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator("text=Personal")).toBeVisible();

		await fillSignupPersonalStep(page, { age: "25", jlptLabel: "N3 (Intermediate)" });
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator("text=Academic")).toBeVisible();

		await fillSignupAcademicStep(page, {
			studyGroup: "Experiment",
			japaneseLearningDuration: "24",
			mediaConsumption: "10",
		});
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator("text=Consent")).toBeVisible();
	});

	test("should navigate back through steps", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[8]);
		await page.locator('button:has-text("Next")').click();

		await fillSignupPersonalStep(page, { age: "23", jlptLabel: "N2 (Pre-Advanced)" });
		await page.locator('button:has-text("Next")').click();

		await fillSignupAcademicStep(page, {
			studyGroup: "Control",
			japaneseLearningDuration: "48",
			mediaConsumption: "15",
		});
		await page.locator('button:has-text("Previous")').click();
		await page.locator('button:has-text("Previous")').click();

		await expect(page.locator("#password")).toHaveValue(whitelistAccounts[8].password);
	});

	test("should disable navigation buttons appropriately", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();

		await page.locator("#studentId").click();
		await page.getByPlaceholder("Search your name or student ID").fill("20260010");
		await page.getByText("Matsumoto Sora (20260010)", { exact: true }).click();
		await expect(page.locator('button:has-text("Next")')).toBeDisabled();

		await page.locator("#password").fill("complete123");
		await page.locator("#confirmPassword").fill("complete123");
		await expect(page.locator('button:has-text("Next")')).toBeEnabled();
	});
});

test.describe("Signup - Animation/Interaction", () => {
	test("should show step transition animations", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[9]);
		await page.locator('button:has-text("Next")').click();
		await expect(page.locator("text=Personal")).toBeVisible();
	});

	test("should handle rapid button clicks", async ({ page }) => {
		await page.goto("/signup");
		await fillSignupAccountStep(page, whitelistAccounts[10]);
		const nextButton = page.locator('button:has-text("Next")');
		await nextButton.click();
		await nextButton.click();
		await nextButton.click();
		await expect(page.locator("text=Personal")).toBeVisible();
	});
});
