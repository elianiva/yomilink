// @ts-nocheck
import { Database as BunSqliteDatabase } from "bun:sqlite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { inArray, notInArray } from "drizzle-orm";
import { Effect, Layer, Logger, Redacted } from "effect";

import { ServerConfig } from "@/config";
import { AppLayer } from "@/server/app-layer";
import { Database } from "@/server/db/client";
import {
	account,
	cohortMembers,
	cohorts,
	session,
	user,
	whitelistEntries,
} from "@/server/db/schema/auth-schema";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SOURCE_DB = process.env.SOURCE_DB ?? resolve(ROOT, "yomilink-prod.db");

function querySource(sqlQuery: string): unknown[] {
	const source = new BunSqliteDatabase(SOURCE_DB);
	const rows = source.query(sqlQuery).all();
	source.close();
	return rows;
}

function getSourceColumns(table: string): string[] {
	const source = new BunSqliteDatabase(SOURCE_DB);
	const rows = source.query(`PRAGMA table_info("${table}")`).all() as Array<
		Record<string, unknown>
	>;
	source.close();
	return rows.map((r) => r.name as string);
}

function importAll() {
	return Effect.gen(function* () {
		const db = yield* Database;
		const config = yield* ServerConfig;
		const client = createClient({
			url: config.databaseUrl,
			authToken: Redacted.value(config.dbAuthToken),
		});

		yield* Effect.log(`Importing from: ${SOURCE_DB}`);

		// 1. Build cohort name→id map from seed (keep seed's cohort IDs)
		yield* Effect.log("\n=== Mapping cohort IDs ===");
		const seedCohorts = yield* db.select({ id: cohorts.id, name: cohorts.name }).from(cohorts);
		const seedCohortIdByName: Record<string, string> = {};
		for (const sc of seedCohorts) {
			seedCohortIdByName[sc.name] = sc.id;
		}
		yield* Effect.log(`  Found ${Object.keys(seedCohortIdByName).length} seed cohorts`);

		// Build old prod cohort ID → new seed cohort ID map by matching names
		const prodCohortRows = querySource("SELECT * FROM cohorts") as Array<
			Record<string, unknown>
		>;
		const oldToNewCohortId: Record<string, string> = {};
		for (const row of prodCohortRows) {
			const name = row.name as string;
			const newId = seedCohortIdByName[name];
			if (newId) {
				oldToNewCohortId[row.id as string] = newId;
			}
		}
		yield* Effect.log(
			`  Mapped ${Object.keys(oldToNewCohortId).length} old cohort IDs to seed IDs`,
		);

		// 2. Users — replace student users with prod user accounts, keep admin/teacher
		yield* Effect.log("\n=== Users ===");
		const userRows = querySource("SELECT * FROM user") as Array<Record<string, unknown>>;

		const keepUsers = yield* db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.role, ["admin", "teacher"]));
		const keepIds = keepUsers.map((u) => u.id);
		if (keepIds.length > 0) {
			yield* db.delete(session).where(notInArray(session.userId, keepIds));
			yield* db.delete(account).where(notInArray(account.userId, keepIds));
			yield* db.delete(user).where(notInArray(user.id, keepIds));
		} else {
			yield* db.delete(session);
			yield* db.delete(account);
			yield* db.delete(user);
		}

		let uOk = 0;
		let uSkip = 0;
		for (const row of userRows) {
			try {
				yield* db.insert(user).values({
					id: row.id as string,
					name: row.name as string,
					email: row.email as string,
					studentId: row.student_id as string | null,
					emailVerified: Boolean((row.email_verified as number) ?? 0),
					image: row.image as string | null,
					createdAt: new Date(row.created_at as number),
					updatedAt: new Date(row.updated_at as number),
					role: row.role as string | null,
					age: row.age as number | null,
					jlptLevel: (row.jlpt_level ?? null) as
						| "N5"
						| "N4"
						| "N3"
						| "N2"
						| "N1"
						| "None"
						| null,
					japaneseLearningDuration: row.japanese_learning_duration as number | null,
					previousJapaneseScore: row.previous_japanese_score as number | null,
					mediaConsumption: row.media_consumption as number | null,
					motivation: row.motivation as string | null,
					banned: Boolean((row.banned as number) ?? 0),
					banReason: row.ban_reason as string | null,
					banExpires: (row.ban_expires as number | null)
						? new Date(row.ban_expires as number)
						: null,
					studyGroup: (row.study_group ?? null) as "experiment" | "control" | null,
					consentGiven: Boolean((row.consent_given as number) ?? 0),
				});
				uOk++;
			} catch (err) {
				yield* Effect.logWarning(`  Skipped ${String(row.email)}: ${String(err)}`);
				uSkip++;
			}
		}
		yield* Effect.log(`  ${uOk} inserted, ${uSkip} skipped (${userRows.length} total)`);

		// 3. Cohort Members — remap cohortId to seed cohort IDs
		yield* Effect.log("\n=== Cohort Members ===");
		const cmCols = getSourceColumns("cohort_members");
		const cmRows = querySource("SELECT * FROM cohort_members") as Array<
			Record<string, unknown>
		>;
		yield* db.delete(cohortMembers);
		let cm = 0;
		for (const row of cmRows) {
			try {
				const deletedAt = cmCols.includes("deleted_at")
					? (row.deleted_at as number | null)
					: null;
				const oldCohortId = row.cohort_id as string;
				const newCohortId = oldToNewCohortId[oldCohortId] ?? oldCohortId;
				yield* db.insert(cohortMembers).values({
					id: row.id as string as any,
					cohortId: newCohortId,
					userId: row.user_id as string,
					role: (row.role as string) ?? "member",
					joinedAt: new Date((row.joined_at ?? row.created_at) as number),
					deletedAt: deletedAt ? new Date(deletedAt) : null,
				});
				cm++;
			} catch (err) {
				yield* Effect.logWarning(`  Skipped: ${String(err)}`);
			}
		}
		yield* Effect.log(`  ${cm}/${cmRows.length}`);

		// 4. Whitelist — remap cohortId to seed cohort IDs
		yield* Effect.log("\n=== Whitelist Entries ===");
		const wlCols = getSourceColumns("whitelist_entries");
		const wlRows = querySource("SELECT * FROM whitelist_entries") as Array<
			Record<string, unknown>
		>;
		yield* db.delete(whitelistEntries);
		let wl = 0;
		for (const row of wlRows) {
			try {
				const isClaimed = row.claimed_user_id !== null && row.claimed_user_id !== undefined;
				const deletedAt = wlCols.includes("deleted_at")
					? (row.deleted_at as number | null)
					: isClaimed
						? Date.now()
						: null;
				const oldCohortId = row.cohort_id as string | null;
				const newCohortId = oldCohortId
					? (oldToNewCohortId[oldCohortId] ?? oldCohortId)
					: null;
				yield* db.insert(whitelistEntries).values({
					id: row.id as string,
					studentId: row.student_id as string,
					name: row.name as string,
					cohortId: newCohortId,
					claimedUserId: row.claimed_user_id as string | null,
					claimedAt: (row.claimed_at as number | null)
						? new Date(row.claimed_at as number)
						: null,
					createdAt: new Date(row.created_at as number),
					updatedAt: new Date(row.updated_at as number),
					deletedAt: deletedAt ? new Date(deletedAt) : null,
				});
				wl++;
			} catch (err) {
				yield* Effect.logWarning(`  Skipped ${String(row.student_id)}: ${String(err)}`);
			}
		}
		yield* Effect.log(`  ${wl}/${wlRows.length}`);

		client.close();

		return { users: uOk, cohortMembers: cm, whitelist: wl };
	});
}

export function seedProdUsers() {
	return importAll();
}

const program = Effect.gen(function* () {
	yield* Effect.log("=== Push prod users & cohorts to Turso ===");
	yield* seedProdUsers();
	yield* Effect.log("\n=== Done ===");
}).pipe(Effect.provide(Layer.merge(AppLayer, Logger.pretty)));

void Effect.runPromise(program.pipe(Effect.catchAllDefect((d) => Effect.logError(String(d)))));
