import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { cohorts } from "@/server/db/schema/auth-schema";

export const COHORTS = [
	{ name: "2A Business Administration", description: "2A Business Administration cohort" },
	{ name: "2B Business Administration", description: "2B Business Administration cohort" },
];

export function seedCohorts() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding Cohorts ---");

		for (const cohortData of COHORTS) {
			const existing = yield* db
				.select()
				.from(cohorts)
				.where(eq(cohorts.name, cohortData.name))
				.limit(1);

			if (existing.length === 0) {
				const id = randomString();
				yield* db.insert(cohorts).values({
					id,
					name: cohortData.name,
					description: cohortData.description,
				});
				yield* Effect.log(`  Created cohort: ${cohortData.name} (${id})`);
			} else {
				yield* db
					.update(cohorts)
					.set({ description: cohortData.description })
					.where(eq(cohorts.id, existing[0].id));
				yield* Effect.log(`  Updated cohort: ${cohortData.name}`);
			}
		}
	});
}
