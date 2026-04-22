import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
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
