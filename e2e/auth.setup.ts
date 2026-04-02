import { execSync } from "node:child_process";

import { test as setup } from "@playwright/test";

const authDir = "./playwright/.auth";

/**
 * Global setup for auth tests.
 * Ensures test database is seeded with demo data.
 */
setup("seed database", async () => {
	// Check if running locally with seeded data
	// In CI, this would be handled separately
	if (!process.env.CI) {
		try {
			execSync("vp run db:seed", { stdio: "inherit" });
		} catch {
			console.log("Seed may have already run or failed, continuing...");
		}
	}
});

/**
 * Create authenticated storage states for test users.
 * This allows tests to skip login and start with an active session.
 */
setup("authenticate student", async ({ page }) => {
	await page.goto("/login");

	// Login as demo student (tanaka)
	await page.fill("#email", "tanaka@demo.local");
	await page.fill("#password", "demo12345");
	await page.click('button[type="submit"]');

	// Wait for navigation with generous timeout for dev server
	await page.waitForURL("/dashboard/assignments", { timeout: 20000 });

	// Save storage state
	await page.context().storageState({ path: `${authDir}/student.json` });
});

setup("authenticate teacher", async ({ page }) => {
	await page.goto("/login");

	// Login as demo teacher
	await page.fill("#email", "teacher@demo.local");
	await page.fill("#password", "teacher123");
	await page.click('button[type="submit"]');

	// Wait for navigation with generous timeout
	await page.waitForURL("/dashboard", { timeout: 20000 });

	// Save storage state
	await page.context().storageState({ path: `${authDir}/teacher.json` });
});
