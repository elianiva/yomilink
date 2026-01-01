import { SqlClient } from "@effect/sql/SqlClient";
import { Effect } from "effect";

export const setupDatabase = Effect.gen(function* () {
	const sql = yield* SqlClient;

	yield* Effect.log("Setting up test database...");

	const sqlFiles = import.meta.glob("/drizzle/*.sql", { as: "raw" });

	for (const [path, module] of Object.entries(sqlFiles)) {
		yield* Effect.log(`Loading schema from ${path}`);
		const content = yield* Effect.promise(() => module());

		const cleanSql = content
			.replace(/`/g, '"')
			.split("--> statement-breakpoint\n")
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.filter((s) => !s.startsWith("--"));

		for (const statement of cleanSql) {
			const trimmed = statement.trim();
			if (trimmed.length > 0 && !trimmed.startsWith("--")) {
				yield* sql.unsafe(trimmed);
			}
		}
	}

	yield* Effect.log("Database setup completed");
});

export const resetDatabase = Effect.gen(function* () {
	const sql = yield* SqlClient;

	yield* Effect.log("Resetting database...");

	yield* sql.unsafe("PRAGMA foreign_keys = OFF");

	const tables = [
		"assignment_targets",
		"cohort_members",
		"diagnoses",
		"feedback",
		"learner_maps",
		"session",
		"assignments",
		"kit_sets",
		"kits",
		"goal_maps",
		"texts",
		"account",
		"cohorts",
		"user",
		"topics",
		"verification",
	];

	for (const table of tables) {
		yield* sql.unsafe(`DELETE FROM "${table}"`);
	}

	yield* sql.unsafe("PRAGMA foreign_keys = ON");

	yield* Effect.log("Database reset completed");
});
