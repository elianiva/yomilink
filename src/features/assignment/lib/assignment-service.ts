import { Data, Effect, Schema } from "effect";
import { desc, eq, sql } from "drizzle-orm";
import { randomString } from "@/lib/utils";
import {
	assignments,
	assignmentTargets,
	goalMaps,
	kits,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";
import { experimentGroups } from "@/server/db/schema/app-schema";
import { Database } from "@/server/db/client";

export const CreateAssignmentInput = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, {
		nullable: true,
	}),
	goalMapId: Schema.NonEmptyString,
	startDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	endDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	cohortIds: Schema.Array(Schema.NonEmptyString),
	userIds: Schema.Array(Schema.NonEmptyString),
	preTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	postTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestDelayDays: Schema.optionalWith(Schema.Number, {
		nullable: true,
	}),
	tamFormId: Schema.optionalWith(Schema.String, { nullable: true }),
});


export const SaveExperimentGroupsInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
	groups: Schema.Array(
		Schema.Struct({
			userId: Schema.NonEmptyString,
			groupName: Schema.optionalWith(Schema.String, { nullable: true }),
			condition: Schema.Union(
				Schema.Literal("summarizing"),
				Schema.Literal("concept_map"),
			),
		}),
	),
});

export type SaveExperimentGroupsInput = typeof SaveExperimentGroupsInput.Type;

export type CreateAssignmentInput = typeof CreateAssignmentInput.Type;

export const DeleteAssignmentInput = Schema.Struct({
	id: Schema.NonEmptyString,
});

export type DeleteAssignmentInput = typeof DeleteAssignmentInput.Type;

class KitNotFoundError extends Data.TaggedError("KitNotFoundError")<{
	readonly goalMapId: string;
}> {}

class AssignmentNotFoundError extends Data.TaggedError(
	"AssignmentNotFoundError",
)<{
	readonly assignmentId: string;
}> {}

export const createAssignment = Effect.fn("createAssignment")(
	(_userId: string, data: CreateAssignmentInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const kitRows = yield* db
				.select()
				.from(kits)
				.where(eq(kits.goalMapId, data.goalMapId))
				.limit(1);

			const kit = kitRows[0];
			if (!kit) {
				return yield* new KitNotFoundError({ goalMapId: data.goalMapId });
			}

			const assignmentId = randomString();

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
				preTestFormId: data.preTestFormId,
				postTestFormId: data.postTestFormId,
				delayedPostTestFormId: data.delayedPostTestFormId,
				delayedPostTestDelayDays: data.delayedPostTestDelayDays,
				tamFormId: data.tamFormId,
				createdBy: kit.teacherId,
			});

			const targets: Array<{
				id: string;
				assignmentId: string;
				cohortId?: string;
				userId?: string;
			}> = [];

			for (const cohortId of data.cohortIds) {
				targets.push({
					id: randomString(),
					assignmentId,
					cohortId,
				});
			}

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
		}),
);

export const listTeacherAssignments = Effect.fn("listTeacherAssignments")(
	(userId: string) =>
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
					preTestFormId: assignments.preTestFormId,
					postTestFormId: assignments.postTestFormId,
					delayedPostTestFormId: assignments.delayedPostTestFormId,
					delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
					tamFormId: assignments.tamFormId,
					createdAt: assignments.createdAt,
					updatedAt: assignments.updatedAt,
					goalMapTitle: goalMaps.title,
					goalMapDescription: goalMaps.description,
				})
				.from(assignments)
				.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
				.where(eq(assignments.createdBy, userId))
				.orderBy(desc(assignments.createdAt));

			return rows.map((row) => ({
				...row,
				startDate: row.startDate?.getTime(),
				dueAt: row.dueAt?.getTime(),
				createdAt: row.createdAt?.getTime(),
				updatedAt: row.updatedAt?.getTime(),
			}));
		}),
);

export const deleteAssignment = Effect.fn("deleteAssignment")(
	(userId: string, input: DeleteAssignmentInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const assignmentRows = yield* db
				.select({ createdBy: assignments.createdBy })
				.from(assignments)
				.where(eq(assignments.id, input.id))
				.limit(1);

			const assignment = assignmentRows[0];
			if (!assignment || assignment.createdBy !== userId) {
				return yield* new AssignmentNotFoundError({ assignmentId: input.id });
			}

			yield* db.delete(assignments).where(eq(assignments.id, input.id));

			return { success: true } as const;
		}),
);

export const getAvailableCohorts = Effect.fn("getAvailableCohorts")(() =>
	Effect.gen(function* () {
		const db = yield* Database;

		const cohortRows = yield* db
			.select({
				id: cohorts.id,
				name: cohorts.name,
				description: cohorts.description,
				memberCount: sql<number>`COUNT(${cohortMembers.id})`,
			})
			.from(cohorts)
			.leftJoin(cohortMembers, eq(cohortMembers.cohortId, cohorts.id))
			.groupBy(cohorts.id, cohorts.name, cohorts.description)
			.orderBy(cohorts.name);

		return cohortRows.map((row) => ({
			...row,
			memberCount: Number(row.memberCount ?? 0),
		}));
	}),
);

export const getAvailableUsers = Effect.fn("getAvailableUsers")(() =>
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
	}),
);

export const getTeacherGoalMaps = Effect.fn("getTeacherGoalMaps")(() =>
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
	}),
);


export const saveExperimentGroups = Effect.fn("saveExperimentGroups")(
	(input: SaveExperimentGroupsInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Delete existing groups for this assignment
			yield* db
				.delete(experimentGroups)
				.where(eq(experimentGroups.assignmentId, input.assignmentId));

			// Insert new groups
			if (input.groups.length > 0) {
				const values = input.groups.map((g) => ({
					id: randomString(),
					assignmentId: input.assignmentId,
					userId: g.userId,
					groupName: g.groupName ?? null,
					condition: g.condition,
				}));

				yield* db.insert(experimentGroups).values(values);
			}

			return { success: true };
		}),
);

export const getExperimentGroupsByAssignmentId = Effect.fn(
	"getExperimentGroupsByAssignmentId",
)((assignmentId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const rows = yield* db
			.select()
			.from(experimentGroups)
			.where(eq(experimentGroups.assignmentId, assignmentId));

		return rows;
	}),
);

export const getAssignmentByPreTestFormId = Effect.fn(
	"getAssignmentByPreTestFormId",
)((formId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const rows = yield* db
			.select()
			.from(assignments)
			.where(eq(assignments.preTestFormId, formId))
			.limit(1);

		return rows[0] ?? null;
	}),
);


export const getExperimentCondition = Effect.fn("getExperimentCondition")(
	(assignmentId: string, userId: string) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const rows = yield* db
				.select()
				.from(experimentGroups)
				.where(
					and(
						eq(experimentGroups.assignmentId, assignmentId),
						eq(experimentGroups.userId, userId),
					),
				)
				.limit(1);

			return rows[0] ?? null;
		}),
);
