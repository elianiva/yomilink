import { Layer, Logger, Effect } from "effect";

import { Auth } from "@/lib/auth";
import { AppLayer } from "@/server/app-layer";

import {
	seedCohorts,
	seedDemoData,
	seedForms,
	seedGoalMaps,
	seedSubmissions,
	seedUsers,
	seedWhitelistAccounts,
	seedWhitelistEntries,
} from "./seeders/index.js";

const program = Effect.gen(function* () {
	yield* Effect.log("Seeding database...");

	const { userIdsByEmail, teacherId } = yield* seedUsers();
	yield* seedCohorts();
	yield* seedWhitelistEntries();

	const whitelistAccounts = yield* seedWhitelistAccounts();
	const allUserIdsByEmail = { ...userIdsByEmail, ...whitelistAccounts.userIdsByEmail };

	const { goalMapIdsByTitle, goalMapDataByTitle } = yield* seedGoalMaps(teacherId);
	const { preTestFormId, postTestFormId, delayedTestFormId } = yield* seedForms(teacherId);

	const demoData = yield* seedDemoData(
		allUserIdsByEmail,
		teacherId,
		goalMapIdsByTitle,
		goalMapDataByTitle,
		{ preTestFormId, postTestFormId, delayedTestFormId },
	);

	if (!demoData) {
		yield* Effect.log("Failed to create demo data - Japan map goal map not found");
		return;
	}

	yield* seedSubmissions(
		allUserIdsByEmail,
		demoData.demoAssignmentId,
		demoData.dailyLifeGoalMapId,
		demoData.demoKitId,
		demoData.dailyLifeData,
		{ preTestFormId, postTestFormId, delayedTestFormId },
	);

	yield* Effect.log(
		"--- Seed completed ---\n" +
			"Demo credentials:\n" +
			"  Admin: admin@demo.local / admin123\n" +
			"  Teacher: teacher@demo.local / teacher123\n" +
			"  Whitelist: 20 reserved student IDs\n" +
			"Created:\n" +
			"  - Cohort: Demo Class 2025 (" + demoData.demoCohortId.slice(0, 8) + "...)\n" +
			"  - Kit: Japan Islands Tree Kit (" + demoData.demoKitId.slice(0, 8) + "...)\n" +
			"  - Assignment: Japan Islands Tree Demo (" + demoData.demoAssignmentId.slice(0, 8) + "...)\n" +
			"  - Forms: pre-test, post-test, delayed-test\n" +
			"  - Submissions: 5 whitelist accounts\n",
	);
}).pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty)));

void Effect.runPromise(program);
