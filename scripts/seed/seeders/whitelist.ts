import { eq, inArray } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import { cohorts, whitelistEntries } from "@/server/db/schema/auth-schema";

import { EXTRACTED_STUDENTS } from "../data/extracted-students.js";

export function seedWhitelistEntries() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding Whitelist Entries ---");

		// Look up cohort IDs to map extracted cohort tags to actual DB IDs
		const cohortRows = yield* db
			.select({ id: cohorts.id, name: cohorts.name })
			.from(cohorts)
			.where(inArray(cohorts.name, ["2A Business Administration", "2B Business Administration"]));

		const cohortMap: Record<string, string> = {};
		for (const row of cohortRows) {
			if (row.name.startsWith("2A")) cohortMap["2A"] = row.id;
			if (row.name.startsWith("2B")) cohortMap["2B"] = row.id;
		}

		for (const entry of EXTRACTED_STUDENTS) {
			const cohortId = cohortMap[entry.cohort] ?? null;

			const existing = yield* db
				.select()
				.from(whitelistEntries)
				.where(eq(whitelistEntries.studentId, entry.studentId))
				.limit(1);

			if (existing[0]) {
				yield* db
					.update(whitelistEntries)
					.set({ name: entry.name, cohortId })
					.where(eq(whitelistEntries.studentId, entry.studentId));
				yield* Effect.log("Updated whitelist entry: " + entry.studentId);
				continue;
			}

			yield* db.insert(whitelistEntries).values({
				id: entry.id,
				studentId: entry.studentId,
				name: entry.name,
				cohortId,
			});
			yield* Effect.log("Created whitelist entry: " + entry.studentId);
		}
	});
}
