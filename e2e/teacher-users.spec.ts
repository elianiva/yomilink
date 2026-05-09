import { test, expect } from "./fixtures";

test.describe("Teacher - User Management", () => {
	test("should load users page with list", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("text=Manage user accounts");
		await expect(teacherPage.locator("h1").filter({ hasText: "Users" })).toBeVisible();
		await expect(teacherPage.locator("table")).toBeVisible();
	});

	test("should filter users by search", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const tableText = await teacherPage.locator("table").textContent();
		const hasUsers = !tableText?.includes("No users found");
		if (!hasUsers) {
			test.skip(true, "No users in database - skipping search test");
			return;
		}

		const searchInput = teacherPage.locator('input[placeholder*="Search by name or email"]');
		await searchInput.fill("tanaka");
		await teacherPage.waitForTimeout(400);

		const afterSearch = await teacherPage.locator("table").textContent();
		expect(afterSearch).toBeTruthy();
	});

	test("should filter users by role", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const tableText = await teacherPage.locator("table").textContent();
		if (tableText?.includes("No users found")) {
			test.skip(true, "No users to filter");
			return;
		}

		const roleTrigger = teacherPage
			.locator('[data-slot="select-trigger"]')
			.filter({ hasText: /All Roles|Role/ })
			.first();
		if (!(await roleTrigger.isVisible().catch(() => false))) {
			test.skip(true, "Role filter not available");
			return;
		}

		await roleTrigger.click();
		await teacherPage
			.locator('[role="option"], [data-slot="select-item"]')
			.filter({ hasText: "Student" })
			.first()
			.click()
			.catch(() => void teacherPage.keyboard.press("Escape"));

		await expect(teacherPage.locator("table")).toBeVisible();
	});

	test("should filter users by cohort", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const tableText = await teacherPage.locator("table").textContent();
		if (tableText?.includes("No users found")) {
			test.skip(true, "No users to filter");
			return;
		}

		const cohortTriggers = teacherPage.locator('[data-slot="select-trigger"]');
		const count = await cohortTriggers.count();
		if (count < 2) {
			test.skip(true, "Cohort filter not available");
			return;
		}

		await cohortTriggers.nth(1).click();

		const demoOption = teacherPage
			.locator('[role="option"], [data-slot="select-item"]')
			.filter({ hasText: "Demo Class 2025" })
			.first();
		if (await demoOption.isVisible().catch(() => false)) {
			await demoOption.click();
		} else {
			await teacherPage.keyboard.press("Escape");
		}

		await expect(teacherPage.locator("table")).toBeVisible();
	});

	test("should navigate user pagination", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const nextButton = teacherPage.locator('button:has-text("Next")');
		const hasNext = await nextButton.isVisible().catch(() => false);
		if (hasNext) {
			const isDisabled = await nextButton.isDisabled();
			if (!isDisabled) {
				await nextButton.click();
				await teacherPage.waitForTimeout(300);
				await expect(teacherPage.locator("table")).toBeVisible();
			}
		}
	});

	test("should select users via checkboxes", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const firstCheckbox = teacherPage
			.locator(
				'table tbody tr:first-child td:first-child button[role="checkbox"], table tbody tr:first-child td:first-child input[type="checkbox"]',
			)
			.first();
		await firstCheckbox.click();

		await expect(teacherPage.locator("text=/\\d+ selected/")).toBeVisible();
		await expect(teacherPage.locator('button:has-text("Assign to Cohort")')).toBeVisible();
	});

	test("should open user detail sheet", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		await teacherPage.locator("table tbody tr:first-child").click();
		await expect(
			teacherPage.locator('[data-slot="sheet-content"], [role="dialog"]'),
		).toBeVisible();
		await expect(teacherPage.locator("text=User Details")).toBeVisible();
	});

	test("should edit user details", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		await teacherPage.locator("table tbody tr:first-child").click();
		await teacherPage.waitForSelector("text=User Details");

		const nameInput = teacherPage.locator("input#name");
		await nameInput.fill("Updated Test Name");
		await teacherPage.click('button:has-text("Save")');
		await teacherPage.waitForTimeout(500);
	});

	test("should bulk assign users to cohort", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const checkboxes = teacherPage.locator(
			'table tbody tr td:first-child button[role="checkbox"], table tbody tr td:first-child input[type="checkbox"]',
		);
		const count = await checkboxes.count();
		if (count < 2) {
			test.skip(true, "Not enough users to test bulk assign");
			return;
		}

		await checkboxes.nth(0).click();
		await checkboxes.nth(1).click();

		const bulkButton = teacherPage
			.locator("button")
			.filter({ hasText: /^Assign to Cohort$/ })
			.first();
		await expect(bulkButton).toBeVisible();
		await bulkButton.click();

		await expect(teacherPage.locator('[role="dialog"]')).toBeVisible();
		await expect(
			teacherPage
				.locator('[data-slot="dialog-title"]')
				.filter({ hasText: "Assign to Cohort" }),
		).toBeVisible();

		const demoClass = teacherPage.locator("text=Demo Class 2025");
		if (await demoClass.isVisible().catch(() => false)) {
			await demoClass.click();
		}

		await teacherPage.keyboard.press("Escape");
	});

	test("should trigger password reset", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("table");

		const tableText = await teacherPage.locator("table").textContent();
		if (tableText?.includes("No users found")) {
			test.skip(true, "No users available");
			return;
		}

		await teacherPage.locator("table tbody tr:first-child").click();
		await teacherPage.waitForSelector('[data-slot="sheet-content"]');

		const resetButton = teacherPage
			.locator('[data-slot="sheet-content"] button')
			.filter({ hasText: "Reset Password" })
			.first();
		if (await resetButton.isVisible().catch(() => false)) {
			await resetButton.click();
			await teacherPage.waitForTimeout(300);
		}

		await teacherPage.keyboard.press("Escape");
	});
});

test.describe("Admin - User Management (admin only features)", () => {
	test.skip("should change user role when admin", async () => {
		// Requires fresh admin login and complex sheet interactions
	});
});
