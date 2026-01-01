import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Data, Effect, Layer, Schema } from "effect";
import { requireTeacher } from "@/lib/auth-authorization";
import { randomString } from "@/lib/utils";
import { authMiddleware } from "@/middlewares/auth";
import {
	assignments,
	assignmentTargets,
	goalMaps,
	kits,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";
import { Database, DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError, rpcErrorResponses } from "./handler";

class KitNotFoundError extends Data.TaggedError("KitNotFoundError")<{
	readonly goalMapId: string;
}> {}

class AssignmentNotFoundError extends Data.TaggedError(
	"AssignmentNotFoundError",
)<{
	readonly assignmentId: string;
}> {}

// Types
export const CreateAssignmentSchema = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	goalMapId: Schema.NonEmptyString,
	startDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	endDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	cohortIds: Schema.Array(Schema.NonEmptyString),
	userIds: Schema.Array(Schema.NonEmptyString),
});

// Teacher functions
export const createAssignment = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(CreateAssignmentSchema)(raw),
	)
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Verify user is a teacher
			yield* requireTeacher(context.user.id);

			// Check if kit exists for goal map
			const kitRows = yield* db
				.select()
				.from(kits)
				.where(eq(kits.goalMapId, data.goalMapId))
				.limit(1);

			const kit = kitRows[0];
			if (!kit) {
				return yield* Effect.fail(
					new KitNotFoundError({ goalMapId: data.goalMapId }),
				);
			}

			const assignmentId = randomString();

			// Create assignment
			yield* db.insert(assignments).values({
				id: assignmentId,
				goalMapId: data.goalMapId,
				kitId: kit.id,
				title: data.title,
				description: data.description,
				readingMaterial: null,
				timeLimitMinutes: null,
				startDate: data.startDate ? new Date(data.startDate) : new Date(),
				dueAt: data.endDate ? new Date(data.endDate) : null,
				createdBy: kit.teacherId,
			});

			// Create targets
			const targets: Array<{
				id: string;
				assignmentId: string;
				cohortId?: string;
				userId?: string;
			}> = [];

			// Add cohort targets
			for (const cohortId of data.cohortIds) {
				targets.push({
					id: randomString(),
					assignmentId,
					cohortId,
				});
			}

			// Add user targets
			for (const userId of data.userIds) {
				targets.push({
					id: randomString(),
					assignmentId,
					userId,
				});
			}

			if (targets.length > 0) {
				yield* db.insert(assignmentTargets).values(targets);
			}

			return { success: true, assignmentId } as const;
		}).pipe(
			Effect.tapError(logRpcError("createAssignment")),
			Effect.catchTags({
				KitNotFoundError: () =>
					Effect.succeed({
						success: false,
						error: "No kit found for this goal map",
					} as const),
				ForbiddenError: rpcErrorResponses.ForbiddenError,
				SqlError: rpcErrorResponses.SqlError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("createAssignment"),
			Effect.runPromise,
		),
	);

export const listTeacherAssignments = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					id: assignments.id,
					title: assignments.title,
					description: assignments.description,
					goalMapId: assignments.goalMapId,
					kitId: assignments.kitId,
					startDate: assignments.startDate,
					dueAt: assignments.dueAt,
					createdAt: assignments.createdAt,
					updatedAt: assignments.updatedAt,
					goalMapTitle: goalMaps.title,
					goalMapDescription: goalMaps.description,
				})
				.from(assignments)
				.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
				.where(eq(assignments.createdBy, context.user.id))
				.orderBy(desc(assignments.createdAt));

			return rows.map((row) => ({
				...row,
				startDate: row.startDate?.getTime(),
				dueAt: row.dueAt?.getTime(),
				createdAt: row.createdAt?.getTime(),
				updatedAt: row.updatedAt?.getTime(),
			}));
		}).pipe(
			Effect.tapError(logRpcError("listTeacherAssignments")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listTeacherAssignments"),
			Effect.runPromise,
		),
	);

export const deleteAssignment = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ id: Schema.NonEmptyString }))(raw),
	)
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Verify user is a teacher
			yield* requireTeacher(context.user.id);

			// Check ownership
			const assignmentRows = yield* db
				.select({ createdBy: assignments.createdBy })
				.from(assignments)
				.where(eq(assignments.id, data.id))
				.limit(1);

			const assignment = assignmentRows[0];
			if (!assignment || assignment.createdBy !== context.user.id) {
				return yield* Effect.fail(
					new AssignmentNotFoundError({ assignmentId: data.id }),
				);
			}

			// Delete assignment (cascade will delete targets)
			yield* db.delete(assignments).where(eq(assignments.id, data.id));

			return { success: true } as const;
		}).pipe(
			Effect.tapError(logRpcError("deleteAssignment")),
			Effect.catchTags({
				AssignmentNotFoundError: () =>
					Effect.succeed({
						success: false,
						error: "Assignment not found or access denied",
					} as const),
				ForbiddenError: rpcErrorResponses.ForbiddenError,
				SqlError: rpcErrorResponses.SqlError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("deleteAssignment"),
			Effect.runPromise,
		),
	);

// Helper functions for getting available options
export const getAvailableCohorts = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;

			const cohortRows = yield* db
				.select({
					id: cohorts.id,
					name: cohorts.name,
					description: cohorts.description,
					memberCount: db.$count(cohortMembers.id),
				})
				.from(cohorts)
				.leftJoin(cohortMembers, eq(cohortMembers.cohortId, cohorts.id))
				.groupBy(cohorts.id, cohorts.name, cohorts.description)
				.orderBy(cohorts.name);

			return cohortRows.map((row) => ({
				...row,
				memberCount: Number(row.memberCount ?? 0),
			}));
		}).pipe(
			Effect.tapError(logRpcError("getAvailableCohorts")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAvailableCohorts"),
			Effect.runPromise,
		),
	);

export const getAvailableUsers = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				})
				.from(user)
				.orderBy(user.name);

			return rows;
		}).pipe(
			Effect.tapError(logRpcError("getAvailableUsers")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAvailableUsers"),
			Effect.runPromise,
		),
	);

export const getTeacherGoalMaps = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					id: goalMaps.id,
					title: goalMaps.title,
					description: goalMaps.description,
					createdAt: goalMaps.createdAt,
					updatedAt: goalMaps.updatedAt,
				})
				.from(goalMaps)
				.orderBy(desc(goalMaps.updatedAt));

			return rows.map((row) => ({
				...row,
				createdAt: row.createdAt?.getTime(),
				updatedAt: row.updatedAt?.getTime(),
			}));
		}).pipe(
			Effect.tapError(logRpcError("getTeacherGoalMaps")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getTeacherGoalMaps"),
			Effect.runPromise,
		),
	);

export const AssignmentRpc = {
	assignments: () => ["assignments"],

	createAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "create"],
			mutationFn: (data: typeof CreateAssignmentSchema.Type) =>
				createAssignment({ data }),
		}),

	listTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "list"],
			queryFn: () => listTeacherAssignments(),
		}),

	deleteAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "delete"],
			mutationFn: (id: string) => deleteAssignment({ data: { id } }),
		}),

	getAvailableCohorts: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "cohorts"],
			queryFn: () => getAvailableCohorts(),
		}),

	getAvailableUsers: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "users"],
			queryFn: () => getAvailableUsers(),
		}),

	getTeacherGoalMaps: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "goalmaps"],
			queryFn: () => getTeacherGoalMaps(),
		}),
};
