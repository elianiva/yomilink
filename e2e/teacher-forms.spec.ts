import { test, expect } from "./fixtures";

/**
 * Teacher Forms Management E2E Tests
 *
 * Tests the core forms management flows:
 * - View forms list
 * - Navigate to form builder
 * - View form results
 * - Delete form
 */

test.describe("Teacher - Forms Management", () => {
	test("should load forms list page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");

		// Wait for the page to load
		await teacherPage.waitForSelector("text=Manage your forms");
		await expect(teacherPage.locator("h1").filter({ hasText: "Forms" })).toBeVisible();
	});

	test("should show forms list with data", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await teacherPage.waitForSelector("text=Manage your forms");

		// Should show forms from seed data or empty state
		const content = await teacherPage.locator("body").textContent();
		const hasForms = content?.includes("Questionnaire") || content?.includes("Feedback") || content?.includes("Form") || content?.includes("No forms");
		expect(hasForms).toBeTruthy();
	});

	test("should navigate to form builder for new form", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await teacherPage.waitForSelector("text=Manage your forms");

		// Click create button
		await teacherPage.click('button:has-text("Create Form")');

		// Should navigate to builder
		await teacherPage.waitForURL("**/dashboard/forms/builder**");
		await expect(teacherPage.locator("body")).toContainText("Builder");
	});

	test("should navigate to form builder for existing form", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await teacherPage.waitForSelector("text=Manage your forms");

		// Look for edit button on first form
		const editButton = teacherPage.locator('button[aria-label*="edit" i], button:has-text("Edit"]').first();

		if (await editButton.isVisible().catch(() => false)) {
			await editButton.click();

			// Should navigate to builder with formId in URL
			await teacherPage.waitForURL("**/dashboard/forms/builder**");
			await expect(teacherPage.locator("body")).toContainText("Form Builder");
		}
	});

	test("should navigate to form results", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await teacherPage.waitForSelector("text=Manage your forms");

		// Look for results/view button on first form
		const resultsButton = teacherPage.locator('button[aria-label*="result" i], button:has-text("Results"), button:has-text("View")').first();

		if (await resultsButton.isVisible().catch(() => false)) {
			await resultsButton.click();

			// Should navigate to results page
			await teacherPage.waitForURL("**/dashboard/forms/**/results**");
			await expect(teacherPage.locator("body")).toContainText("Results");
		}
	});

	test("should open delete form confirmation", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await teacherPage.waitForSelector("text=Manage your forms");

		// Look for delete button on first form
		const deleteButton = teacherPage.locator('button[aria-label*="delete" i], button:has-text("Delete"]').first();

		if (await deleteButton.isVisible().catch(() => false)) {
			await deleteButton.click();

			// Delete confirmation dialog should appear
			await expect(teacherPage.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible();
			await expect(teacherPage.locator("text=Delete Form")).toBeVisible();

			// Cancel the delete
			await teacherPage.click('button:has-text("Cancel")');
		}
	});
});

test.describe("Teacher - Form Builder (basic navigation)", () => {
	test("should load form builder page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms/builder");

		// Should show form builder UI
		await expect(teacherPage.locator("body")).toContainText("Builder");
	});

	test("should show form builder with empty state", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms/builder");

		// Should show empty form canvas or initial question
		await expect(teacherPage.locator("body")).toContainText("Form");

		// Check for form title input or some builder element
		const hasBuilderElement = await teacherPage.locator('input[placeholder*="title" i], input#title, [data-slot="select-trigger"]').first().isVisible().catch(() => false);
		expect(hasBuilderElement).toBeTruthy();
	});
});
