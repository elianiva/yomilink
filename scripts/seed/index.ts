import { Layer, Logger, Effect } from "effect";

import { Auth } from "@/lib/auth";
import { AppLayer } from "@/server/app-layer";

import {
	seedUsers,
	seedCohorts,
	seedGoalMaps,
	seedDemoData,
	seedForms,
	seedResponses,
	seedLearnerMaps,
} from "./seeders/index.js";

const program = Effect.gen(function* () {
	yield* Effect.log("Seeding database...");

	// Step 1: Seed users
	const { userIdsByEmail, teacherId } = yield* seedUsers();

	// Step 1.5: Seed cohorts
	yield* seedCohorts();

	// Step 2: Seed topics and goal maps
	const { goalMapIdsByTitle, goalMapDataByTitle } = yield* seedGoalMaps(teacherId);

	// Step 3: Seed forms
	const { tamFormId, feedbackFormId, preTestFormId, postTestFormId, delayedTestFormId } =
		yield* seedForms(teacherId);

	// Step 4: Create demo data (cohort, kit, assignment)
	const demoData = yield* seedDemoData(
		userIdsByEmail,
		teacherId,
		goalMapIdsByTitle,
		goalMapDataByTitle,
		{
			tamFormId,
			feedbackFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
		},
	);

	if (!demoData) {
		yield* Effect.log("Failed to create demo data - Tanaka's Daily Life goal map not found");
		return;
	}

	const {
		demoAssignmentId,
		dailyLifeGoalMapId,
		demoKitId,
		dailyLifeData,
		twoWeeksAgo,
		oneWeekAgo,
		studentConditionMap,
	} = demoData;

	// Step 5: Seed responses
	yield* seedResponses(
		userIdsByEmail,
		tamFormId,
		feedbackFormId,
		preTestFormId,
		postTestFormId,
		delayedTestFormId,
		{ oneWeekAgo, twoWeeksAgo },
	);

	// Step 6: Create learner maps and diagnoses
	yield* seedLearnerMaps(
		userIdsByEmail,
		demoAssignmentId,
		dailyLifeGoalMapId,
		demoKitId,
		dailyLifeData,
		oneWeekAgo,
		studentConditionMap,
	);

	yield* Effect.log(
		"--- Seed completed ---\n" +
			"Demo credentials:\n" +
			"  Teacher: teacher@demo.local / teacher123\n" +
			"  Demo students: [name]@demo.local / demo12345\n" +
			"    - tanaka, suzuki, yamamoto, watanabe, takahashi\n" +
			"    - ito, nakamura, kobayashi, kato, matsumoto\n",
	);
}).pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty)));

Effect.runPromise(program);
