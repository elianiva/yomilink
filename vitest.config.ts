import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		alias: {
			"@": new URL("./src/", import.meta.url).pathname,
		},
		setupFiles: ["./src/__tests__/setup/index.ts"],
		globals: true,
	},
});
