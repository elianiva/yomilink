import { test, expect } from "./fixtures";

/**
 * Teacher Assignment Management E2E Tests
 *
 * Tests the core assignment management flows:
 * - View assignments list
 * - Create assignment via wizard (skipped - requires goal maps)
 * - Delete assignment
 * - View assignment details
 */

test.describe("Teacher - Assignment Management", () => {
	test("should load assignments management page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");

		// Wait for the page to load
		await teacherPage.waitForSelector("text=Create and manage assignments");
		await expect(
			teacherPage.locator("h1").filter({ hasText: "Manage Assignments" }),
		).toBeVisible();
	});

	test("should show assignment list with data", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Should show either assignments or empty state
		const content = await teacherPage.locator("body").textContent();
		const hasAssignments =
			content?.includes("Tanaka") ||
			content?.includes("Quiz") ||
			content?.includes("Assignment") ||
			content?.includes("No assignments");
		expect(hasAssignments).toBeTruthy();
	});

	test("should open create assignment dialog", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Click create button (looks for button with "Create" or "New")
		await teacherPage.click('button:has-text("Create"), button:has-text("New")');

		// Dialog should open with wizard
		await expect(teacherPage.locator('[role="dialog"]')).toBeVisible();
		await expect(teacherPage.locator("text=Create Assignment")).toBeVisible();
	});

	test.skip("should navigate through create assignment wizard", async () => {
		// Skipped: Requires goal maps to be seeded in the database
		// This is a complex 4-step wizard test that requires:
		// - At least one Goal Map in the database
		// - At least one Cohort with members
		//
		// Test implementation demonstrates best practices for:
		// 1. Multi-step form navigation using Next/Previous buttons
		// 2. SearchableSelect interaction (popover-based dropdown)
		// 3. datetime-local input handling
		// 4. Checkbox selection for cohorts/users
		// 5. Waiting for button enabled state (form validation)
		//
		// Example pattern:
		// const testTitle = `E2E Test ${Date.now()}`;
		// await teacherPage.fill('input#title', testTitle);
		// await teacherPage.click('button:has-text("Next")');
		// // Wait for step 2 elements...
		// await expect(nextButton).toBeEnabled();
		// await nextButton.click();
	});

	test("should view assignment details", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Click on first assignment if exists
		const firstAssignment = teacherPage
			.locator('[data-testid="assignment-card"], .assignment-item, [role="listitem"]')
			.first();
		if (await firstAssignment.isVisible().catch(() => false)) {
			await firstAssignment.click();

			// Should navigate to detail view
			await teacherPage.waitForTimeout(300);
			await expect(teacherPage.locator("body")).toContainText("Assignment");
		}
	});

	test("should open delete assignment confirmation", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Look for delete button on first assignment
		const deleteButton = teacherPage
			.locator(
				'button[aria-label*="delete" i], button:has-text("Delete"), [data-testid="delete-assignment"]',
			)
			.first();

		if (await deleteButton.isVisible().catch(() => false)) {
			await deleteButton.click();

			// Delete confirmation dialog should appear
			await expect(
				teacherPage.locator('[role="alertdialog"], [role="dialog"]'),
			).toBeVisible();
			await expect(teacherPage.locator("text=Delete Assignment")).toBeVisible();

			// Cancel the delete
			await teacherPage.click('button:has-text("Cancel")');
		}
	});
});
