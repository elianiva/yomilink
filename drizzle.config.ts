import { defineConfig } from "drizzle-kit";

const isLocal =
	process.env.DATABASE_MODE === "local" || process.env.TURSO_DATABASE_URL?.startsWith("file:");

export default defineConfig({
	schema: "./src/server/db/schema/*",
	out: "./drizzle",
	dialect: isLocal ? "sqlite" : "turso",
	dbCredentials: isLocal
		? { url: process.env.TURSO_DATABASE_URL as string }
		: {
				url: process.env.TURSO_DATABASE_URL as string,
				authToken: process.env.TURSO_AUTH_TOKEN,
			},
});
