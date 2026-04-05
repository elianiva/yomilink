import { sql } from "drizzle-orm";
import { Effect, Layer, Logger } from "effect";

import { AppLayer } from "@/server/app-layer";
import { Database } from "@/server/db/client";

// Reset script - clears database tables
// Usage: bun scripts/seed/reset.ts [mode]
//   mode: "app" (default) - clears all app data, keeps users/auth
//         "full"          - clears everything including users
//         "forms"         - clears only forms & responses
//         "assignments"   - clears assignments & learner data

const RESET_MODES = {
	// Clear app data, preserve auth/users
	app: [
		"form_progress",
		"form_responses",
		"questions",
		"forms",
		"feedback",
		"diagnoses",
		"learner_maps",
		"assignment_targets",
		"assignments",
		"kit_sets",
		"kits",
		"goal_maps",
		"topics",
		"texts",
		"cohort_members",
		"cohorts",
	],

	// Clear only forms-related data
	forms: ["form_progress", "form_responses", "questions", "forms"],

	// Clear assignment & learner data
	assignments: [
		"form_progress",
		"form_responses",
		"feedback",
		"diagnoses",
		"learner_maps",
		"assignment_targets",
		"assignments",
	],

	// Full reset - includes auth tables
	full: [
		"form_progress",
		"form_responses",
		"questions",
		"forms",
		"feedback",
		"diagnoses",
		"learner_maps",
		"assignment_targets",
		"assignments",
		"kit_sets",
		"kits",
		"goal_maps",
		"topics",
		"texts",
		"cohort_members",
		"cohorts",
		// Auth tables last
		"session",
		"account",
		"verification",
		"user",
	],
} as const;

type ResetMode = keyof typeof RESET_MODES;

function resetTable(table: string) {
	return Effect.gen(function* () {
		const db = yield* Database;
		// SQLite delete all rows
		yield* db.run(sql.raw(`DELETE FROM "${table}"`));
		yield* Effect.log(`  ✓ truncated ${table}`);
	}).pipe(
		Effect.tapError((error) => Effect.log(`  ✗ failed to truncate ${table}: ${String(error)}`)),
		Effect.catchAll(() => Effect.void),
	);
}

function getModeFromArgs(): ResetMode {
	const args = process.argv.slice(2);
	const mode = args[0] as ResetMode | undefined;
	if (!mode || !(mode in RESET_MODES)) {
		return "app";
	}
	return mode;
}

const program = Effect.gen(function* () {
	const mode = getModeFromArgs();
	const tables = RESET_MODES[mode];

	yield* Effect.log(`=== Database Reset [mode: ${mode}] ===`);
	yield* Effect.log(`Truncating ${tables.length} tables...\n`);

	// Execute sequentially to avoid FK constraint issues
	for (const table of tables) {
		yield* resetTable(table);
	}

	yield* Effect.log(`\n=== Reset Complete ===`);

	if (mode === "app") {
		yield* Effect.log("Auth tables preserved (users, sessions, etc.)");
		yield* Effect.log("You can now run seed scripts safely.");
	}

	return { mode, tablesCleared: tables.length };
}).pipe(Effect.provide(Layer.merge(AppLayer, Logger.pretty)));

// Show help if requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
	console.log(`
Database Reset Script

Usage: bun scripts/seed/reset.ts [mode]

Modes:
  app         Reset all app data, keep users/auth (default)
  full        Complete reset including users
  forms       Reset only forms and responses
  assignments Reset assignments, learner maps, diagnoses

Examples:
  bun scripts/seed/reset.ts           # app mode (default)
  bun scripts/seed/reset.ts full      # complete wipe
  bun scripts/seed/reset.ts forms     # just clear forms

Note: Tables are truncated (DELETE FROM), not dropped.
      Schema and indexes remain intact.
`);
	process.exit(0);
}

void Effect.runPromise(program);
