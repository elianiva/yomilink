import { Effect, Layer, Logger } from "effect";

import { Auth } from "@/lib/auth";
import { AppLayer } from "@/server/app-layer";

import {
	seedCoreUsers,
	seedWhitelistEntries,
	seedWri2026Cohort,
	seedWri2026Forms,
	seedWri2026TopicsAndGoalMaps,
} from "./seeders/index.js";

// Minimal seed for WRI 2026 cohort
// - Single admin + teacher account
// - WRI 2026 cohort (empty, no students)
// - Whitelist entries so signup can be tested
// - Frontend-focused goal maps and forms

const program = Effect.gen(function* () {
	yield* Effect.log("=== Seeding WRI 2026 Environment ===");

	// Step 1: Core users only (admin + teacher, no students)
	const { teacherId } = yield* seedCoreUsers();

	// Step 2: WRI 2026 cohort
	yield* seedWri2026Cohort();

	// Step 3: Whitelist entries for signup testing
	yield* seedWhitelistEntries();

	// Step 4: Topics and Goal Maps (Frontend-focused, no Japanese)
	yield* seedWri2026TopicsAndGoalMaps(teacherId);

	// Step 5: Questionnaires
	yield* seedWri2026Forms(teacherId);

	yield* Effect.log("=== WRI 2026 Seed Complete ===");
});

void Effect.runPromise(program.pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty))));
