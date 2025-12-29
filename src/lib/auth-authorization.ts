import { and, eq } from "drizzle-orm";
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
			return yield* Effect.fail(new GoalMapNotFoundError({ goalMapId }));
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
			return yield* Effect.fail(new GoalMapNotFoundError({ goalMapId }));
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

		for (const assignment of assignments_) {
			if (assignment.targetUserId === userId) {
				return true;
			}

			if (assignment.cohortId) {
				const cohortId = assignment.cohortId;
				const cohortMember = yield* Effect.tryPromise(() =>
					db
						.select()
						.from(cohortMembers)
						.where(
							and(
								eq(cohortMembers.cohortId, cohortId),
								eq(cohortMembers.userId, userId),
							),
						)
						.get(),
				);

				if (cohortMember) {
					return true;
				}
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
			return yield* Effect.fail(new AssignmentNotFoundError({ assignmentId }));
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

		for (const target of targets) {
			if (target.userId === userId) {
				return true;
			}

			if (target.cohortId) {
				const cohortId = target.cohortId;
				const cohortMember = yield* Effect.tryPromise(() =>
					db
						.select()
						.from(cohortMembers)
						.where(
							and(
								eq(cohortMembers.cohortId, cohortId),
								eq(cohortMembers.userId, userId),
							),
						)
						.get(),
				);

				if (cohortMember) {
					return true;
				}
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
			return yield* Effect.fail(
				new ForbiddenError({
					message: "You must be the owner of this goal map",
				}),
			);
		}

		return userId;
	});

export const requireGoalMapAccess = (userId: string, goalMapId: string) =>
	Effect.gen(function* () {
		const hasAccess = yield* canAccessGoalMap(userId, goalMapId);

		if (!hasAccess) {
			return yield* Effect.fail(
				new ForbiddenError({
					message: "You do not have access to this goal map",
				}),
			);
		}

		return userId;
	});

export const requireRole = (role: string) => (userId: string) =>
	Effect.gen(function* () {
		const hasRole = yield* isRole(userId, role);

		if (!hasRole) {
			return yield* Effect.fail(
				new ForbiddenError({
					message: `You must be a ${role} to perform this action`,
				}),
			);
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
				return yield* Effect.fail(
					new ForbiddenError({
						message: `You must be one of: ${roles.join(", ")}`,
					}),
				);
			}

			return userId;
		});

export const requireTeacher = requireAnyRole("teacher", "admin");
export const requireAdmin = requireRole("admin");

class LearnerMapNotFoundError extends Data.TaggedError(
	"LearnerMapNotFoundError",
)<{
	readonly learnerMapId: string;
}> {}

class KitNotFoundError extends Data.TaggedError("KitNotFoundError")<{
	readonly kitId: string;
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly field: string;
	readonly message: string;
}> {}

class BusinessLogicError extends Data.TaggedError("BusinessLogicError")<{
	readonly reason: string;
}> {}

/**
 * Create standardized error response
 */
export const errorResponse = (message: string) => ({
	success: false,
	error: message,
} as const);

/**
 * Create standardized success response
 */
export const successResponse = <T extends Record<string, unknown>>(data: T) => ({
	success: true,
	...data,
} as const);
