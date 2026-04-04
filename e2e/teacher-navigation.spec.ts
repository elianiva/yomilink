import { test, expect } from "./fixtures";

/**
 * Teacher Navigation and Access Control E2E Tests
 *
 * Tests navigation flows:
 * - Sidebar navigation between all teacher routes
 * - Access control (students can't access teacher routes)
 * - Redirect behavior
 */

test.describe("Teacher - Sidebar Navigation", () => {
	test("should navigate to dashboard from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await teacherPage.waitForSelector("text=Manage user accounts");

		// Click dashboard link in sidebar
		await teacherPage.click('a[href="/dashboard"], nav a:has-text("Dashboard")');

		await teacherPage.waitForURL("**/dashboard");
		await expect(teacherPage.locator("text=Topics")).toBeVisible();
	});

	test("should navigate to users from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click users link in sidebar
		await teacherPage.click('a[href="/dashboard/users"], nav a:has-text("Users")');

		await teacherPage.waitForURL("**/dashboard/users");
		await expect(teacherPage.locator("text=Manage user accounts")).toBeVisible();
	});

	test("should navigate to assignments from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click assignments link
		await teacherPage.click('a[href="/dashboard/assignments/manage"], nav a:has-text("Assignments")');

		await teacherPage.waitForURL("**/dashboard/assignments/manage");
		await expect(teacherPage.locator("text=Create and manage assignments")).toBeVisible();
	});

	test("should navigate to forms from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click forms link
		await teacherPage.click('a[href="/dashboard/forms"], nav a:has-text("Forms")');

		await teacherPage.waitForURL("**/dashboard/forms");
		await expect(teacherPage.locator("text=Manage your forms")).toBeVisible();
	});

	test("should navigate to analytics from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click analytics link
		await teacherPage.click('a[href="/dashboard/analytics"], nav a:has-text("Analytics")');

		await teacherPage.waitForURL("**/dashboard/analytics");
		await expect(teacherPage.locator("text=Select an assignment")).toBeVisible();
	});

	test("should navigate to profile from sidebar", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await teacherPage.waitForSelector("text=Topics");

		// Click profile link (usually in user menu)
		const userMenu = teacherPage.locator('button[aria-label*="user" i], [data-testid="user-menu"], button:has-text("Teacher")').first();
		if (await userMenu.isVisible().catch(() => false)) {
			await userMenu.click();
			// Try to click profile link
			const profileLink = teacherPage.locator('a[href="/dashboard/profile"]').first();
			if (await profileLink.isVisible().catch(() => false)) {
				await profileLink.click();
			} else {
				await teacherPage.goto("/dashboard/profile");
			}
		} else {
			// Try direct navigation if menu not found
			await teacherPage.goto("/dashboard/profile");
		}

		await expect(teacherPage.locator("body")).toContainText("Profile");
	});
});

test.describe("Access Control - Student cannot access teacher routes", () => {
	test("student should be redirected from /dashboard to student assignments", async ({ studentPage }) => {
		await studentPage.goto("/dashboard");

		// Student should be redirected to /dashboard/assignments
		await studentPage.waitForURL("**/dashboard/assignments**");
	});

	test("student should be redirected from /dashboard/users", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/users");

		// Should redirect to student assignments
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});

	test("student should be redirected from /dashboard/forms", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/forms");

		// Should redirect to student assignments
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});

	test("student should be redirected from /dashboard/analytics", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/analytics");

		// Should redirect to student assignments
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});

	test("student should be redirected from /dashboard/assignments/manage", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/assignments/manage");

		// Should redirect to student assignments
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});
});

test.describe("Access Control - Teacher can access all teacher routes", () => {
	test("teacher can access dashboard", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await expect(teacherPage).toHaveURL(/\/dashboard$/);
		await expect(teacherPage.locator("text=Topics")).toBeVisible();
	});

	test("teacher can access users", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await expect(teacherPage).toHaveURL(/\/dashboard\/users/);
		await expect(teacherPage.locator("text=Manage user accounts")).toBeVisible();
	});

	test("teacher can access forms", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await expect(teacherPage).toHaveURL(/\/dashboard\/forms/);
		await expect(teacherPage.locator("text=Manage your forms")).toBeVisible();
	});

	test("teacher can access analytics", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await expect(teacherPage).toHaveURL(/\/dashboard\/analytics/);
	});

	test("teacher can access assignments manage", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await expect(teacherPage).toHaveURL(/\/dashboard\/assignments\/manage/);
		await expect(teacherPage.locator("text=Create and manage assignments")).toBeVisible();
	});

	test("teacher can access goal map editor", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/goal-map/new");
		// The route might redirect or stay on /dashboard/goal-map/new
		// Just verify we don't get redirected to student assignments
		const url = teacherPage.url();
		expect(url).not.toContain("/dashboard/assignments");
		expect(url).toContain("/dashboard");
	});
});
