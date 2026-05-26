import { defineConfig } from "vite-plus";

const baseConfig = {
	environment: "jsdom",
	alias: {
		"@": new URL("./src/", import.meta.url).pathname,
		"cloudflare:workers": new URL(
			"./src/__tests__/mocks/cloudflare-workers.ts",
			import.meta.url,
		).pathname,
	},
	globals: true,
};

export default defineConfig({
	test: {
		...baseConfig,
		environment: "jsdom",
		include: [
			"src/**/*.test.ts",
			"src/**/*.test.tsx",
		],
		setupFiles: ["./src/__tests__/setup/ui.ts"],
		name: "ui",
	},
});
