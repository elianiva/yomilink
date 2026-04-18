import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { Effect, Schema } from "effect";

import { randomString } from "@/lib/utils";
import { normalizeStudentId } from "@/lib/student-id-auth";
import { Database } from "@/server/db/client";
import { whitelistEntries } from "@/server/db/schema/auth-schema";

import { getWhitelistEntryByStudentId, listUnregisteredWhitelistEntries } from "./whitelist-service.queries";
import {
	WhitelistAlreadyClaimedError,
	WhitelistImportFailedError,
	type WhitelistImportResult,
	type WhitelistCsvRow,
} from "./whitelist-service.shared";

function readRowValue(row: Record<string, unknown>, keys: string[]) {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}

	return "";
}

export const importWhitelistCsv = Effect.fn("importWhitelistCsv")((csvText: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const parsed = Papa.parse<Record<string, unknown>>(csvText, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ""),
		});

		if (parsed.errors.length > 0) {
			return yield* new WhitelistImportFailedError({
				message: parsed.errors[0]?.message ?? "Failed to parse CSV",
			});
		}

		const rawRows = parsed.data ?? [];
		if (rawRows.length === 0) {
			return { importedCount: 0 } satisfies WhitelistImportResult;
		}

		const rows = rawRows.map((row, index) => {
			const studentId = normalizeStudentId(
				readRowValue(row, ["studentid", "student_id", "student", "id"]),
			);
			const name = readRowValue(row, ["name", "fullname", "full_name"]);
			const cohortId = readRowValue(row, ["cohortid", "cohort_id", "cohort"]) || null;

			if (!studentId) {
				throw new WhitelistImportFailedError({
					message: "Missing student id on row " + String(index + 1),
				});
			}
			if (!name) {
				throw new WhitelistImportFailedError({
					message: "Missing name on row " + String(index + 1),
				});
			}

			return Schema.decodeUnknownSync(WhitelistCsvRow)({
				studentId,
				name,
				cohortId,
			});
		});

		for (const row of rows) {
			yield* db
				.insert(whitelistEntries)
				.values({
					id: randomString(),
					studentId: row.studentId,
					name: row.name,
					cohortId: row.cohortId ?? null,
				})
				.onConflictDoUpdate({
					target: whitelistEntries.studentId,
					set: {
						name: row.name,
						cohortId: row.cohortId ?? null,
						updatedAt: new Date(),
					},
				});
		}

		return { importedCount: rows.length } satisfies WhitelistImportResult;
	}),
);

export const claimWhitelistEntry = Effect.fn("claimWhitelistEntry")((studentId: string, userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const normalizedStudentId = normalizeStudentId(studentId);

		const entry = yield* getWhitelistEntryByStudentId(normalizedStudentId);
		if (entry.claimedUserId) {
			return yield* new WhitelistAlreadyClaimedError({ studentId: normalizedStudentId });
		}

		yield* db
			.update(whitelistEntries)
			.set({
				claimedUserId: userId,
				claimedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(whitelistEntries.studentId, normalizedStudentId));

		return entry;
	}),
);

export const listUnregisteredWhitelist = listUnregisteredWhitelistEntries;