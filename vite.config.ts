import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
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
			output: {
				codeSplitting: {
					minSize: 25000,
					maxSize: 400000,
					groups: [
						// React + React-dom must stay together
						{
							name: "vendor-react",
							test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
							priority: 100,
							minSize: 0,
							maxSize: 500000,
						},
						// Radix needs React - group together with react-deps
						{
							name: "vendor-react-deps",
							test: /node_modules[\\/](?:@radix-ui|react(?:-dom|-scheduler)?$|react\.js)[\\/]/,
							priority: 90,
							minSize: 0,
							maxSize: 500000,
						},
						// Bundle Effect ecosystem together
						{
							name: "vendor-effect",
							test: /node_modules[\\/](?:effect|@effect)[\\/]/,
							priority: 80,
							minSize: 0,
							maxSize: 500000,
						},
						// TanStack packages
						{
							name: "vendor-tanstack",
							test: /node_modules[\\/]@tanstack[\\/]/,
							priority: 70,
							minSize: 0,
							maxSize: 400000,
						},
						// Motion (lazy loaded)
						{
							name: "vendor-motion",
							test: /node_modules[\\/](?:framer-motion|motion|lucide-react)[\\/]/,
							priority: 40,
							minSize: 0,
							maxSize: 400000,
						},
						// Viz libs (lazy loaded)
						{
							name: "vendor-viz",
							test: /node_modules[\\/](?:@xyflow|recharts)[\\/]/,
							priority: 30,
							minSize: 0,
							maxSize: 400000,
						},
						// Everything else
						{
							name: "vendor",
							test: /node_modules/,
							priority: 10,
							minSize: 0,
							maxSize: 400000,
						},
					],
				},
			},
		},
	},
	plugins: [
		cloudflare(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
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
