import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		include: ["**/*.ignored"], // Don't run any tests by default - use test:ui or test:service
		globals: true,
		alias: {
			"@": new URL("./src/", import.meta.url).pathname,
			"cloudflare:workers": new URL(
				"./src/__tests__/mocks/cloudflare-workers.ts",
				import.meta.url,
			).pathname,
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"node_modules/",
				"src/__tests__/",
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/*.d.ts",
				"src/**/*.stories.tsx",
			],
		},
	},
});
