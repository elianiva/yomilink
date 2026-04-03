import { test, expect } from "./fixtures";

/**
 * E2E tests to verify all pages load correctly with authenticated sessions.
 * Uses stored session state from auth.setup.ts fixtures.
 */

test.describe("Page Load Tests - Student", () => {
	test("should load home page", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should load login page", async ({ page }) => {
		await page.goto("/login");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should load signup page", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should load student assignments page", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/assignments");
		await expect(studentPage.locator("body")).toBeVisible();
	});

	test("should load student profile page", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/profile");
		await expect(studentPage.locator("body")).toBeVisible();
	});

	test("should load student forms page", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/forms/student");
		await expect(studentPage.locator("body")).toBeVisible();
	});
});

test.describe("Page Load Tests - Teacher", () => {
	test("should load teacher dashboard", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load teacher profile page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/profile");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load users management page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/users");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load analytics page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/analytics");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load forms list page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load form builder page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/forms/builder");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load assignments management page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments/manage");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load goal map page", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/goal-map");
		await expect(teacherPage.locator("body")).toBeVisible();
	});

	test("should load goal map editor with new param", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/goal-map/new");
		await expect(teacherPage.locator("body")).toBeVisible();
	});
});

test.describe("Page Load Tests - Public Routes", () => {
	test("should load home page unauthenticated", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should load login page unauthenticated", async ({ page }) => {
		await page.goto("/login");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should load signup page unauthenticated", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.locator("body")).toBeVisible();
	});
});

test.describe("Page Load Tests - Access Control", () => {
	test("student should be redirected from teacher-only dashboard", async ({ studentPage }) => {
		await studentPage.goto("/dashboard");
		// Student should be redirected to /dashboard/assignments
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});

	test("student should be redirected from users page", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/users");
		// Should redirect to assignments (student home)
		await expect(studentPage).toHaveURL(/\/dashboard\/assignments/);
	});

	test("teacher should be redirected from student-only assignments", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard/assignments");
		// Teacher should be redirected to /dashboard
		await expect(teacherPage).toHaveURL(/\/dashboard/);
		await expect(teacherPage).not.toHaveURL(/\/dashboard\/assignments$/);
	});
});
