import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/server/db/schema/*",
	out: "./drizzle",
	dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
