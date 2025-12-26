import { createServerFn } from "@tanstack/react-start";
import { desc, eq, count } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import {
	assignments,
	assignmentTargets,
	kits,
	goalMaps,
} from "@/server/db/schema/app-schema";
import { cohorts, user, cohortMembers } from "@/server/db/schema/auth-schema";
import { Database } from "../db/client";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { randomString } from "@/lib/utils";

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
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Check if kit exists for goal map
			const kit = yield* Effect.tryPromise(() =>
				db.select().from(kits).where(eq(kits.goalMapId, data.goalMapId)).get(),
			);

			if (!kit) {
				return {
					success: false,
					error: "No kit found for this goal map",
				} as const;
			}

			const assignmentId = randomString();

			// Create assignment
			yield* Effect.tryPromise(() =>
				db
					.insert(assignments)
					.values({
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
					})
					.run(),
			);

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
				yield* Effect.tryPromise(() =>
					db.insert(assignmentTargets).values(targets).run(),
				);
			}

			return { success: true, assignmentId } as const;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("createAssignment"),
			Effect.runPromise,
		),
	);

export const listTeacherAssignments = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
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
					.orderBy(desc(assignments.createdAt))
					.all(),
			);

			return rows.map((row) => ({
				...row,
				startDate: row.startDate?.getTime(),
				dueAt: row.dueAt?.getTime(),
				createdAt: row.createdAt?.getTime(),
				updatedAt: row.updatedAt?.getTime(),
			}));
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("listTeacherAssignments"),
			Effect.runPromise,
		),
	);

export const deleteAssignment = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ id: Schema.NonEmptyString }))(raw),
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Delete assignment (cascade will delete targets)
			yield* Effect.tryPromise(() =>
				db.delete(assignments).where(eq(assignments.id, data.id)).run(),
			);

			return { success: true } as const;
		}).pipe(
			Effect.provide(Database.Default),
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

			// Get cohorts
			const cohortRows = yield* Effect.tryPromise(() =>
				db
					.select({
						id: cohorts.id,
						name: cohorts.name,
						description: cohorts.description,
					})
					.from(cohorts)
					.orderBy(cohorts.name)
					.all(),
			);

			// Get member counts
			const memberCounts = yield* Effect.tryPromise(() =>
				db
					.select({
						cohortId: cohortMembers.cohortId,
						count: count(cohortMembers.id),
					})
					.from(cohortMembers)
					.groupBy(cohortMembers.cohortId)
					.all(),
			);

			const countMap = new Map(
				memberCounts.map((mc) => [mc.cohortId, Number(mc.count)]),
			);

			return cohortRows.map((row) => ({
				...row,
				memberCount: countMap.get(row.id) || 0,
			}));
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("getAvailableCohorts"),
			Effect.runPromise,
		),
	);

export const getAvailableUsers = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						id: user.id,
						name: user.name,
						email: user.email,
						role: user.role,
					})
					.from(user)
					.orderBy(user.name)
					.all(),
			);

			return rows;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("getAvailableUsers"),
			Effect.runPromise,
		),
	);

export const getTeacherGoalMaps = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						id: goalMaps.id,
						title: goalMaps.title,
						description: goalMaps.description,
						createdAt: goalMaps.createdAt,
						updatedAt: goalMaps.updatedAt,
					})
					.from(goalMaps)
					.orderBy(desc(goalMaps.updatedAt))
					.all(),
			);

			return rows.map((row) => ({
				...row,
				createdAt: row.createdAt?.getTime(),
				updatedAt: row.updatedAt?.getTime(),
			}));
		}).pipe(
			Effect.provide(Database.Default),
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
