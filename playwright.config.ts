import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:5174",
		trace: "on-first-retry",
	},
	projects: [
		{ name: "setup", testMatch: "**/*.setup.ts" },
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
			testIgnore: "**/*.setup.ts",
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			dependencies: ["setup"],
			testIgnore: "**/*.setup.ts",
		},
	],
	webServer: {
		command: "vp dev --port 5174",
		url: "http://localhost:5174",
		reuseExistingServer: true,
		env: {
			VITE_DISABLE_REACT_SCAN: "true",
			SITE_URL: "http://localhost:5174",
			BETTER_AUTH_URL: "http://localhost:5174",
		},
	},
});
