import { and, desc, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	formResponses,
	forms,
	goalMaps,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";

import { AssignmentNotFoundError } from "./assignment-service.shared";

export const listTeacherAssignments = Effect.fn("listTeacherAssignments")(function* () {
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
			createdAt: assignments.createdAt,
			updatedAt: assignments.updatedAt,
			goalMapTitle: goalMaps.title,
			goalMapDescription: goalMaps.description,
		})
		.from(assignments)
		.leftJoin(goalMaps, and(eq(assignments.goalMapId, goalMaps.id), isNull(goalMaps.deletedAt)))
		.where(isNull(assignments.deletedAt))
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
		.where(
			and(
				inArray(assignmentTargets.assignmentId, assignmentIds),
				isNull(assignmentTargets.deletedAt),
			),
		);

	const cohortIds = Array.from(
		new Set(
			targets.reduce<string[]>((acc, target) => {
				if (target.cohortId !== null) acc.push(target.cohortId);
				return acc;
			}, []),
		),
	);

	const directUserIds = Array.from(
		new Set(
			targets.reduce<string[]>((acc, target) => {
				if (target.userId !== null) acc.push(target.userId);
				return acc;
			}, []),
		),
	);

	const cohortRows =
		cohortIds.length > 0
			? yield* db
					.select({ id: cohorts.id, name: cohorts.name })
					.from(cohorts)
					.where(and(inArray(cohorts.id, cohortIds), isNull(cohorts.deletedAt)))
			: [];

	const cohortMemberRows =
		cohortIds.length > 0
			? yield* db
					.select({ cohortId: cohortMembers.cohortId, userId: cohortMembers.userId })
					.from(cohortMembers)
					.where(
						and(
							inArray(cohortMembers.cohortId, cohortIds),
							isNull(cohortMembers.deletedAt),
						),
					)
			: [];

	const directUsers =
		directUserIds.length > 0
			? yield* db
					.select({ id: user.id, name: user.name, email: user.email })
					.from(user)
					.where(and(inArray(user.id, directUserIds), isNull(user.deletedAt)))
			: [];

	const submittedRows = yield* db
		.select({ assignmentId: learnerMaps.assignmentId, userId: learnerMaps.userId })
		.from(learnerMaps)
		.where(
			and(
				inArray(learnerMaps.assignmentId, assignmentIds),
				eq(learnerMaps.status, "submitted"),
				isNotNull(learnerMaps.submittedAt),
				isNull(learnerMaps.deletedAt),
			),
		);

	const formIds = Array.from(
		new Set(
			rows.reduce<string[]>((acc, row) => {
				const ids = [row.preTestFormId, row.postTestFormId, row.delayedPostTestFormId];
				for (const id of ids) {
					if (id !== null) acc.push(id);
				}
				return acc;
			}, []),
		),
	);

	const formResponsesRows =
		formIds.length > 0
			? yield* db
					.select({ formId: formResponses.formId, userId: formResponses.userId })
					.from(formResponses)
					.where(
						and(
							inArray(formResponses.formId, formIds),
							isNull(formResponses.deletedAt),
						),
					)
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
		};
	});
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
		.leftJoin(
			cohortMembers,
			and(eq(cohortMembers.cohortId, cohorts.id), isNull(cohortMembers.deletedAt)),
		)
		.where(isNull(cohorts.deletedAt))
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
		.where(isNull(user.deletedAt))
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
		.where(isNull(goalMaps.deletedAt))
		.orderBy(desc(goalMaps.updatedAt));

	return rows.map((row) => ({
		...row,
		createdAt: row.createdAt?.getTime(),
		updatedAt: row.updatedAt?.getTime(),
	}));
});

export const getAssignmentByPreTestFormId = Effect.fn("getAssignmentByPreTestFormId")(function* (
	formId: string,
) {
	const db = yield* Database;

	const rows = yield* db
		.select()
		.from(assignments)
		.where(and(eq(assignments.preTestFormId, formId), isNull(assignments.deletedAt)))
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
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
			createdBy: assignments.createdBy,
			createdAt: assignments.createdAt,
			updatedAt: assignments.updatedAt,
			goalMapTitle: goalMaps.title,
		})
		.from(assignments)
		.leftJoin(goalMaps, and(eq(assignments.goalMapId, goalMaps.id), isNull(goalMaps.deletedAt)))
		.where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
		.limit(1);

	if (rows.length === 0) {
		return yield* new AssignmentNotFoundError({ assignmentId });
	}

	const assignment = rows[0];

	const formIds = [
		assignment.preTestFormId,
		assignment.postTestFormId,
		assignment.delayedPostTestFormId,
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
					.where(and(inArray(forms.id, formIds), isNull(forms.deletedAt)))
			: [];

	const formMap = new Map(formDetails.map((f) => [f.id, f]));

	const targets = yield* db
		.select({
			cohortId: assignmentTargets.cohortId,
			userId: assignmentTargets.userId,
		})
		.from(assignmentTargets)
		.where(
			and(
				eq(assignmentTargets.assignmentId, assignmentId),
				isNull(assignmentTargets.deletedAt),
			),
		);

	const targetCohortIds = targets
		.map((t) => t.cohortId)
		.filter((id): id is string => id !== null);
	const targetUserIds = targets.map((t) => t.userId).filter((id): id is string => id !== null);

	const cohortRows =
		targetCohortIds.length > 0
			? yield* db
					.select({ id: cohorts.id, name: cohorts.name })
					.from(cohorts)
					.where(and(inArray(cohorts.id, targetCohortIds), isNull(cohorts.deletedAt)))
			: [];

	const cohortMemberRows =
		targetCohortIds.length > 0
			? yield* db
					.select({ cohortId: cohortMembers.cohortId, userId: cohortMembers.userId })
					.from(cohortMembers)
					.where(
						and(
							inArray(cohortMembers.cohortId, targetCohortIds),
							isNull(cohortMembers.deletedAt),
						),
					)
			: [];

	const directUserRows =
		targetUserIds.length > 0
			? yield* db
					.select({ id: user.id, name: user.name, email: user.email })
					.from(user)
					.where(and(inArray(user.id, targetUserIds), isNull(user.deletedAt)))
			: [];

	const assignedUserIds = new Set<string>();
	const membersByCohort = new Map<string, Set<string>>();
	for (const member of cohortMemberRows) {
		const existing = membersByCohort.get(member.cohortId);
		if (existing) {
			existing.add(member.userId);
		} else {
			membersByCohort.set(member.cohortId, new Set([member.userId]));
		}
	}

	const assignedCohorts: Array<{ id: string; name: string; memberCount: number }> = [];
	for (const target of targets) {
		if (target.cohortId) {
			const members = membersByCohort.get(target.cohortId);
			if (members) {
				for (const memberId of members) {
					assignedUserIds.add(memberId);
				}
			}
			const cohort = cohortRows.find((c) => c.id === target.cohortId);
			if (cohort && !assignedCohorts.some((ac) => ac.id === cohort.id)) {
				assignedCohorts.push({
					id: cohort.id,
					name: cohort.name,
					memberCount: members?.size ?? 0,
				});
			}
		}
		if (target.userId) {
			assignedUserIds.add(target.userId);
		}
	}

	const assignedUsers = directUserRows;

	const learnerMapRows = yield* db
		.select({
			userId: learnerMaps.userId,
			status: learnerMaps.status,
			submittedAt: learnerMaps.submittedAt,
		})
		.from(learnerMaps)
		.where(and(eq(learnerMaps.assignmentId, assignmentId), isNull(learnerMaps.deletedAt)));

	const submittedUserIds = new Set(
		learnerMapRows
			.filter((lm) => lm.status === "submitted" && lm.submittedAt !== null)
			.map((lm) => lm.userId),
	);
	const totalStudents = assignedUserIds.size;
	const submittedStudents = Array.from(assignedUserIds).filter((id) =>
		submittedUserIds.has(id),
	).length;

	const formResponseRows =
		formIds.length > 0
			? yield* db
					.select({ formId: formResponses.formId, userId: formResponses.userId })
					.from(formResponses)
					.where(
						and(
							inArray(formResponses.formId, formIds),
							isNull(formResponses.deletedAt),
						),
					)
			: [];

	const responsesByFormId = new Map<string, Set<string>>();
	for (const response of formResponseRows) {
		const existing = responsesByFormId.get(response.formId);
		if (existing) {
			existing.add(response.userId);
		} else {
			responsesByFormId.set(response.formId, new Set([response.userId]));
		}
	}

	const countFormResponses = (formId: string | null) =>
		formId
			? Array.from(assignedUserIds).filter((uid) =>
					(responsesByFormId.get(formId) ?? new Set<string>()).has(uid),
				).length
			: null;

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
		totalStudents,
		submittedStudents,
		assignedCohorts,
		assignedUsers,
		learnerMaps: learnerMapRows.map((lm) => ({
			userId: lm.userId,
			status: lm.status,
			submittedAt: lm.submittedAt?.getTime() ?? null,
		})),
		preTestSubmitted: countFormResponses(assignment.preTestFormId),
		postTestSubmitted: countFormResponses(assignment.postTestFormId),
		delayedPostTestSubmitted: countFormResponses(assignment.delayedPostTestFormId),
	};
});
