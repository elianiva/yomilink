import { and, eq, inArray } from "drizzle-orm";
import { Data, Effect } from "effect";

import { GoalMapNotFoundError } from "@/lib/errors";
import { Database } from "@/server/db/client";
import { assignments, assignmentTargets, goalMaps } from "@/server/db/schema/app-schema";
import { cohortMembers, user } from "@/server/db/schema/auth-schema";

class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	readonly message: string;
}> {}

class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

export const isGoalMapOwner = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const rows = yield* db
			.select({ teacherId: goalMaps.teacherId })
			.from(goalMaps)
			.where(eq(goalMaps.id, goalMapId))
			.limit(1);
		const goalMap = rows[0];
		if (!goalMap) {
			return yield* new GoalMapNotFoundError({ goalMapId });
		}
		return goalMap.teacherId === userId;
	});

export const canAccessGoalMap = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const goalMapRows = yield* db
			.select({ teacherId: goalMaps.teacherId })
			.from(goalMaps)
			.where(eq(goalMaps.id, goalMapId))
			.limit(1);
		const goalMap = goalMapRows[0];
		if (!goalMap) {
			return yield* new GoalMapNotFoundError({ goalMapId });
		}
		if (goalMap.teacherId === userId) return true;

		const assignments_ = yield* db
			.select({
				assignmentId: assignments.id,
				cohortId: assignmentTargets.cohortId,
				targetUserId: assignmentTargets.userId,
			})
			.from(assignments)
			.leftJoin(assignmentTargets, eq(assignments.id, assignmentTargets.assignmentId))
			.where(eq(assignments.goalMapId, goalMapId));

		const hasDirectAccess = assignments_.some((a) => a.targetUserId === userId);
		if (hasDirectAccess) return true;

		const cohortIds: string[] = [];
		for (const a of assignments_) {
			if (a.cohortId != null) cohortIds.push(a.cohortId);
		}

		if (cohortIds.length > 0) {
			const memberRecords = yield* db
				.select({ cohortId: cohortMembers.cohortId })
				.from(cohortMembers)
				.where(
					and(
						eq(cohortMembers.userId, userId),
						inArray(cohortMembers.cohortId, cohortIds),
					),
				);

			const userCohortIds = new Set(memberRecords.map((cm) => cm.cohortId));
			if (cohortIds.some((id) => userCohortIds.has(id))) return true;
		}

		return false;
	});

export const canAccessAssignment = (userId: string, assignmentId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const assignmentRows = yield* db
			.select({ id: assignments.id, createdBy: assignments.createdBy })
			.from(assignments)
			.where(eq(assignments.id, assignmentId))
			.limit(1);
		const assignment = assignmentRows[0];
		if (!assignment) {
			return yield* new AssignmentNotFoundError({ assignmentId });
		}
		if (assignment.createdBy === userId) return true;

		const targets = yield* db
			.select({
				userId: assignmentTargets.userId,
				cohortId: assignmentTargets.cohortId,
			})
			.from(assignmentTargets)
			.where(eq(assignmentTargets.assignmentId, assignmentId));

		const hasDirectAccess = targets.some((t) => t.userId === userId);
		if (hasDirectAccess) return true;

		const cohortIds: string[] = [];
		for (const t of targets) {
			if (t.cohortId != null) cohortIds.push(t.cohortId);
		}

		if (cohortIds.length > 0) {
			const memberRecords = yield* db
				.select({ cohortId: cohortMembers.cohortId })
				.from(cohortMembers)
				.where(
					and(
						eq(cohortMembers.userId, userId),
						inArray(cohortMembers.cohortId, cohortIds),
					),
				);

			const userCohortIds = new Set(memberRecords.map((cm) => cm.cohortId));
			if (cohortIds.some((id) => userCohortIds.has(id))) return true;
		}

		return false;
	});

export const isRole = (userId: string, role: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const rows = yield* db
			.select({ role: user.role })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		return rows[0]?.role === role;
	});

export const requireGoalMapOwner = Effect.fn("requireGoalMapOwner")(
	(userId: string, goalMapId: string) =>
		Effect.gen(function* () {
			const isOwner = yield* isGoalMapOwner(userId, goalMapId);
			if (!isOwner) {
				return yield* new ForbiddenError({
					message: "You must be the owner of this goal map",
				});
			}
			return userId;
		}),
);

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

export const requireAnyRole = Effect.fn(function* (userId: string, roles: string[]) {
	const db = yield* Database;
	const rows = yield* db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	const userRecord = rows[0];
	if (!userRecord || !userRecord.role || !roles.includes(userRecord.role)) {
		return yield* new ForbiddenError({
			message: `You must be one of: ${roles.join(", ")}`,
		});
	}
	return userId;
});
