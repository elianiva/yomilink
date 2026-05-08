import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import { whitelistEntries } from "@/server/db/schema/auth-schema";

import { EXTRACTED_STUDENTS } from "../data/extracted-students.js";

const SEEDED_WHITELIST_ENTRIES: Array<{
	id: string;
	studentId: string;
	name: string;
}> = EXTRACTED_STUDENTS.map((s) => ({
	id: s.id,
	studentId: s.studentId,
	name: s.name,
}));

export function seedWhitelistEntries() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding Whitelist Entries ---");

		for (const entry of SEEDED_WHITELIST_ENTRIES) {
			const existing = yield* db
				.select()
				.from(whitelistEntries)
				.where(eq(whitelistEntries.studentId, entry.studentId))
				.limit(1);

			if (existing[0]) {
				yield* Effect.log("Whitelist entry " + entry.studentId + " already exists");
				continue;
			}

			yield* db.insert(whitelistEntries).values({
				id: entry.id,
				studentId: entry.studentId,
				name: entry.name,
			});
			yield* Effect.log("Created whitelist entry: " + entry.studentId);
		}
	});
}
