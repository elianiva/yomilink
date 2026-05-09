import { test, expect } from "./fixtures";

test.describe("Teacher - Assignment Wizard (Complex)", () => {
	test("create full assignment with all steps", async ({ teacherPage }) => {
		test.setTimeout(90000);
		const testTitle = `E2E Wizard Test ${Date.now()}`;

		await teacherPage.goto("/dashboard/assignments/manage");
		await expect(teacherPage.locator("text=Create and manage assignments")).toBeVisible();

		const openButton = teacherPage
			.locator("button")
			.filter({ hasText: /Create Assignment/i })
			.first();
		await openButton.click();

		await expect(teacherPage.locator('[role="dialog"]')).toBeVisible();
		await expect(teacherPage.locator('[data-slot="dialog-title"]')).toContainText(
			"Create New Assignment",
		);

		const titleInput = teacherPage.locator("input#title");
		await expect(titleInput).toBeVisible();

		await titleInput.fill(testTitle);
		await teacherPage
			.locator("textarea#description")
			.fill("End-to-end test assignment demonstrating wizard patterns");

		const nextButton = teacherPage
			.locator('button[type="button"]')
			.filter({ hasText: /^Next$/ })
			.first();
		await nextButton.click();

		const goalMapSelect = teacherPage
			.locator('button[role="combobox"]')
			.filter({ hasText: /Select a goal map/i })
			.first();
		await expect(goalMapSelect).toBeVisible();
		await goalMapSelect.click();

		const popover = teacherPage.locator("#searchable-select-listbox");
		await expect(popover).toBeVisible();

		const firstOption = popover.locator('[data-slot="cmdk-item"]').first();
		const hasOptions = await firstOption.isVisible().catch(() => false);
		if (!hasOptions) {
			await teacherPage.keyboard.press("Escape");
			await teacherPage.waitForTimeout(200);
			const cancelButton = teacherPage
				.locator("button")
				.filter({ hasText: /Cancel|Previous/ })
				.first();
			if (await cancelButton.isVisible().catch(() => false)) {
				await cancelButton.click();
			} else {
				await teacherPage.keyboard.press("Escape");
			}
			console.log("SKIPPING: No goal maps available in database");
			return;
		}

		await firstOption.click();

		const now = new Date();
		const startDate = now.toISOString().slice(0, 16);
		const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.slice(0, 16);

		const startInput = teacherPage.locator("input#startDate");
		const endInput = teacherPage.locator("input#endDate");

		if (await startInput.isVisible()) {
			await startInput.fill(startDate);
		}
		if (await endInput.isVisible()) {
			await endInput.fill(endDate);
		}

		await expect(nextButton).toBeEnabled({ timeout: 5000 });
		await nextButton.click();

		await expect(
			teacherPage
				.locator("label")
				.filter({ hasText: /Pre-Test/ })
				.first(),
		).toBeVisible();
		await nextButton.click();

		await expect(
			teacherPage
				.locator("label")
				.filter({ hasText: /Assign to Cohorts/ })
				.first(),
		).toBeVisible();

		const demoClassLabel = teacherPage
			.locator("label, div")
			.filter({ hasText: /Demo Class 2025/ })
			.first();

		if (await demoClassLabel.isVisible().catch(() => false)) {
			const checkbox = demoClassLabel.locator("..").locator('input[type="checkbox"]').first();
			if (await checkbox.isVisible().catch(() => false)) {
				await checkbox.check();
			}
		}

		const submitButton = teacherPage
			.locator('button[type="button"]')
			.filter({ hasText: /^Create$/ })
			.first();
		await expect(submitButton).toBeEnabled({ timeout: 5000 });
		await submitButton.click();

		await expect(teacherPage.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });
		await expect(teacherPage.locator("body")).toContainText(testTitle);
	});
});
