import { test as base, expect, type Page } from "@playwright/test";

/**
 * Custom test fixtures for Yomilink authentication.
 * Provides convenient access to pre-authenticated contexts.
 */
type AppFixtures = {
	/**
	 * Student page fixture with authenticated context.
	 * Uses storage state from auth setup.
	 */
	studentPage: Page;
	/**
	 * Teacher page fixture with authenticated context.
	 * Uses storage state from auth setup.
	 */
	teacherPage: Page;
};

export const test = base.extend<AppFixtures>({
	studentPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: "./playwright/.auth/student.json",
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},
	teacherPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: "./playwright/.auth/teacher.json",
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},
});

export { expect };
