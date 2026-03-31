import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite-plus";

export default defineConfig({
	staged: {
		"*": "vp check --fix",
	},
	fmt: {
		ignorePatterns: ["routeTree.gen.ts"],
		tabWidth: 4,
		useTabs: true,
		sortImports: {},
	},
	lint: {
		plugins: [
			"vitest",
			"typescript",
			"react",
			"react-perf",
			"import",
			"jsx-a11y",
			"promise",
			"unicorn",
		],
		categories: {},
		rules: {},
		settings: {
			"jsx-a11y": {
				components: {},
				attributes: {},
			},
			react: {
				formComponents: ["Form"],
				linkComponents: [
					{
						name: "Link",
						attributes: ["to"],
					},
				],
				componentWrapperFunctions: [],
			},
			vitest: {
				typecheck: false,
			},
		},
		env: {
			builtin: true,
		},
		globals: {},
		ignorePatterns: [],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	resolve: {
		conditions: ["development", "module", "browser", "default"],
		alias: {
			"@": new URL("./src/", import.meta.url).pathname,
		},
	},
	build: {
		cssCodeSplit: true,
		assetsInlineLimit: 4096,
		rolldownOptions: {
			external: ["cloudflare:workers"],
		},
	},
	optimizeDeps: {
		// Exclude TanStack Start packages from Vite's dependency optimization
		// to prevent issues with virtual imports (#tanstack-router-entry, etc.)
		exclude: [
			"@tanstack/start-server-core",
			"@tanstack/react-start",
			"@tanstack/react-start/client",
			"@tanstack/react-start/server",
		],
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	] as PluginOption[],
});
