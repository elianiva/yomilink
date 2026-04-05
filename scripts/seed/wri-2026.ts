import { Layer, Logger, Effect } from "effect";

import { Auth } from "@/lib/auth";
import { AppLayer } from "@/server/app-layer";

import {
	seedCoreUsers,
	seedWri2026Cohort,
	seedWri2026Forms,
	seedWri2026TopicsAndGoalMaps,
} from "./seeders/index.js";

// Minimal seed for WRI 2026 cohort
// - Single admin + teacher account
// - WRI 2026 cohort (empty, no students)
// - Questionnaires (TAM, Feedback, Pre/Post/Delayed tests)

const program = Effect.gen(function* () {
	yield* Effect.log("=== Seeding WRI 2026 Environment ===");

	// Step 1: Core users only (admin + teacher, no students)
	const { teacherId } = yield* seedCoreUsers();

	// Step 2: WRI 2026 cohort
	const { cohortId } = yield* seedWri2026Cohort();

	// Step 3: Topics and Goal Maps (Frontend-focused, no Japanese)
	const { topicId, goalMapId } = yield* seedWri2026TopicsAndGoalMaps(teacherId);

	// Step 4: Questionnaires
	const formIds = yield* seedWri2026Forms(teacherId);

	yield* Effect.log(
		"\n=== WRI 2026 Seed Complete ===\n" +
			"Credentials:\n" +
			"  Admin:  admin@demo.local / admin123\n" +
			"  Teacher: teacher@demo.local / teacher123\n" +
			"\n" +
			"Created:\n" +
			`  - Cohort: WRI 2026 (${cohortId.slice(0, 8)}...)\n` +
			`  - Topic: Frontend Web Development (${topicId.slice(0, 8)}...)\n` +
			`  - Goal Map: Frontend Web Development Basics (${goalMapId.slice(0, 8)}...)\n` +
			`  - Forms: TAM, Feedback, Pre/Post tests\n` +
			"\n" +
			"Note: No student accounts created. Add students manually or via cohort invite.\n",
	);

	return { teacherId, cohortId, topicId, goalMapId, formIds };
}).pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty)));

void Effect.runPromise(program);
