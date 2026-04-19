import { test, expect } from "./fixtures";

test.describe("Login - Redirects", () => {
	test("should redirect authenticated student away from login page", async ({ studentPage }) => {
		await studentPage.goto("/login");
		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});

	test("should redirect authenticated student away from signup page", async ({ studentPage }) => {
		await studentPage.goto("/signup");
		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});

	test("should redirect authenticated teacher away from login page", async ({ teacherPage }) => {
		await teacherPage.goto("/login");
		await expect(teacherPage).toHaveURL("/dashboard");
	});

	test("should redirect authenticated teacher away from signup page", async ({ teacherPage }) => {
		await teacherPage.goto("/signup");
		await expect(teacherPage).toHaveURL("/dashboard");
	});

	test("should redirect unauthenticated user to login when accessing protected route", async ({ page }) => {
		await page.goto("/dashboard/assignments");
		await expect(page).toHaveURL("/login");
	});

	test("should redirect unauthenticated user to login when accessing teacher dashboard", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL("/login");
	});

	test("should redirect to login when accessing invalid routes", async ({ page }) => {
		await page.goto("/dashboard/assignments/nonexistent");
		await expect(page).toHaveURL("/login");
	});
});

test.describe("Login - Navigation Links", () => {
	test("should navigate to signup page from login", async ({ page }) => {
		await page.goto("/login");
		await page.click('a:has-text("Sign up")');
		await expect(page).toHaveURL("/signup");
	});

	test("should navigate to login page from signup", async ({ page }) => {
		await page.goto("/signup");
		await page.click('a:has-text("Sign in")');
		await expect(page).toHaveURL("/login");
	});

	test("should maintain login form state after navigating away and back", async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#studentId");
		await page.locator("#studentId").fill("20260013");

		await page.locator('a:has-text("Sign up")').click();
		await expect(page).toHaveURL("/signup");

		await page.locator('a:has-text("Sign in")').click();
		const studentIdValue = await page.inputValue("#studentId");
		expect(studentIdValue).toBe("");
	});
});
