import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
	},
	projects: [
		{ name: "setup", testMatch: /.*\.setup\.ts/ },
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			dependencies: ["setup"],
		},
	],
	webServer: {
		command: "vp dev",
		url: "http://localhost:5173",
		reuseExistingServer: !process.env.CI,
	},
});
