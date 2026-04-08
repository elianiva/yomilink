import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { isCorrectMcqAnswer } from "@/features/form/lib/form-scoring";
import { randomString, safeParseJson } from "@/lib/utils";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentExperimentGroups,
	assignmentTargets,
	formResponses,
	forms,
	goalMaps,
	kits,
	learnerMaps,
	questions,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";

export const CreateAssignmentInput = Schema.Struct({
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	goalMapId: NonEmpty("Goal map ID"),
	startDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	endDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	cohortIds: Schema.Array(NonEmpty("Cohort ID")),
	userIds: Schema.Array(NonEmpty("User ID")),
	preTestFormId: Schema.String,
	postTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestDelayDays: Schema.optionalWith(Schema.Number, {
		nullable: true,
	}),
	tamFormId: Schema.optionalWith(Schema.String, { nullable: true }),
});

export const SaveExperimentGroupsInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
	groups: Schema.Array(
		Schema.Struct({
			userId: NonEmpty("User ID"),
			condition: Schema.Union(Schema.Literal("summarizing"), Schema.Literal("concept_map")),
		}),
	),
});

export type SaveExperimentGroupsInput = typeof SaveExperimentGroupsInput.Type;

export type CreateAssignmentInput = typeof CreateAssignmentInput.Type;

export const DeleteAssignmentInput = Schema.Struct({
	id: NonEmpty("Assignment ID"),
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

	yield* db
		.delete(assignmentExperimentGroups)
		.where(eq(assignmentExperimentGroups.assignmentId, input.assignmentId));

	const uniqueGroups = new Map(input.groups.map((group) => [group.userId, group]));
	const values = Array.from(uniqueGroups.values()).map((group) => ({
		id: randomString(),
		assignmentId: input.assignmentId,
		userId: group.userId,
		condition: group.condition,
	}));

	if (values.length > 0) {
		yield* db.insert(assignmentExperimentGroups).values(values);
	}

	return true;
});

export const getExperimentGroupsByAssignmentId = Effect.fn("getExperimentGroupsByAssignmentId")(
	function* (assignmentId: string) {
		const db = yield* Database;

		const rows = yield* db
			.select({
				id: assignmentExperimentGroups.id,
				assignmentId: assignmentExperimentGroups.assignmentId,
				userId: assignmentExperimentGroups.userId,
				condition: assignmentExperimentGroups.condition,
			})
			.from(assignmentExperimentGroups)
			.where(eq(assignmentExperimentGroups.assignmentId, assignmentId));

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

export const getAssignmentById = Effect.fn("getAssignmentById")(function* (assignmentId: string) {
	const db = yield* Database;

	const rows = yield* db
		.select({
			id: assignments.id,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
			title: assignments.title,
			description: assignments.description,
			readingMaterial: assignments.readingMaterial,
			timeLimitMinutes: assignments.timeLimitMinutes,
			startDate: assignments.startDate,
			dueAt: assignments.dueAt,
			preTestFormId: assignments.preTestFormId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			tamFormId: assignments.tamFormId,
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
			createdBy: assignments.createdBy,
			createdAt: assignments.createdAt,
			updatedAt: assignments.updatedAt,
			goalMapTitle: goalMaps.title,
		})
		.from(assignments)
		.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
		.where(eq(assignments.id, assignmentId))
		.limit(1);

	if (rows.length === 0) {
		return yield* new AssignmentNotFoundError({ assignmentId });
	}

	const assignment = rows[0];

	// Fetch form details for all attached forms
	const formIds = [
		assignment.preTestFormId,
		assignment.postTestFormId,
		assignment.delayedPostTestFormId,
		assignment.tamFormId,
	].filter((id): id is string => id !== null);

	const formDetails =
		formIds.length > 0
			? yield* db
					.select({
						id: forms.id,
						title: forms.title,
						description: forms.description,
						type: forms.type,
						status: forms.status,
					})
					.from(forms)
					.where(inArray(forms.id, formIds))
			: [];

	const formMap = new Map(formDetails.map((f) => [f.id, f]));

	return {
		...assignment,
		preTestForm: assignment.preTestFormId
			? (formMap.get(assignment.preTestFormId) ?? null)
			: null,
		postTestForm: assignment.postTestFormId
			? (formMap.get(assignment.postTestFormId) ?? null)
			: null,
		delayedPostTestForm: assignment.delayedPostTestFormId
			? (formMap.get(assignment.delayedPostTestFormId) ?? null)
			: null,
		tamForm: assignment.tamFormId ? (formMap.get(assignment.tamFormId) ?? null) : null,
	};
});

export const getExperimentCondition = Effect.fn("getExperimentCondition")(function* (
	assignmentId: string,
	userId: string,
) {
	const db = yield* Database;

	const rows = yield* db
		.select({
			id: assignmentExperimentGroups.id,
			assignmentId: assignmentExperimentGroups.assignmentId,
			userId: assignmentExperimentGroups.userId,
			condition: assignmentExperimentGroups.condition,
		})
		.from(assignmentExperimentGroups)
		.where(
			and(
				eq(assignmentExperimentGroups.assignmentId, assignmentId),
				eq(assignmentExperimentGroups.userId, userId),
			),
		)
		.limit(1);

	return rows[0] ?? null;
});

// ============================================================================
// Experiment Flow Status - Track student progress through all phases
// ============================================================================

export const GetExperimentStatusInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetExperimentStatusInput = typeof GetExperimentStatusInput.Type;

export type StudentExperimentStatus = {
	userId: string;
	userName: string;
	userEmail: string;
	preTest: {
		completed: boolean;
		score: number | null;
		completedAt: number | null;
	};
	groupAssigned: boolean;
	groupCondition: "summarizing" | "concept_map" | null;
	mainAssignment: {
		status: "not_started" | "draft" | "submitted" | "graded";
		submittedAt: number | null;
	};
	postTest: {
		completed: boolean;
		completedAt: number | null;
	};
	tamSurvey: {
		completed: boolean;
		completedAt: number | null;
	};
	delayedTest: {
		completed: boolean;
		unlocksAt: number | null;
		completedAt: number | null;
	};
};

export const getAssignmentExperimentStatus = Effect.fn("getAssignmentExperimentStatus")(function* (
	input: GetExperimentStatusInput,
) {
	const db = yield* Database;

	// Get assignment details
	const assignmentRows = yield* db
		.select()
		.from(assignments)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.assignmentId });
	}

	// Get all assigned users
	const targets = yield* db
		.select({
			userId: assignmentTargets.userId,
			cohortId: assignmentTargets.cohortId,
		})
		.from(assignmentTargets)
		.where(eq(assignmentTargets.assignmentId, input.assignmentId));

	const directUserIds = targets.map((t) => t.userId).filter((id): id is string => id !== null);
	const cohortIds = targets.map((t) => t.cohortId).filter((id): id is string => id !== null);

	// Get cohort members
	const cohortMemberRows =
		cohortIds.length > 0
			? yield* db
					.select({ userId: cohortMembers.userId, cohortId: cohortMembers.cohortId })
					.from(cohortMembers)
					.where(inArray(cohortMembers.cohortId, cohortIds))
			: [];

	const cohortUserIds = cohortMemberRows.map((m) => m.userId);
	const allUserIds = Array.from(new Set([...directUserIds, ...cohortUserIds]));

	if (allUserIds.length === 0) {
		return {
			assignment: {
				id: assignment.id,
				title: assignment.title,
				preTestFormId: assignment.preTestFormId,
				postTestFormId: assignment.postTestFormId,
				delayedPostTestFormId: assignment.delayedPostTestFormId,
				tamFormId: assignment.tamFormId,
				delayedPostTestDelayDays: assignment.delayedPostTestDelayDays,
			},
			students: [] as StudentExperimentStatus[],
			summary: {
				totalStudents: 0,
				preTestCompleted: 0,
				groupsAssigned: 0,
				mainAssignmentCompleted: 0,
				postTestCompleted: 0,
				tamCompleted: 0,
				delayedTestCompleted: 0,
			},
		};
	}

	const users = yield* db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
		})
		.from(user)
		.where(inArray(user.id, allUserIds));

	const userMap = new Map(users.map((u) => [u.id, u]));

	const experimentGroupRows = yield* db
		.select({
			userId: assignmentExperimentGroups.userId,
			condition: assignmentExperimentGroups.condition,
		})
		.from(assignmentExperimentGroups)
		.where(
			and(
				eq(assignmentExperimentGroups.assignmentId, input.assignmentId),
				inArray(assignmentExperimentGroups.userId, allUserIds),
			),
		);

	const experimentGroupMap = new Map(
		experimentGroupRows.map((row) => [row.userId, row.condition]),
	);

	const scoreFormResponses = function* (
		formId: string | null,
		rows: Array<{
			userId: string;
			submittedAt: Date | null;
			answers?: unknown;
		}>,
	) {
		if (!formId) {
			return new Map<string, { completedAt: number | null; score: number | null }>();
		}

		const questionRows = yield* db
			.select({
				id: questions.id,
				options: questions.options,
			})
			.from(questions)
			.where(eq(questions.formId, formId))
			.orderBy(questions.orderIndex);

		const scoreableQuestions = yield* Effect.all(
			questionRows.map((question) =>
				Effect.gen(function* () {
					const parsedOptions = yield* safeParseJson(question.options, null, Schema.Any);
					if (
						parsedOptions &&
						typeof parsedOptions === "object" &&
						"type" in parsedOptions &&
						parsedOptions.type === "mcq" &&
						"correctOptionIds" in parsedOptions &&
						Array.isArray(parsedOptions.correctOptionIds)
					) {
						return {
							id: question.id,
							options: {
								type: "mcq" as const,
								correctOptionIds: parsedOptions.correctOptionIds.map(
									(id: unknown) => String(id),
								),
							},
						};
					}

					return {
						id: question.id,
						options: null,
					};
				}),
			),
			{ concurrency: "unbounded" },
		);

		return new Map(
			rows.map((row) => {
				let correctCount = 0;
				let scoredQuestionCount = 0;
				const answers = row.answers as Record<string, unknown> | undefined;

				for (const question of scoreableQuestions) {
					const result = isCorrectMcqAnswer(question.options, answers?.[question.id]);
					if (result !== null) {
						scoredQuestionCount += 1;
						if (result) {
							correctCount += 1;
						}
					}
				}

				return [
					row.userId,
					{
						completedAt: row.submittedAt?.getTime() ?? null,
						score: scoredQuestionCount > 0 ? correctCount / scoredQuestionCount : null,
					},
				] as const;
			}),
		);
	};

	const preTestResponses = assignment.preTestFormId
		? yield* db
				.select({
					userId: formResponses.userId,
					submittedAt: formResponses.submittedAt,
					answers: formResponses.answers,
				})
				.from(formResponses)
				.where(
					and(
						eq(formResponses.formId, assignment.preTestFormId),
						inArray(formResponses.userId, allUserIds),
					),
				)
		: [];

	const preTestMap = yield* scoreFormResponses(assignment.preTestFormId, preTestResponses);

	const postTestResponses = assignment.postTestFormId
		? yield* db
				.select({
					userId: formResponses.userId,
					submittedAt: formResponses.submittedAt,
				})
				.from(formResponses)
				.where(
					and(
						eq(formResponses.formId, assignment.postTestFormId),
						inArray(formResponses.userId, allUserIds),
					),
				)
		: [];

	const postTestMap = new Map(
		postTestResponses.map((r) => [r.userId, { completedAt: r.submittedAt?.getTime() ?? null }]),
	);

	// Get TAM responses
	const tamResponses = assignment.tamFormId
		? yield* db
				.select({
					userId: formResponses.userId,
					submittedAt: formResponses.submittedAt,
				})
				.from(formResponses)
				.where(
					and(
						eq(formResponses.formId, assignment.tamFormId),
						inArray(formResponses.userId, allUserIds),
					),
				)
		: [];

	const tamMap = new Map(
		tamResponses.map((r) => [r.userId, { completedAt: r.submittedAt?.getTime() ?? null }]),
	);

	// Get delayed test responses
	const delayedTestResponses = assignment.delayedPostTestFormId
		? yield* db
				.select({
					userId: formResponses.userId,
					submittedAt: formResponses.submittedAt,
				})
				.from(formResponses)
				.where(
					and(
						eq(formResponses.formId, assignment.delayedPostTestFormId),
						inArray(formResponses.userId, allUserIds),
					),
				)
		: [];

	const delayedTestMap = new Map(
		delayedTestResponses.map((r) => [
			r.userId,
			{ completedAt: r.submittedAt?.getTime() ?? null },
		]),
	);

	// Get learner maps (main assignment status)
	const learnerMapRows = yield* db
		.select({
			userId: learnerMaps.userId,
			status: learnerMaps.status,
			submittedAt: learnerMaps.submittedAt,
		})
		.from(learnerMaps)
		.where(
			and(
				eq(learnerMaps.assignmentId, input.assignmentId),
				inArray(learnerMaps.userId, allUserIds),
			),
		);

	const learnerMapMap = new Map(
		learnerMapRows.map((r) => [
			r.userId,
			{
				status: r.status,
				submittedAt: r.submittedAt?.getTime() ?? null,
			},
		]),
	);

	const students: StudentExperimentStatus[] = allUserIds.map((userId) => {
		const userInfo = userMap.get(userId);
		const preTest = preTestMap.get(userId);
		const postTest = postTestMap.get(userId);
		const tam = tamMap.get(userId);
		const delayedTest = delayedTestMap.get(userId);
		const learnerMap = learnerMapMap.get(userId);

		const groupCondition = experimentGroupMap.get(userId) ?? null;

		let delayedTestUnlocksAt: number | null = null;
		if (assignment.delayedPostTestDelayDays && learnerMap?.submittedAt) {
			const unlockDate = new Date(learnerMap.submittedAt);
			unlockDate.setDate(unlockDate.getDate() + assignment.delayedPostTestDelayDays);
			delayedTestUnlocksAt = unlockDate.getTime();
		}

		return {
			userId,
			userName: userInfo?.name ?? "Unknown",
			userEmail: userInfo?.email ?? "",
			preTest: {
				completed: !!preTest,
				score: preTest?.score ?? null,
				completedAt: preTest?.completedAt ?? null,
			},
			groupAssigned: !!groupCondition,
			groupCondition,
			mainAssignment: {
				status: learnerMap?.status ?? "not_started",
				submittedAt: learnerMap?.submittedAt ?? null,
			},
			postTest: {
				completed: !!postTest,
				completedAt: postTest?.completedAt ?? null,
			},
			tamSurvey: {
				completed: !!tam,
				completedAt: tam?.completedAt ?? null,
			},
			delayedTest: {
				completed: !!delayedTest,
				unlocksAt: delayedTestUnlocksAt,
				completedAt: delayedTest?.completedAt ?? null,
			},
		};
	});

	const summary = {
		totalStudents: students.length,
		preTestCompleted: students.filter((s) => s.preTest.completed).length,
		groupsAssigned: students.filter((s) => s.groupAssigned).length,
		mainAssignmentCompleted: students.filter((s) => s.mainAssignment.status === "submitted")
			.length,
		postTestCompleted: students.filter((s) => s.postTest.completed).length,
		tamCompleted: students.filter((s) => s.tamSurvey.completed).length,
		delayedTestCompleted: students.filter((s) => s.delayedTest.completed).length,
	};

	return {
		assignment: {
			id: assignment.id,
			title: assignment.title,
			preTestFormId: assignment.preTestFormId,
			postTestFormId: assignment.postTestFormId,
			delayedPostTestFormId: assignment.delayedPostTestFormId,
			tamFormId: assignment.tamFormId,
			delayedPostTestDelayDays: assignment.delayedPostTestDelayDays,
		},
		students,
		summary,
	};
});
