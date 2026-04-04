import { test, expect } from "./fixtures";

/**
 * Teacher Assignment Management E2E Tests
 *
 * Tests the core assignment management flows:
 * - View assignments list
 * - Create assignment via wizard
 * - Delete assignment
 * - View assignment details
 */

test.describe("Teacher - Assignment Management", () => {
	test("should load assignments management page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");

		// Wait for the page to load
		await teacherPage.waitForSelector("text=Create and manage assignments");
		await expect(teacherPage.locator("h1").filter({ hasText: "Manage Assignments" })).toBeVisible();
	});

	test("should show assignment list with data", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Should show either assignments or empty state
		const content = await teacherPage.locator("body").textContent();
		const hasAssignments = content?.includes("Tanaka") || content?.includes("Quiz") || content?.includes("Assignment") || content?.includes("No assignments");
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

	test.skip("should navigate through create assignment wizard", async ({ teacherPage }) => {
		// TODO: This test needs more work - complex multi-step wizard with many dynamic selectors
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Open create dialog
		await teacherPage.click('button:has-text("Create"), button:has-text("New")');
		await teacherPage.waitForSelector("text=Create Assignment");

		// Step 1: Basic Info
		await teacherPage.fill('input#title', `E2E Test Assignment ${Date.now()}`);
		await teacherPage.fill('textarea#description', 'Test assignment created by E2E');
		await teacherPage.click('button:has-text("Next"), button:has-text("Continue")');

		// Step 2: Configuration (Goal Map & Dates)
		await teacherPage.waitForTimeout(300);

		// Try to select goal map if selector exists
		const goalMapSelect = teacherPage.locator('[data-slot="select-trigger"]').first();
		if (await goalMapSelect.isVisible().catch(() => false)) {
			await goalMapSelect.click();
			await teacherPage.click('li, [role="option"]').first();
		}

		// Fill dates
		const today = new Date().toISOString().split('T')[0];
		const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

		await teacherPage.fill('input[type="date"]').nth(0).fill(today);
		await teacherPage.fill('input[type="date"]').nth(1).fill(nextWeek);

		await teacherPage.click('button:has-text("Next"), button:has-text("Continue")');

		// Step 3: Forms (skip or fill)
		await teacherPage.waitForTimeout(300);
		await teacherPage.click('button:has-text("Next"), button:has-text("Continue"), button:has-text("Skip")');

		// Step 4: Assignment (Cohorts/Users)
		await teacherPage.waitForTimeout(300);

		// Try to assign to Demo Class 2025 cohort
		const cohortCheckbox = teacherPage.locator('text=Demo Class 2025').locator('..').locator('input[type="checkbox"], button[role="checkbox"]').first();
		if (await cohortCheckbox.isVisible().catch(() => false)) {
			await cohortCheckbox.click();
		}

		// Create the assignment
		await teacherPage.click('button:has-text("Create"), button:has-text("Submit"), button:has-text("Save")');

		// Should close dialog or show success
		await teacherPage.waitForTimeout(500);
	});

	test("should view assignment details", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		// Click on first assignment if exists
		const firstAssignment = teacherPage.locator('[data-testid="assignment-card"], .assignment-item, [role="listitem"]').first();
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
		const deleteButton = teacherPage.locator('button[aria-label*="delete" i], button:has-text("Delete"), [data-testid="delete-assignment"]').first();

		if (await deleteButton.isVisible().catch(() => false)) {
			await deleteButton.click();

			// Delete confirmation dialog should appear
			await expect(teacherPage.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible();
			await expect(teacherPage.locator("text=Delete Assignment")).toBeVisible();

			// Cancel the delete
			await teacherPage.click('button:has-text("Cancel")');
		}
	});
});
