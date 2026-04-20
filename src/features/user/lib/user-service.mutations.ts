import { and, count, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import { cohortMembers, user, verification } from "@/server/db/schema/auth-schema";

import { getUserById } from "./user-service.queries";
import {
	CannotModifySelfError,
	LastAdminError,
	UserNotFoundError,
	type BanUserInput,
	type BulkCohortAssignInput,
	type UpdateRoleInput,
	type UpdateUserInput,
} from "./user-service.shared";

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
			if (data.studyGroup !== undefined) updateData.studyGroup = data.studyGroup;

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
		const resetToken = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

		yield* db.insert(verification).values({
			id: crypto.randomUUID(),
			identifier: existing.email,
			value: resetToken,
			expiresAt,
		});

		return { resetToken, expiresAt };
	}),
);
