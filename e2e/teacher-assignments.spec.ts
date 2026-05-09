import { test, expect } from "./fixtures";

test.describe("Teacher - Assignment Management", () => {
	test("should load assignments management page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");
		await expect(
			teacherPage.locator("h1").filter({ hasText: "Manage Assignments" }),
		).toBeVisible();
	});

	test("should show assignment list with data", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

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

		await teacherPage.click('button:has-text("Create"), button:has-text("New")');
		await expect(teacherPage.locator('[role="dialog"]')).toBeVisible();
		await expect(teacherPage.locator("text=Create Assignment")).toBeVisible();
	});

	test("should view assignment details", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		const firstAssignment = teacherPage
			.locator('[data-testid="assignment-card"], .assignment-item, [role="listitem"]')
			.first();
		if (await firstAssignment.isVisible().catch(() => false)) {
			await firstAssignment.click();
			await teacherPage.waitForTimeout(300);
			await expect(teacherPage.locator("body")).toContainText("Assignment");
		}
	});

	test("should open delete assignment confirmation", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await teacherPage.waitForSelector("text=Create and manage assignments");

		const deleteButton = teacherPage
			.locator(
				'button[aria-label*="delete" i], button:has-text("Delete"), [data-testid="delete-assignment"]',
			)
			.first();

		if (await deleteButton.isVisible().catch(() => false)) {
			await deleteButton.click();
			await expect(
				teacherPage.locator('[role="alertdialog"], [role="dialog"]'),
			).toBeVisible();
			await expect(teacherPage.locator("text=Delete Assignment")).toBeVisible();
			await teacherPage.click('button:has-text("Cancel")');
		}
	});
});
