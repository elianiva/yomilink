import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		alias: {
			"@": new URL("./src/", import.meta.url).pathname,
		},
		setupFiles: ["./src/__tests__/setup/index.ts"],
		globals: true,
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
