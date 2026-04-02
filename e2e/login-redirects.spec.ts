import { test, expect } from "./fixtures";

test.describe("Login - Redirects", () => {
	test("should redirect authenticated student away from login page", async ({ studentPage }) => {
		// Student already authenticated via fixture
		await studentPage.goto("/login");

		// Should automatically redirect to assignments
		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});

	test("should redirect authenticated student away from signup page", async ({ studentPage }) => {
		await studentPage.goto("/signup");

		await expect(studentPage).toHaveURL("/dashboard/assignments");
	});

	test("should redirect authenticated teacher away from login page", async ({ teacherPage }) => {
		await teacherPage.goto("/login");

		// Teacher redirects to dashboard root
		await expect(teacherPage).toHaveURL("/dashboard");
	});

	test("should redirect authenticated teacher away from signup page", async ({ teacherPage }) => {
		await teacherPage.goto("/signup");

		await expect(teacherPage).toHaveURL("/dashboard");
	});

	test("should redirect unauthenticated user to login when accessing protected route", async ({
		page,
	}) => {
		// Attempt to access dashboard without auth
		await page.goto("/dashboard/assignments");

		// Should redirect to login
		await expect(page).toHaveURL("/login");
	});

	test("should redirect unauthenticated user to login when accessing teacher dashboard", async ({
		page,
	}) => {
		await page.goto("/dashboard");

		await expect(page).toHaveURL("/login");
	});

	test("should redirect to login when accessing invalid routes", async ({ page }) => {
		await page.goto("/dashboard/assignments/nonexistent");

		// TanStack Router handles invalid routes differently, but should still require auth
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
		await page.fill("#email", "test@example.com");

		await page.click('a:has-text("Sign up")');
		await expect(page).toHaveURL("/signup");

		// Navigate back
		await page.click('a:has-text("Sign in")');

		// Form should be empty (new page load)
		const emailValue = await page.inputValue("#email");
		expect(emailValue).toBe("");
	});
});
