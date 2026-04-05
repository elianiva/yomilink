import { sql } from "drizzle-orm";
import { Effect, Layer, Logger } from "effect";

import { AppLayer } from "@/server/app-layer";
import { Database } from "@/server/db/client";

// Reset script - clears database tables
// Usage: bun scripts/seed/reset.ts [mode]
//   mode: "full" (default) - clears everything including users/auth
//         "app"            - clears app data, keeps users/auth
//         "forms"          - clears only forms & responses
//         "assignments"    - clears assignments & learner data

const RESET_MODES = {
	// App reset - preserve users/auth
	// Order: child tables first (FK dependencies), parents last
	app: [
		// Form-related (forms has no FKs, comes after its children)
		"form_progress",
		"form_responses",
		"questions",
		"forms",
		// Learner map related (learner_maps FKs to assignments/goal_maps/kits)
		"feedback",
		"diagnoses",
		"learner_maps",
		// Assignment related (assignments FKs to goal_maps/kits)
		"assignment_targets",
		"assignments",
		// Kit related (kit_sets FKs to kits/texts, kits FKs to goal_maps/texts)
		"kit_sets",
		"kits",
		// Core content (no FKs)
		"goal_maps",
		"topics",
		"texts",
		// Cohorts (cohort_members FKs to cohorts)
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

	// Full reset - clears everything (default)
	// Order: child tables first (FK dependencies), parents last
	full: [
		// Form-related
		"form_progress",
		"form_responses",
		"questions",
		"forms",
		// Learner map related
		"feedback",
		"diagnoses",
		"learner_maps",
		// Assignment related
		"assignment_targets",
		"assignments",
		// Kit related
		"kit_sets",
		"kits",
		// Core content
		"goal_maps",
		"topics",
		"texts",
		// Cohorts
		"cohort_members",
		"cohorts",
		// Auth tables last (session/account/verification FK to user)
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
		return "full";
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

	if (mode === "full") {
		yield* Effect.log("All tables cleared (including auth)");
		yield* Effect.log("You'll need to re-seed or re-create users.");
	} else if (mode === "app") {
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
  full        Complete reset including users (default)
  app         Reset app data, keep users/auth
  forms       Reset only forms and responses
  assignments Reset assignments, learner maps, diagnoses

Examples:
  bun scripts/seed/reset.ts           # full mode (default) - wipes everything
  bun scripts/seed/reset.ts app       # keep users/auth
  bun scripts/seed/reset.ts forms     # just clear forms

Note: Tables are truncated (DELETE FROM), not dropped.
      Schema and indexes remain intact.
`);
	process.exit(0);
}

void Effect.runPromise(program);
