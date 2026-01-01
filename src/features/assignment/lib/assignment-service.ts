import { Data, Effect, Schema } from "effect";
import { desc, eq, sql } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth-authorization";
import { randomString } from "@/lib/utils";
import {
	assignments,
	assignmentTargets,
	goalMaps,
	kits,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";
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
});

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
	(userId: string, data: CreateAssignmentInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			yield* requireTeacher(userId);

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

			yield* requireTeacher(userId);

			const assignmentRows = yield* db
				.select({ createdBy: assignments.createdBy })
				.from(assignments)
				.where(eq(assignments.id, input.id))
				.limit(1);

			const assignment = assignmentRows[0];
			if (!assignment || assignment.createdBy !== userId) {
				return yield* Effect.fail(
					new AssignmentNotFoundError({ assignmentId: input.id }),
				);
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
