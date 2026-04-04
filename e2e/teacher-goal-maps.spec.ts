import { test, expect } from "./fixtures";

/**
 * Teacher Goal Maps Management E2E Tests
 *
 * Tests the core goal map management flows:
 * - View dashboard with topics
 * - Select topic to see goal maps
 * - Navigate to goal map editor
 * - Delete goal map
 */

test.describe("Teacher - Goal Maps Dashboard", () => {
	test("should load dashboard with topics list", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");

		// Wait for the page to load
		await teacherPage.waitForSelector("text=Topics");

		// Topics panel should be visible
		await expect(teacherPage.locator("text=Topics")).toBeVisible();
	});

	test("should select topic and show goal maps", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click on first topic if available
		const firstTopic = teacherPage.locator('button:has-text("Japanese Vocabulary"), button:has-text("Grammar"), .topic-item, [role="button"]').first();

		if (await firstTopic.isVisible().catch(() => false)) {
			await firstTopic.click();

			// Should show goal maps panel with selected topic title
			await teacherPage.waitForTimeout(300);
			await expect(teacherPage.locator("text=Goal Maps")).toBeVisible();
		}
	});

	test("should navigate to new goal map editor", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click New Goal Map button
		await teacherPage.click('a:has-text("New Goal Map"), button:has-text("New Goal Map")');

		// Should navigate to goal map editor with 'new' param
		await teacherPage.waitForURL("**/dashboard/goal-map/new**");
		await expect(teacherPage.locator("body")).toContainText("Goal Map");
	});

	test("should open delete confirmation for goal map", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Select a topic first
		const firstTopic = teacherPage.locator('button:has-text("Japanese Vocabulary"), button:has-text("Grammar"), .topic-item').first();

		if (await firstTopic.isVisible().catch(() => false)) {
			await firstTopic.click();
			await teacherPage.waitForTimeout(300);

			// Look for goal map card with delete button
			const deleteButton = teacherPage.locator('[data-testid="delete-goalmap"], button[aria-label*="delete" i]').first();

			if (await deleteButton.isVisible().catch(() => false)) {
				await deleteButton.click();

				// Should show confirmation dialog
				await expect(teacherPage.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible();

				// Cancel
				await teacherPage.click('button:has-text("Cancel")');
			}
		}
	});
});

test.describe("Teacher - Goal Map Editor (basic navigation)", () => {
	test("should load goal map editor with new param", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/goal-map/new");

		// Should show goal map editor UI
		await expect(teacherPage.locator("body")).toContainText("Goal Map");
	});

	test("should load existing goal map editor", async ({ teacherPage }) => {
		// First get a goal map ID from the dashboard
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Select a topic
		const firstTopic = teacherPage.locator('button:has-text("Japanese Vocabulary"), button:has-text("Grammar"), .topic-item').first();

		if (await firstTopic.isVisible().catch(() => false)) {
			await firstTopic.click();
			await teacherPage.waitForTimeout(300);

			// Look for a goal map link
			const goalMapLink = teacherPage.locator('a[href*="/dashboard/goal-map/"], .goal-map-card').first();

			if (await goalMapLink.isVisible().catch(() => false)) {
				await goalMapLink.click();
				await teacherPage.waitForURL("**/dashboard/goal-map/**");

				// Should be on goal map editor
				await expect(teacherPage.locator("body")).toContainText("Goal Map");
			}
		}
	});
});
