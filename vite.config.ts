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
					// Minimum chunk size - smaller modules get inlined
					minSize: 25000,
					// Maximum chunk size - prevents huge bundles
					maxSize: 300000,
					// Prevent duplicate dependencies across chunks
					includeDependenciesRecursively: true,
					groups: [
						// React core vendor chunk - highest priority, keep together
						{
							name: "vendor-react",
							test: /node_modules[\\/]react(?:-dom|-scheduler|\.js)?[\\/]/,
							priority: 100,
							minSize: 0,
							maxSize: 400000,
						},
						// Effect ecosystem - group all effect packages into one chunk
						{
							name: "vendor-effect",
							test: /node_modules[\\/](?:effect|@effect[\\/][^/]+)[\\/]/,
							priority: 80,
							minSize: 0,
							maxSize: 400000,
						},
						// TanStack framework - keep related packages together
						{
							name: "vendor-tanstack",
							test: /node_modules[\\/]@tanstack[\\/]/,
							priority: 70,
							minSize: 50000,
							maxSize: 350000,
						},
						// Radix UI primitives - shared across many components
						{
							name: "vendor-radix",
							test: /node_modules[\\/](?:@radix-ui[\\/][^/]+|radix-ui)[\\/]/,
							priority: 60,
							minSize: 0,
							maxSize: 250000,
						},
						// Animation libraries - framer-motion is large
						{
							name: "vendor-motion",
							test: /node_modules[\\/](?:framer-motion|motion)[\\/]/,
							priority: 50,
							minSize: 0,
							maxSize: 250000,
						},
						// Large visualization libraries (lazy loaded routes)
						// xyflow + recharts - only loaded when needed
						{
							name: "vendor-viz",
							test: /node_modules[\\/](?:@xyflow[\\/]|recharts)[\\/]/,
							priority: 40,
							minSize: 0,
							maxSize: 300000,
						},
						// Icons - lucide-react, split separately due to size
						{
							name: "vendor-icons",
							test: /node_modules[\\/]lucide-react[\\/]/,
							priority: 30,
							minSize: 0,
							maxSize: 150000,
						},
						// Better-auth - auth library
						{
							name: "vendor-auth",
							test: /node_modules[\\/]better-auth[\\/]/,
							priority: 25,
							minSize: 0,
							maxSize: 200000,
						},
						// Other vendors - catch all
						{
							name: "vendor",
							test: /node_modules/,
							priority: 10,
							minSize: 40000,
							maxSize: 200000,
						},
						// Shared application code - used by multiple routes
						{
							name: "shared",
							minShareCount: 3,
							minSize: 30000,
							priority: 5,
							maxSize: 150000,
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
