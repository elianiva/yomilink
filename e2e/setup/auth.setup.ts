import { execSync } from "node:child_process";

import { test as setup } from "@playwright/test";

const authDir = "../playwright/.auth";

/**
 * Global setup for auth tests.
 * Seeds test database with demo data when E2E_RUN_SEED=1 is set.
 * Skipped by default - run seed manually or set E2E_RUN_SEED=1 to re-seed.
 */
setup("seed database", async () => {
	if (!process.env.E2E_RUN_SEED) {
		console.log("Skipping seed (set E2E_RUN_SEED=1 to run seed)");
		return;
	}

	// Only seed when explicitly requested via E2E_RUN_SEED=1
	try {
		execSync("vp run db:seed", { stdio: "inherit" });
	} catch {
		console.log("Seed may have already run or failed, continuing...");
	}
});

/**
 * Create authenticated storage states for test users.
 * This allows tests to skip login and start with an active session.
 */
setup("authenticate student", async ({ page }) => {
	await page.goto("/login");

	// Wait for page to fully load and hydrate
	await page.waitForSelector("#email");
	await page.waitForTimeout(500);

	// Login as demo student (tanaka)
	// Use page.type() which properly triggers React input events
	await page.type("#email", "tanaka@demo.local", { delay: 10 });
	await page.type("#password", "demo12345", { delay: 10 });

	// Wait for React form state to update and button to be enabled
	await page.waitForTimeout(200);

	// Click submit button
	await page.click('button[type="submit"]');

	// Wait for navigation with generous timeout for dev server
	await page.waitForURL("/dashboard/assignments", { timeout: 20000 });

	// Save storage state
	await page.context().storageState({ path: `${authDir}/student.json` });
});

setup("authenticate teacher", async ({ page }) => {
	await page.goto("/login");

	// Wait for page to fully load and hydrate
	await page.waitForSelector("#email");
	await page.waitForTimeout(500);

	// Login as demo teacher
	// Use page.type() which properly triggers React input events
	await page.type("#email", "teacher@demo.local", { delay: 10 });
	await page.type("#password", "teacher123", { delay: 10 });

	// Wait for React form state to update and button to be enabled
	await page.waitForTimeout(200);

	// Click submit button
	await page.click('button[type="submit"]');

	// Wait for navigation with generous timeout
	await page.waitForURL("/dashboard", { timeout: 20000 });

	// Save storage state
	await page.context().storageState({ path: `${authDir}/teacher.json` });
});
