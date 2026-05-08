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
	seedWhitelistEntries,
} from "./seeders/index.js";

const program = Effect.gen(function* () {
	yield* Effect.log("Seeding database...");

	const { userIdsByEmail, teacherId } = yield* seedUsers();
	yield* seedCohorts();
	yield* seedWhitelistEntries();

	const { goalMapIdsByTitle, goalMapDataByTitle } = yield* seedGoalMaps(teacherId);
	const { preTestFormId, postTestFormId, delayedTestFormId } = yield* seedForms(teacherId);

	const demoData = yield* seedDemoData(
		userIdsByEmail,
		teacherId,
		goalMapIdsByTitle,
		goalMapDataByTitle,
		{ preTestFormId, postTestFormId, delayedTestFormId },
	);

	if (!demoData) {
		yield* Effect.log("Failed to create demo data - わたしのうち goal map not found");
		return;
	}

	yield* seedSubmissions(
		userIdsByEmail,
		demoData.demoAssignmentId,
		demoData.dailyLifeGoalMapId,
		demoData.demoKitId,
		demoData.dailyLifeData,
		{ preTestFormId, postTestFormId, delayedTestFormId },
	);

	yield* Effect.log(
		"--- Seed completed ---\n" +
			"Demo credentials:\n" +
			"  Admin: admin@kitbuild.mail / admin123\n" +
			"  Teacher: banni@kitbuild.mail / banni12345\n" +
			"  Teacher: helmy@kitbuild.mail / helmy12345\n" +
			"  Teacher: dicha@kitbuild.mail / dicha12345\n" +
			"Created:\n" +
			"  - Cohorts: 2A Business Administration, 2B Business Administration\n" +
			"  - Kit: わたしのうち Kit (" +
			demoData.demoKitId.slice(0, 8) +
			"...)\n" +
			"  - Assignment: わたしのうち Demo Assignment (" +
			demoData.demoAssignmentId.slice(0, 8) +
			"...)\n" +
			"  - Forms: pre-test, post-test, delayed-test\n" +
			"  - Submissions: 5 demo student accounts\n" +
			"  - Whitelist: 47 reserved student IDs\n",
	);
}).pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty)));

void Effect.runPromise(program);
