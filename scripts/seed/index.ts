import { Layer, Logger, Effect } from "effect";

import { Auth } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limiter";
import { DatabaseLive } from "@/server/db/client";

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
	const {
		tamFormId,
		preTestFormId,
		postTestFormId,
		delayedTestFormId,
		tamFormIdDoko,
		preTestFormIdDoko,
		postTestFormIdDoko,
		delayedTestFormIdDoko,
	} = yield* seedForms(teacherId);

	const demoData = yield* seedDemoData(
		userIdsByEmail,
		teacherId,
		goalMapIdsByTitle,
		goalMapDataByTitle,
		{
			tamFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
			tamFormIdDoko,
			preTestFormIdDoko,
			postTestFormIdDoko,
			delayedTestFormIdDoko,
		},
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
		{
			assignmentId: demoData.dokoAssignmentId,
			goalMapId: demoData.dokoGoalMapId,
			kitId: demoData.dokoKitId,
			data: demoData.dokoData,
			formIds: {
				preTestFormId: preTestFormIdDoko,
				postTestFormId: postTestFormIdDoko,
				delayedTestFormId: delayedTestFormIdDoko,
			},
		},
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
			"  - Kits: わたしのうち, どこが いちばん いいですか\n" +
			"  - Assignments: 2 demo assignments\n" +
			"  - Forms: pre-test, post-test, delayed-test, TAM, feedback (both materials)\n" +
			"  - Submissions: 5 demo student accounts per material\n" +
			"  - Whitelist: 47 reserved student IDs\n",
	);
}).pipe(
	Effect.provide(
		Layer.mergeAll(
			Layer.provideMerge(Auth.Default, DatabaseLive),
			RateLimiter.Default,
			Logger.pretty,
		),
	),
);

void Effect.runPromise(program);
