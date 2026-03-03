import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	formResponses,
	goalMaps,
	kits,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";

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
			condition: Schema.Union(Schema.Literal("summarizing"), Schema.Literal("concept_map")),
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

class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

export const createAssignment = Effect.fn("createAssignment")(function* (
	_userId: string,
	data: CreateAssignmentInput,
) {
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

	return true;
});

export const listTeacherAssignments = Effect.fn("listTeacherAssignments")(function* (
	userId: string,
) {
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

	if (rows.length === 0) {
		return [];
	}

	const assignmentIds = rows.map((row) => row.id);

	const targets = yield* db
		.select({
			assignmentId: assignmentTargets.assignmentId,
			cohortId: assignmentTargets.cohortId,
			userId: assignmentTargets.userId,
		})
		.from(assignmentTargets)
		.where(inArray(assignmentTargets.assignmentId, assignmentIds));

	const cohortIds = Array.from(
		new Set(
			targets
				.map((target) => target.cohortId)
				.filter((cohortId): cohortId is string => cohortId !== null),
		),
	);

	const directUserIds = Array.from(
		new Set(
			targets
				.map((target) => target.userId)
				.filter((targetUserId): targetUserId is string => targetUserId !== null),
		),
	);

	const cohortRows =
		cohortIds.length > 0
			? yield* db
					.select({ id: cohorts.id, name: cohorts.name })
					.from(cohorts)
					.where(inArray(cohorts.id, cohortIds))
			: [];

	const cohortMemberRows =
		cohortIds.length > 0
			? yield* db
					.select({ cohortId: cohortMembers.cohortId, userId: cohortMembers.userId })
					.from(cohortMembers)
					.where(inArray(cohortMembers.cohortId, cohortIds))
			: [];

	const directUsers =
		directUserIds.length > 0
			? yield* db
					.select({ id: user.id, name: user.name, email: user.email })
					.from(user)
					.where(inArray(user.id, directUserIds))
			: [];

	const submittedRows = yield* db
		.select({ assignmentId: learnerMaps.assignmentId, userId: learnerMaps.userId })
		.from(learnerMaps)
		.where(
			and(
				inArray(learnerMaps.assignmentId, assignmentIds),
				eq(learnerMaps.status, "submitted"),
				isNotNull(learnerMaps.submittedAt),
			),
		);

	const formIds = Array.from(
		new Set(
			rows
				.flatMap((row) => [
					row.preTestFormId,
					row.postTestFormId,
					row.delayedPostTestFormId,
					row.tamFormId,
				])
				.filter((formId): formId is string => formId !== null),
		),
	);

	const formResponsesRows =
		formIds.length > 0
			? yield* db
					.select({ formId: formResponses.formId, userId: formResponses.userId })
					.from(formResponses)
					.where(inArray(formResponses.formId, formIds))
			: [];

	const cohortById = new Map(cohortRows.map((cohort) => [cohort.id, cohort]));
	const directUserById = new Map(directUsers.map((directUser) => [directUser.id, directUser]));
	const membersByCohort = new Map<string, Set<string>>();
	for (const member of cohortMemberRows) {
		const existing = membersByCohort.get(member.cohortId);
		if (existing) {
			existing.add(member.userId);
			continue;
		}
		membersByCohort.set(member.cohortId, new Set([member.userId]));
	}

	const submittedByAssignment = new Map<string, Set<string>>();
	for (const submitted of submittedRows) {
		const existing = submittedByAssignment.get(submitted.assignmentId);
		if (existing) {
			existing.add(submitted.userId);
			continue;
		}
		submittedByAssignment.set(submitted.assignmentId, new Set([submitted.userId]));
	}

	const responsesByFormId = new Map<string, Set<string>>();
	for (const response of formResponsesRows) {
		const existing = responsesByFormId.get(response.formId);
		if (existing) {
			existing.add(response.userId);
			continue;
		}
		responsesByFormId.set(response.formId, new Set([response.userId]));
	}

	const targetsByAssignment = new Map<string, typeof targets>();
	for (const target of targets) {
		const existing = targetsByAssignment.get(target.assignmentId);
		if (existing) {
			existing.push(target);
			continue;
		}
		targetsByAssignment.set(target.assignmentId, [target]);
	}

	return rows.map((row) => {
		const assignmentTargetsForRow = targetsByAssignment.get(row.id) ?? [];
		const assignedUserIds = new Set<string>();
		const assignedCohorts: Array<{ id: string; name: string; memberCount: number }> = [];
		const assignedUsers: Array<{ id: string; name: string; email: string }> = [];

		for (const target of assignmentTargetsForRow) {
			if (target.userId) {
				assignedUserIds.add(target.userId);
				const directUser = directUserById.get(target.userId);
				if (
					directUser &&
					!assignedUsers.some((assignedUser) => assignedUser.id === directUser.id)
				) {
					assignedUsers.push(directUser);
				}
			}
			if (target.cohortId) {
				const members = membersByCohort.get(target.cohortId);
				if (members) {
					for (const memberId of members) {
						assignedUserIds.add(memberId);
					}
				}
				const cohort = cohortById.get(target.cohortId);
				if (
					cohort &&
					!assignedCohorts.some((assignedCohort) => assignedCohort.id === cohort.id)
				) {
					assignedCohorts.push({
						id: cohort.id,
						name: cohort.name,
						memberCount: members?.size ?? 0,
					});
				}
			}
		}

		const submittedUserIds = submittedByAssignment.get(row.id) ?? new Set<string>();
		const submittedStudents = Array.from(assignedUserIds).filter((assignedUserId) =>
			submittedUserIds.has(assignedUserId),
		).length;
		const totalStudents = assignedUserIds.size;
		const allSubmitted = totalStudents > 0 && submittedStudents >= totalStudents;

		const preTestSubmitted = row.preTestFormId
			? Array.from(assignedUserIds).filter((assignedUserId) =>
					(responsesByFormId.get(row.preTestFormId ?? "") ?? new Set<string>()).has(
						assignedUserId,
					),
				).length
			: null;
		const postTestSubmitted = row.postTestFormId
			? Array.from(assignedUserIds).filter((assignedUserId) =>
					(responsesByFormId.get(row.postTestFormId ?? "") ?? new Set<string>()).has(
						assignedUserId,
					),
				).length
			: null;
		const delayedPostTestSubmitted = row.delayedPostTestFormId
			? Array.from(assignedUserIds).filter((assignedUserId) =>
					(
						responsesByFormId.get(row.delayedPostTestFormId ?? "") ?? new Set<string>()
					).has(assignedUserId),
				).length
			: null;
		const tamSubmitted = row.tamFormId
			? Array.from(assignedUserIds).filter((assignedUserId) =>
					(responsesByFormId.get(row.tamFormId ?? "") ?? new Set<string>()).has(
						assignedUserId,
					),
				).length
			: null;

		return {
			...row,
			startDate: row.startDate?.getTime(),
			dueAt: row.dueAt?.getTime(),
			createdAt: row.createdAt?.getTime(),
			updatedAt: row.updatedAt?.getTime(),
			assignedCohorts,
			assignedUsers,
			totalStudents,
			submittedStudents,
			allSubmitted,
			preTestSubmitted,
			postTestSubmitted,
			delayedPostTestSubmitted,
			tamSubmitted,
		};
	});
});

export const deleteAssignment = Effect.fn("deleteAssignment")(function* (
	userId: string,
	input: DeleteAssignmentInput,
) {
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

	return true;
});

export const getAvailableCohorts = Effect.fn("getAvailableCohorts")(function* () {
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
});

export const getAvailableUsers = Effect.fn("getAvailableUsers")(function* () {
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
});

export const getTeacherGoalMaps = Effect.fn("getTeacherGoalMaps")(function* () {
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
});

export const saveExperimentGroups = Effect.fn("saveExperimentGroups")(function* (
	input: SaveExperimentGroupsInput,
) {
	const db = yield* Database;

	// Update studyGroup for each user
	for (const g of input.groups) {
		yield* db
			.update(user)
			.set({ studyGroup: g.condition === "concept_map" ? "experiment" : "control" })
			.where(eq(user.id, g.userId));
	}

	return true;
});

export const getExperimentGroupsByAssignmentId = Effect.fn("getExperimentGroupsByAssignmentId")(
	function* (assignmentId: string) {
		const db = yield* Database;

		// This previously fetched from experimentGroups table.
		// Now we fetch from user table via assignmentTargets.
		const rows = yield* db
			.select({
				id: user.id,
				assignmentId: sql<string>`${assignmentId}`,
				userId: user.id,
				groupName: sql<string>`null`,
				condition: sql<string>`case when ${user.studyGroup} = 'experiment' then 'concept_map' else 'summarizing' end`,
			})
			.from(user)
			.innerJoin(assignmentTargets, eq(assignmentTargets.userId, user.id))
			.where(eq(assignmentTargets.assignmentId, assignmentId));

		return rows;
	},
);

export const getAssignmentByPreTestFormId = Effect.fn("getAssignmentByPreTestFormId")(function* (
	formId: string,
) {
	const db = yield* Database;

	const rows = yield* db
		.select()
		.from(assignments)
		.where(eq(assignments.preTestFormId, formId))
		.limit(1);

	return rows[0] ?? null;
});

export const getExperimentCondition = Effect.fn("getExperimentCondition")(function* (
	assignmentId: string,
	userId: string,
) {
	const db = yield* Database;

	const rows = yield* db
		.select({
			id: user.id,
			assignmentId: sql<string>`${assignmentId}`,
			userId: user.id,
			condition: sql<string>`case when ${user.studyGroup} = 'experiment' then 'concept_map' else 'summarizing' end`,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	return rows[0] ?? null;
});
