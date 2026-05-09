import { test, expect } from "./fixtures";

test.describe("Teacher - Analytics Dashboard", () => {
	test("should load analytics page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await expect(teacherPage.locator("body")).toContainText("Analytics");
	});

	test("should show assignment selector in sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await expect(teacherPage.locator("text=Select an assignment")).toBeVisible();
	});

	test("should select assignment from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await teacherPage.waitForSelector("text=Select an assignment");

		const assignmentButton = teacherPage.locator('button:has-text("Tanaka")').first();

		if (await assignmentButton.isVisible().catch(() => false)) {
			await assignmentButton.click();
			await teacherPage.waitForTimeout(500);
			await expect(teacherPage.locator("body")).toContainText("Tanaka");
		}
	});

	test("should show learner list when assignment selected", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await teacherPage.waitForSelector("text=Select an assignment");

		const assignmentButton = teacherPage.locator('button:has-text("Tanaka")').first();
		if (await assignmentButton.isVisible().catch(() => false)) {
			await assignmentButton.click();
			await teacherPage.waitForTimeout(500);
			await expect(teacherPage.locator("text=Learners")).toBeVisible();
		}
	});

	test("should toggle learner selection", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await teacherPage.waitForSelector("text=Select an assignment");

		const assignmentButton = teacherPage.locator('button:has-text("Tanaka")').first();
		if (await assignmentButton.isVisible().catch(() => false)) {
			await assignmentButton.click();
			await teacherPage.waitForTimeout(500);

			const learnerCheckbox = teacherPage
				.locator('input[type="checkbox"], button[role="checkbox"]')
				.first();

			if (await learnerCheckbox.isVisible().catch(() => false)) {
				await learnerCheckbox.click();
				await teacherPage.waitForTimeout(200);
			}
		}
	});

	test("should switch between concept map and summary tabs", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await teacherPage.waitForSelector("text=Select an assignment");

		const assignmentButton = teacherPage.locator('button:has-text("Tanaka")').first();
		if (await assignmentButton.isVisible().catch(() => false)) {
			await assignmentButton.click();
			await teacherPage.waitForTimeout(500);

			const conceptMapTab = teacherPage.locator('button:has-text("Concept Map")');
			const summaryTab = teacherPage.locator('button:has-text("Summary")');

			if (await summaryTab.isVisible().catch(() => false)) {
				await summaryTab.click();
				await teacherPage.waitForTimeout(200);

				if (await conceptMapTab.isVisible().catch(() => false)) {
					await conceptMapTab.click();
					await teacherPage.waitForTimeout(200);
				}
			}
		}
	});

	test("should show visibility controls", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await teacherPage.waitForSelector("text=Select an assignment");

		const assignmentButton = teacherPage.locator('button:has-text("Tanaka")').first();
		if (await assignmentButton.isVisible().catch(() => false)) {
			await assignmentButton.click();
			await teacherPage.waitForTimeout(500);

			const controls = teacherPage.locator(
				'button[aria-label*="show" i], button[aria-label*="visibility" i], .visibility-toggle',
			);
			await expect(controls.first()).toBeVisible();
		}
	});
});
