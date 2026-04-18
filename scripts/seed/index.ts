import { Layer, Logger, Effect } from "effect";

import { Auth } from "@/lib/auth";
import { AppLayer } from "@/server/app-layer";

import { seedUsers, seedCohorts, seedGoalMaps, seedDemoData } from "./seeders/index.js";

const program = Effect.gen(function* () {
	yield* Effect.log("Seeding database...");

	const { userIdsByEmail, teacherId } = yield* seedUsers();
	yield* seedCohorts();

	const { goalMapIdsByTitle, goalMapDataByTitle } = yield* seedGoalMaps(teacherId);

	const demoData = yield* seedDemoData(userIdsByEmail, teacherId, goalMapIdsByTitle, goalMapDataByTitle);

	if (!demoData) {
		yield* Effect.log("Failed to create demo data - Tanaka's Daily Life goal map not found");
		return;
	}

	yield* Effect.log(
		"--- Seed completed ---\n" +
			"Demo credentials:\n" +
			"  Admin: admin@demo.local / admin123\n" +
			"  Teacher: teacher@demo.local / teacher123\n" +
			"  Students: 5 accounts\n" +
			"    - tanaka, suzuki, yamamoto, watanabe, takahashi\n" +
			"Created:\n" +
			"  - Cohort: Demo Class 2025 (" + demoData.demoCohortId.slice(0, 8) + "...)\n" +
			"  - Kit: Tanaka's Daily Life Kit (" + demoData.demoKitId.slice(0, 8) + "...)\n" +
			"  - Assignment: Tanaka's Daily Life Demo (" + demoData.demoAssignmentId.slice(0, 8) + "...)\n",
	);
}).pipe(Effect.provide(Layer.mergeAll(AppLayer, Auth.Default, Logger.pretty)));

void Effect.runPromise(program);