import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { buildWhereClause, calculateOffset, createFuzzyPattern } from "@/lib/db-query-builder";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import { cohorts, cohortMembers, user, verification } from "@/server/db/schema/auth-schema";

// === Schemas ===

export const Role = Schema.Literal("teacher", "admin", "student");

export type Role = typeof Role.Type;

export const UserFilterInput = Schema.Struct({
	search: Schema.optional(Schema.String),
	role: Schema.optional(Role),
	banned: Schema.optional(Schema.Boolean),
	cohortId: Schema.optional(Schema.String),
	page: Schema.optionalWith(Schema.Number, { default: () => 1 }),
	pageSize: Schema.optionalWith(Schema.Number, { default: () => 20 }),
});

export type UserFilterInput = typeof UserFilterInput.Type;

export const UpdateUserInput = Schema.Struct({
	name: Schema.optional(NonEmpty("Name")),
	email: Schema.optional(Schema.String),
	studentId: Schema.optionalWith(Schema.String, { nullable: true }),
	age: Schema.optionalWith(Schema.Number, { nullable: true }),
	jlptLevel: Schema.optionalWith(
		Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None")),
		{ nullable: true },
	),
	japaneseLearningDuration: Schema.optionalWith(Schema.Number, { nullable: true }),
	previousJapaneseScore: Schema.optionalWith(Schema.Number, { nullable: true }),
	mediaConsumption: Schema.optionalWith(Schema.Number, { nullable: true }),
	motivation: Schema.optionalWith(Schema.String, { nullable: true }),
	studyGroup: Schema.optionalWith(
		Schema.Union(Schema.Literal("experiment", "control", "unassigned")),
		{ nullable: true },
	),
});

export type UpdateUserInput = typeof UpdateUserInput.Type;

export const BanUserInput = Schema.Struct({
	userId: Schema.String,
	reason: NonEmpty("Reason"),
	expiresAt: Schema.optional(Schema.Date),
});

export type BanUserInput = typeof BanUserInput.Type;

export const BulkCohortAssignInput = Schema.Struct({
	userIds: Schema.Array(Schema.String),
	cohortId: Schema.String,
	action: Schema.Literal("add", "remove"),
});

export type BulkCohortAssignInput = typeof BulkCohortAssignInput.Type;

export const UpdateRoleInput = Schema.Struct({
	userId: Schema.String,
	role: Role,
});

export type UpdateRoleInput = typeof UpdateRoleInput.Type;

// === Types ===

export type UserWithCohorts = {
	id: string;
	name: string;
	email: string;
	studentId: string | null;
	role: string | null;
	image: string | null;
	banned: boolean | null;
	banReason: string | null;
	banExpires: Date | null;
	createdAt: Date;
	age: number | null;
	jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1" | "None" | null;
	japaneseLearningDuration: number | null;
	previousJapaneseScore: number | null;
	mediaConsumption: number | null;
	motivation: string | null;
	studyGroup: "experiment" | "control" | null;
	cohorts: { id: string; name: string }[];
};

export type UserListResult = {
	users: UserWithCohorts[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

// === Errors ===

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
	readonly userId: string;
}> {}

export class CannotModifySelfError extends Data.TaggedError("CannotModifySelfError")<{
	readonly message: string;
}> {}

export class LastAdminError extends Data.TaggedError("LastAdminError")<{
	readonly message: string;
}> {}

// === Functions ===

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

		// Group cohorts per user
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

export const updateUser = Effect.fn("updateUser")(
	(_actorId: string, userId: string, data: UpdateUserInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const existingRows = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);

			if (existingRows.length === 0) {
				return yield* new UserNotFoundError({ userId });
			}

			const updateData: Record<string, unknown> = {};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.email !== undefined) updateData.email = data.email;
			if (data.studentId !== undefined) updateData.studentId = data.studentId;
			if (data.age !== undefined) updateData.age = data.age;
			if (data.jlptLevel !== undefined) updateData.jlptLevel = data.jlptLevel;
			if (data.japaneseLearningDuration !== undefined) {
				updateData.japaneseLearningDuration = data.japaneseLearningDuration;
			}
			if (data.previousJapaneseScore !== undefined) {
				updateData.previousJapaneseScore = data.previousJapaneseScore;
			}
			if (data.mediaConsumption !== undefined)
				updateData.mediaConsumption = data.mediaConsumption;
			if (data.motivation !== undefined) updateData.motivation = data.motivation;
			if (data.studyGroup !== undefined) {
				updateData.studyGroup = data.studyGroup === "unassigned" ? null : data.studyGroup;
			}

			if (Object.keys(updateData).length === 0) {
				return yield* getUserById(userId);
			}

			yield* db.update(user).set(updateData).where(eq(user.id, userId));

			return yield* getUserById(userId);
		}),
);

export const updateUserRole = Effect.fn("updateUserRole")(
	(actorId: string, input: UpdateRoleInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Cannot modify self
			if (actorId === input.userId) {
				return yield* new CannotModifySelfError({
					message: "Cannot change your own role",
				});
			}

			const existingRows = yield* db
				.select()
				.from(user)
				.where(eq(user.id, input.userId))
				.limit(1);

			const existing = existingRows[0];

			if (!existing) {
				return yield* new UserNotFoundError({ userId: input.userId });
			}

			// Prevent demoting last admin
			if (existing.role === "admin" && input.role !== "admin") {
				const countRows = yield* db
					.select({ count: count() })
					.from(user)
					.where(eq(user.role, "admin"));

				const adminCount = countRows[0]?.count ?? 0;

				if (adminCount <= 1) {
					return yield* new LastAdminError({
						message: "Cannot demote the last admin",
					});
				}
			}

			yield* db.update(user).set({ role: input.role }).where(eq(user.id, input.userId));

			return yield* getUserById(input.userId);
		}),
);

export const banUser = Effect.fn("banUser")((actorId: string, input: BanUserInput) =>
	Effect.gen(function* () {
		const db = yield* Database;

		// Cannot ban self
		if (actorId === input.userId) {
			return yield* new CannotModifySelfError({
				message: "Cannot ban yourself",
			});
		}

		const existingRows = yield* db
			.select()
			.from(user)
			.where(eq(user.id, input.userId))
			.limit(1);

		const existing = existingRows[0];

		if (!existing) {
			return yield* new UserNotFoundError({ userId: input.userId });
		}

		// Prevent banning last admin
		if (existing.role === "admin") {
			const countRows = yield* db
				.select({ count: count() })
				.from(user)
				.where(eq(user.role, "admin"));

			const adminCount = countRows[0]?.count ?? 0;

			if (adminCount <= 1) {
				return yield* new LastAdminError({
					message: "Cannot ban the last admin",
				});
			}
		}

		yield* db
			.update(user)
			.set({
				banned: true,
				banReason: input.reason,
				banExpires: input.expiresAt ?? null,
			})
			.where(eq(user.id, input.userId));

		return yield* getUserById(input.userId);
	}),
);

export const unbanUser = Effect.fn("unbanUser")((actorId: string, userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		// Cannot unban self (doesn't make sense anyway)
		if (actorId === userId) {
			return yield* new CannotModifySelfError({
				message: "Cannot unban yourself",
			});
		}

		const existingRows = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);

		if (existingRows.length === 0) {
			return yield* new UserNotFoundError({ userId });
		}

		yield* db
			.update(user)
			.set({
				banned: false,
				banReason: null,
				banExpires: null,
			})
			.where(eq(user.id, userId));

		return yield* getUserById(userId);
	}),
);

export const bulkAssignCohort = Effect.fn("bulkAssignCohort")((input: BulkCohortAssignInput) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const { userIds, cohortId, action } = input;

		if (action === "add") {
			// Get existing members to avoid duplicates
			const existing = yield* db
				.select({ userId: cohortMembers.userId })
				.from(cohortMembers)
				.where(eq(cohortMembers.cohortId, cohortId));

			const existingIds = new Set(existing.map((e) => e.userId));
			const newIds = userIds.filter((id) => !existingIds.has(id));

			if (newIds.length === 0) {
				return { successCount: 0, failedCount: 0 };
			}

			const values = newIds.map((userId) => ({
				id: crypto.randomUUID(),
				cohortId,
				userId,
				role: "member" as const,
			}));

			yield* db.insert(cohortMembers).values(values);

			return { successCount: newIds.length, failedCount: 0 };
		}

		if (action === "remove") {
			yield* db
				.delete(cohortMembers)
				.where(
					and(
						eq(cohortMembers.cohortId, cohortId),
						inArray(cohortMembers.userId, userIds),
					),
				);

			return { successCount: userIds.length, failedCount: 0 };
		}

		return { successCount: 0, failedCount: 0 };
	}),
);

export const triggerPasswordReset = Effect.fn("triggerPasswordReset")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const existingRows = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);

		if (existingRows.length === 0) {
			return yield* new UserNotFoundError({ userId });
		}

		const existing = existingRows[0];

		// Generate reset token
		const resetToken = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

		// Store in verification table
		yield* db.insert(verification).values({
			id: crypto.randomUUID(),
			identifier: existing.email,
			value: resetToken,
			expiresAt,
		});

		// Return reset URL (in production, this would be sent via email)
		return { resetToken, expiresAt };
	}),
);
