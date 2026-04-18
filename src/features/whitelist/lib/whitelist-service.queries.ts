import { desc, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";

import { normalizeStudentId } from "@/lib/student-id-auth";
import { Database } from "@/server/db/client";
import { cohorts, whitelistEntries } from "@/server/db/schema/auth-schema";

import { WhitelistNotFoundError, type WhitelistEntryWithCohort } from "./whitelist-service.shared";

export const getWhitelistEntryByStudentId = Effect.fn("getWhitelistEntryByStudentId")((studentId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const normalizedStudentId = normalizeStudentId(studentId);

		const rows = yield* db
			.select({
				id: whitelistEntries.id,
				studentId: whitelistEntries.studentId,
				name: whitelistEntries.name,
				cohortId: whitelistEntries.cohortId,
				cohortName: cohorts.name,
				claimedUserId: whitelistEntries.claimedUserId,
				claimedAt: whitelistEntries.claimedAt,
				createdAt: whitelistEntries.createdAt,
				updatedAt: whitelistEntries.updatedAt,
			})
			.from(whitelistEntries)
			.leftJoin(cohorts, eq(whitelistEntries.cohortId, cohorts.id))
			.where(eq(whitelistEntries.studentId, normalizedStudentId))
			.limit(1);

		const row = rows[0];
		if (!row) return yield* new WhitelistNotFoundError({ studentId: normalizedStudentId });

		return row as WhitelistEntryWithCohort;
	}),
);

export const listUnregisteredWhitelistEntries = Effect.fn("listUnregisteredWhitelistEntries")(() =>
	Effect.gen(function* () {
		const db = yield* Database;

		const rows = yield* db
			.select({
				id: whitelistEntries.id,
				studentId: whitelistEntries.studentId,
				name: whitelistEntries.name,
				cohortId: whitelistEntries.cohortId,
				cohortName: cohorts.name,
				claimedUserId: whitelistEntries.claimedUserId,
				claimedAt: whitelistEntries.claimedAt,
				createdAt: whitelistEntries.createdAt,
				updatedAt: whitelistEntries.updatedAt,
			})
			.from(whitelistEntries)
			.leftJoin(cohorts, eq(whitelistEntries.cohortId, cohorts.id))
			.where(isNull(whitelistEntries.claimedUserId))
			.orderBy(desc(whitelistEntries.createdAt));

		return rows as WhitelistEntryWithCohort[];
	}),
);