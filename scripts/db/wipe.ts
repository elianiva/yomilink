import { access, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@libsql/client";

const force = process.argv.includes("--force");
const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
	console.error("TURSO_DATABASE_URL missing");
	process.exit(1);
}

function escapeIdentifier(value: string) {
	return value.replaceAll('"', '""');
}

async function wipeLocalDatabase() {
	const dbPath = resolve(process.cwd(), databaseUrl.slice(5));

	try {
		await access(dbPath);
		await unlink(dbPath);
		console.log(`Deleted ${dbPath}`);
	} catch (error) {
		console.error(`Failed to delete ${dbPath}`);
		console.error(error);
		process.exit(1);
	}
}

async function wipeRemoteDatabase() {
	if (!force) {
		console.error("Refusing to wipe remote database without --force");
		console.error(`Current TURSO_DATABASE_URL: ${databaseUrl}`);
		process.exit(1);
	}

	const client = createClient({ url: databaseUrl, authToken });

	try {
		await client.execute("PRAGMA foreign_keys = OFF");

		const result = await client.execute(
			`select type, name from sqlite_master where type in ('table', 'view') and name not like 'sqlite_%' order by type desc, name`,
		);

		for (const row of result.rows) {
			const type = String(row.type);
			const name = escapeIdentifier(String(row.name));

			if (type === "table") {
				await client.execute(`DROP TABLE IF EXISTS "${name}"`);
			} else if (type === "view") {
				await client.execute(`DROP VIEW IF EXISTS "${name}"`);
			}
		}

		await client.execute("PRAGMA foreign_keys = ON");
		console.log(`Dropped ${result.rows.length} remote tables/views`);
	} catch (error) {
		console.error("Failed to wipe remote database");
		console.error(error);
		process.exit(1);
	}
}

if (databaseUrl.startsWith("file:")) {
	await wipeLocalDatabase();
} else {
	await wipeRemoteDatabase();
}
