import { readFileSync } from "fs";

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
	process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync("drizzle/0005_remarkable_wolf_cub.sql", "utf-8");

// Split by statement-breakpoint and filter empty
const statements = sql
	.split("--> statement-breakpoint")
	.map((s) => s.trim())
	.filter((s) => s.length > 0);

let idx = 0;
for (const stmt of statements) {
	try {
		await client.execute(stmt);
		console.log(`✓ [${idx}] ${stmt.slice(0, 80)}...`);
	} catch (err) {
		console.error(`✗ [${idx}] ${stmt.slice(0, 80)}...`);
		console.error(`  ${err.message}`);
	}
	idx++;
}

client.close();
