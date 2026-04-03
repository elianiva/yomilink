import { execSync } from "node:child_process";

import { test as setup } from "@playwright/test";

const authDir = "./playwright/.auth";

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
	await page.waitForSelector("#email", { state: "visible" });

	// Fill credentials
	await page.fill("#email", "tanaka@demo.local");
	await page.fill("#password", "demo12345");

	// Wait for form validation to pass and button to enable
	await page.waitForFunction(() => {
		const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
		return button && !button.disabled;
	});

	// Click submit and wait for navigation
	await Promise.all([
		page.waitForURL("/dashboard/assignments", { timeout: 30000 }),
		page.click('button[type="submit"]'),
	]);

	// Save storage state (cookies with session token)
	await page.context().storageState({ path: `${authDir}/student.json` });
	console.log("Student auth state saved");
});

setup("authenticate teacher", async ({ page }) => {
	await page.goto("/login");

	// Wait for page to fully load and hydrate
	await page.waitForSelector("#email", { state: "visible" });

	// Fill credentials
	await page.fill("#email", "teacher@demo.local");
	await page.fill("#password", "teacher123");

	// Wait for form validation to pass
	await page.waitForFunction(() => {
		const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
		return button && !button.disabled;
	});

	// Click submit and wait for navigation
	await Promise.all([
		page.waitForURL("/dashboard", { timeout: 30000 }),
		page.click('button[type="submit"]'),
	]);

	// Save storage state
	await page.context().storageState({ path: `${authDir}/teacher.json` });
	console.log("Teacher auth state saved");
});
