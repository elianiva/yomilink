import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type PluginOption } from "vite-plus";

// Determine build target from environment
const buildTarget = process.env.BUILD_TARGET || "cloudflare";
const isNode = buildTarget === "node";

export default defineConfig({
	staged: {
		"*": "vp check --fix",
	},
	fmt: {
		ignorePatterns: [],
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
				polymorphicPropName: null,
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
				version: null,
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
	plugins: [
		// Use Nitro for Node container, Cloudflare for edge deployment
		isNode ? nitro({ preset: "node-server" }) : cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		// Disable Sentry in Node container builds or when no auth token
		...(process.env.SENTRY_AUTH_TOKEN
			? [
					sentryTanstackStart({
						org: "elianiva",
						project: "yomilink",
						authToken: process.env.SENTRY_AUTH_TOKEN,
					}),
				]
			: []),
	] as PluginOption[],
});
