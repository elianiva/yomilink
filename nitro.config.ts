import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	// Node server preset for Node.js container compatibility
	preset: process.env.BUILD_TARGET === "node" ? "node-server" : undefined,

	// Output directory
	output: {
		dir: ".output",
	},

	// Runtime configuration (accessible via useRuntimeConfig())
	runtimeConfig: {
		databaseMode: process.env.DATABASE_MODE,
		databaseUrl: process.env.TURSO_DATABASE_URL,
		authSecret: process.env.BETTER_AUTH_SECRET,
		siteUrl: process.env.SITE_URL,
	},

	// Exclude test files from build
	ignore: ["**/*.test.ts", "**/*.test.tsx", "**/tests/**"],

	// Module aliases
	alias: {
		"@": "./src",
	},

	// Build optimizations
	experimental: {
		// Enable async context for Effect-TS
		asyncContext: true,
	},
});
