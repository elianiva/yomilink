import { Effect, Layer, Logger } from "effect";

import { AppLayer } from "@/server/app-layer";

import { seedUsers, seedCohorts, seedGoalMaps, seedDemoData, seedWhitelistEntries } from "./seeders/index.js";

const program = Effect.gen(function* () {
	yield* Effect.log("Seeding database...");

	const { userIdsByEmail, teacherId } = yield* seedUsers();
	yield* seedCohorts();
	yield* seedWhitelistEntries();

	const { goalMapIdsByTitle, goalMapDataByTitle } = yield* seedGoalMaps(teacherId);

	const demoData = yield* seedDemoData(userIdsByEmail, teacherId, goalMapIdsByTitle, goalMapDataByTitle);

	if (!demoData) {
		yield* Effect.log("--- Seed completed ---");
		return;
	}

	yield* Effect.log(
		"--- Seed completed ---
" +
			"Demo credentials:
" +
			"  Admin: admin@demo.local / admin123
" +
			"  Teacher: teacher@demo.local / teacher123
" +
			"  Students: see seeded demo users
",
	);
});

void Effect.runPromise(program.pipe(Effect.provide(Layer.mergeAll(AppLayer, Logger.pretty))));
