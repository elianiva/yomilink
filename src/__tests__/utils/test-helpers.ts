import { SqlClient } from "@effect/sql/SqlClient";
import { Effect } from "effect";

export const setupDatabase = Effect.gen(function* () {
	const sql = yield* SqlClient;

	// eslint-disable-next-line @typescript-eslint/no-deprecated
	const sqlFiles = import.meta.glob("/drizzle/*.sql", { as: "raw" });

	for (const [, module] of Object.entries(sqlFiles)) {
		const content = yield* Effect.tryPromise({
			try: () => module(),
			catch: () => "",
		});
		if (!content) continue;

		const statements = content
			.replace(/`/g, '"')
			.split("--> statement-breakpoint\n")
			.filter((s) => s.trim().length > 0 && !s.trim().startsWith("--"));

		for (const stmt of statements) {
			yield* Effect.ignore(sql.unsafe(stmt.trim()));
		}
	}
});

export const resetDatabase = Effect.gen(function* () {
	const sql = yield* SqlClient;

	yield* Effect.ignore(sql.unsafe("PRAGMA foreign_keys = OFF"));

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
		"form_responses",
		"form_progress",
		"questions",
		"forms",
	];

	for (const table of tables) {
		yield* Effect.ignore(sql.unsafe(`DELETE FROM "${table}"`));
	}

	yield* Effect.ignore(sql.unsafe("PRAGMA foreign_keys = ON"));
});
