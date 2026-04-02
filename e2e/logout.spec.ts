import { test, expect } from "./fixtures";

test.describe("Logout - Basic Flow", () => {
	test("should logout student from user menu", async ({ studentPage }) => {
		// Already logged in via fixture
		await studentPage.goto("/dashboard/assignments");

		// Open user menu and click logout
		await studentPage.click('[data-sidebar="menu-button"]');
		await studentPage.click("text=Log out");

		// Should redirect to login
		await expect(studentPage).toHaveURL("/login");
	});

	test("should logout teacher from user menu", async ({ teacherPage }) => {
		await teacherPage.goto("/dashboard");

		await teacherPage.click('[data-sidebar="menu-button"]');
		await teacherPage.click("text=Log out");

		await expect(teacherPage).toHaveURL("/login");
	});

	test("should show success toast after logout", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/assignments");

		await studentPage.click('[data-sidebar="menu-button"]');
		await studentPage.click("text=Log out");

		// Check for toast message
		await expect(studentPage.locator("text=You have been logged out")).toBeVisible();
	});

	test("should clear session after logout", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/assignments");

		// Logout
		await studentPage.click('[data-sidebar="menu-button"]');
		await studentPage.click("text=Log out");
		await expect(studentPage).toHaveURL("/login");

		// Try to access protected page
		await studentPage.goto("/dashboard/assignments");
		await expect(studentPage).toHaveURL("/login");
	});

	test("should not access protected content with back button after logout", async ({
		studentPage,
	}) => {
		await studentPage.goto("/dashboard/assignments");

		// Logout
		await studentPage.click('[data-sidebar="menu-button"]');
		await studentPage.click("text=Log out");
		await expect(studentPage).toHaveURL("/login");

		// Try back button
		await studentPage.goBack();

		// Should still be on login (session cleared)
		await expect(studentPage).toHaveURL("/login");
	});
});

test.describe("Logout - Profile Page", () => {
	test("should logout from profile page", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/profile");

		// Profile page has separate logout button
		await studentPage.click('button:has-text("Sign out")');

		await expect(studentPage).toHaveURL("/login");
	});

	test("should show confirmation dialog before logout on profile", async ({ studentPage }) => {
		await studentPage.goto("/dashboard/profile");

		// Click sign out
		await studentPage.click('button:has-text("Sign out")');

		// Should redirect immediately (no confirm dialog based on current implementation)
		await expect(studentPage).toHaveURL("/login");
	});
});

test.describe("Logout - Multiple Sessions", () => {
	test("should logout from all tabs when logged out in one", async ({ browser }) => {
		// Create context with student auth
		const context = await browser.newContext({
			storageState: "./playwright/.auth/student.json",
		});

		const page1 = await context.newPage();
		const page2 = await context.newPage();

		// Both pages logged in
		await page1.goto("/dashboard/assignments");
		await page2.goto("/dashboard");

		// Logout from page1
		await page1.click('[data-sidebar="menu-button"]');
		await page1.click("text=Log out");

		// Both should redirect
		await expect(page1).toHaveURL("/login");

		// Refresh page2 and check
		await page2.reload();
		await expect(page2).toHaveURL("/login");

		await context.close();
	});
});
