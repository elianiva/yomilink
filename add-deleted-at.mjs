import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
	process.exit(1);
}

const client = createClient({ url, authToken });

const tables = [
	"texts",
	"topics",
	"goal_maps",
	"kits",
	"assignments",
	"assignment_targets",
	"learner_maps",
	"diagnoses",
	"feedback",
	"forms",
	"questions",
	"form_responses",
	"form_progress",
	"user",
	"cohorts",
	"whitelist_entries",
	"cohort_members",
];

for (const table of tables) {
	try {
		await client.execute(`ALTER TABLE \`${table}\` ADD \`deleted_at\` integer;`);
		console.log(`✓ ${table}: added deleted_at`);
	} catch (err) {
		if (
			err.message?.includes?.("duplicate column name") ||
			err.message?.includes?.("already exists")
		) {
			console.log(`- ${table}: deleted_at already exists, skipping`);
		} else {
			console.error(`✗ ${table}: ${err.message}`);
		}
	}
}

client.close();
