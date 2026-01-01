import { and, eq, inArray } from "drizzle-orm";
import { Data, Effect } from "effect";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	goalMaps,
} from "@/server/db/schema/app-schema";
import { cohortMembers, user } from "@/server/db/schema/auth-schema";

class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	readonly message: string;
}> {}

class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

class AssignmentNotFoundError extends Data.TaggedError(
	"AssignmentNotFoundError",
)<{
	readonly assignmentId: string;
}> {}

export const isGoalMapOwner = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const goalMap = yield* Effect.tryPromise(() =>
			db
				.select({ teacherId: goalMaps.teacherId })
				.from(goalMaps)
				.where(eq(goalMaps.id, goalMapId))
				.get(),
		);

		if (!goalMap) {
			return yield* new GoalMapNotFoundError({ goalMapId });
		}

		return goalMap.teacherId === userId;
	});

export const canAccessGoalMap = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const goalMap = yield* Effect.tryPromise(() =>
			db
				.select({ teacherId: goalMaps.teacherId })
				.from(goalMaps)
				.where(eq(goalMaps.id, goalMapId))
				.get(),
		);

		if (!goalMap) {
			return yield* new GoalMapNotFoundError({ goalMapId });
		}

		if (goalMap.teacherId === userId) {
			return true;
		}

		const assignments_ = yield* Effect.tryPromise(() =>
			db
				.select({
					assignmentId: assignments.id,
					cohortId: assignmentTargets.cohortId,
					targetUserId: assignmentTargets.userId,
				})
				.from(assignments)
				.leftJoin(
					assignmentTargets,
					eq(assignments.id, assignmentTargets.assignmentId),
				)
				.where(eq(assignments.goalMapId, goalMapId))
				.all(),
		);

		const hasDirectAccess = assignments_.some((a) => a.targetUserId === userId);
		if (hasDirectAccess) return true;

		const cohortIds = assignments_
			.map((a) => a.cohortId)
			.filter((id): id is string => id !== undefined);

		if (cohortIds.length > 0) {
			const memberRecords = yield* Effect.tryPromise(() =>
				db
					.select({ cohortId: cohortMembers.cohortId })
					.from(cohortMembers)
					.where(
						and(
							eq(cohortMembers.userId, userId),
							inArray(cohortMembers.cohortId, cohortIds),
						),
					)
					.all(),
			);

			const userCohortIds = new Set(memberRecords.map((cm) => cm.cohortId));
			if (cohortIds.some((id) => userCohortIds.has(id))) {
				return true;
			}
		}

		return false;
	});

export const canAccessAssignment = (userId: string, assignmentId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const assignment = yield* Effect.tryPromise(() =>
			db
				.select({
					id: assignments.id,
					createdBy: assignments.createdBy,
				})
				.from(assignments)
				.where(eq(assignments.id, assignmentId))
				.get(),
		);

		if (!assignment) {
			return yield* new AssignmentNotFoundError({ assignmentId });
		}

		if (assignment.createdBy === userId) {
			return true;
		}

		const targets = yield* Effect.tryPromise(() =>
			db
				.select({
					userId: assignmentTargets.userId,
					cohortId: assignmentTargets.cohortId,
				})
				.from(assignmentTargets)
				.where(eq(assignmentTargets.assignmentId, assignmentId))
				.all(),
		);

		const hasDirectAccess = targets.some((t) => t.userId === userId);
		if (hasDirectAccess) return true;

		const cohortIds = targets
			.map((t) => t.cohortId)
			.filter((id): id is string => id !== undefined);

		if (cohortIds.length > 0) {
			const memberRecords = yield* Effect.tryPromise(() =>
				db
					.select({ cohortId: cohortMembers.cohortId })
					.from(cohortMembers)
					.where(
						and(
							eq(cohortMembers.userId, userId),
							inArray(cohortMembers.cohortId, cohortIds),
						),
					)
					.all(),
			);

			const userCohortIds = new Set(memberRecords.map((cm) => cm.cohortId));
			if (cohortIds.some((id) => userCohortIds.has(id))) {
				return true;
			}
		}

		return false;
	});

export const isRole = (userId: string, role: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const userRecord = yield* Effect.tryPromise(() =>
			db
				.select({ role: user.role })
				.from(user)
				.where(eq(user.id, userId))
				.get(),
		);

		return userRecord?.role === role;
	});

export const requireGoalMapOwner = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const isOwner = yield* isGoalMapOwner(userId, goalMapId);

		if (!isOwner) {
			return yield* new ForbiddenError({
				message: "You must be the owner of this goal map",
			});
		}

		return userId;
	});

export const requireGoalMapAccess = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const hasAccess = yield* canAccessGoalMap(userId, goalMapId);

		if (!hasAccess) {
			return yield* new ForbiddenError({
				message: "You do not have access to this goal map",
			});
		}

		return userId;
	});

export const requireRole = (role: string) => (userId: string) =>
	Effect.gen(function* () {
		const hasRole = yield* isRole(userId, role);

		if (!hasRole) {
			return yield* new ForbiddenError({
				message: `You must be a ${role} to perform this action`,
			});
		}

		return userId;
	});
export const requireAnyRole =
	(...roles: string[]) =>
	(userId: string) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const userRecord = yield* Effect.tryPromise(() =>
				db
					.select({ role: user.role })
					.from(user)
					.where(eq(user.id, userId))
					.get(),
			);

			if (!userRecord || !userRecord.role || !roles.includes(userRecord.role)) {
				return yield* new ForbiddenError({
					message: `You must be one of: ${roles.join(", ")}`,
				});
			}

			return userId;
		});
