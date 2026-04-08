import { count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Effect } from "effect";

import { buildWhereClause, calculateOffset, createFuzzyPattern } from "@/lib/db-query-builder";
import { Database } from "@/server/db/client";
import { cohorts, cohortMembers, user } from "@/server/db/schema/auth-schema";

import {
	UserNotFoundError,
	type UserFilterInput,
	type UserListResult,
	type UserWithCohorts,
} from "./user-service.shared";

export const listUsers = Effect.fn("listUsers")((input: UserFilterInput) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const { search, role: roleFilter, banned: bannedFilter, cohortId, page, pageSize } = input;

		let userIdFilter: string[] | undefined;
		if (cohortId) {
			const memberIds = yield* db
				.select({ userId: cohortMembers.userId })
				.from(cohortMembers)
				.where(eq(cohortMembers.cohortId, cohortId));

			if (memberIds.length === 0) {
				return {
					users: [],
					total: 0,
					page,
					pageSize,
					totalPages: 0,
				} satisfies UserListResult;
			}
			userIdFilter = memberIds.map((m) => m.userId);
		}

		const whereClause = buildWhereClause([
			search
				? or(
						ilike(user.name, createFuzzyPattern(search)),
						ilike(user.email, createFuzzyPattern(search)),
					)
				: null,
			roleFilter ? eq(user.role, roleFilter) : null,
			bannedFilter !== undefined ? eq(user.banned, bannedFilter) : null,
			userIdFilter ? inArray(user.id, userIdFilter) : null,
		]);

		const countRows = yield* db.select({ total: count() }).from(user).where(whereClause);
		const total = countRows[0]?.total ?? 0;

		const offset = calculateOffset({ page, pageSize });
		const users_ = yield* db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				studentId: user.studentId,
				role: user.role,
				image: user.image,
				banned: user.banned,
				banReason: user.banReason,
				banExpires: user.banExpires,
				createdAt: user.createdAt,
				age: user.age,
				jlptLevel: user.jlptLevel,
				japaneseLearningDuration: user.japaneseLearningDuration,
				previousJapaneseScore: user.previousJapaneseScore,
				mediaConsumption: user.mediaConsumption,
				motivation: user.motivation,
				studyGroup: user.studyGroup,
				cohortId: cohortMembers.cohortId,
				cohortName: cohorts.name,
			})
			.from(user)
			.leftJoin(cohortMembers, eq(user.id, cohortMembers.userId))
			.leftJoin(cohorts, eq(cohortMembers.cohortId, cohorts.id))
			.where(whereClause)
			.limit(pageSize)
			.offset(offset)
			.orderBy(sql`${user.createdAt} DESC`);

		const userMap = new Map<string, UserWithCohorts>();

		for (const row of users_) {
			const existing = userMap.get(row.id);

			if (existing) {
				if (row.cohortId && row.cohortName) {
					existing.cohorts.push({ id: row.cohortId, name: row.cohortName });
				}
			} else {
				userMap.set(row.id, {
					id: row.id,
					name: row.name,
					email: row.email,
					studentId: row.studentId,
					role: row.role,
					image: row.image,
					banned: row.banned ?? false,
					banReason: row.banReason,
					banExpires: row.banExpires,
					createdAt: row.createdAt,
					age: row.age,
					jlptLevel: row.jlptLevel,
					japaneseLearningDuration: row.japaneseLearningDuration,
					previousJapaneseScore: row.previousJapaneseScore,
					mediaConsumption: row.mediaConsumption,
					motivation: row.motivation,
					studyGroup: row.studyGroup,
					cohorts:
						row.cohortId && row.cohortName
							? [{ id: row.cohortId, name: row.cohortName }]
							: [],
				});
			}
		}

		const totalPages = Math.ceil(total / pageSize);

		return {
			users: Array.from(userMap.values()),
			total,
			page,
			pageSize,
			totalPages,
		} satisfies UserListResult;
	}),
);

export const getUserById = Effect.fn("getUserById")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const userRows = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);

		const user_ = userRows[0];

		if (!user_) {
			return yield* new UserNotFoundError({ userId });
		}

		const cohorts_ = yield* db
			.select({ id: cohorts.id, name: cohorts.name })
			.from(cohortMembers)
			.innerJoin(cohorts, eq(cohortMembers.cohortId, cohorts.id))
			.where(eq(cohortMembers.userId, userId));

		return {
			...user_,
			cohorts: cohorts_,
		} satisfies UserWithCohorts;
	}),
);
