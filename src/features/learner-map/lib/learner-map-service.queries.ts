import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { PerLinkDiagnosisSchema } from "@/features/analyzer/lib/analytics-service.shared";
import { parseJson, roundToDecimals, safeParseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	diagnoses,
	formProgress,
	goalMaps,
	kits,
	learnerMaps,
	texts,
} from "@/server/db/schema/app-schema";
import { cohortMembers, user } from "@/server/db/schema/auth-schema";

import { EdgeSchema, NodeSchema } from "./comparator";
import {
	GetAssignmentForStudentInput,
	GetDiagnosisInput,
	GetPeerStatsInput,
	GoalMapNotFoundError,
	requireAssignmentMembership,
} from "./learner-map-service.shared";

export const listStudentAssignments = Effect.fn("listStudentAssignments")(function* (
	userId: string,
) {
	const db = yield* Database;

	const userCohorts = yield* db
		.select({ cohortId: cohortMembers.cohortId })
		.from(cohortMembers)
		.where(and(eq(cohortMembers.userId, userId), isNull(cohortMembers.deletedAt)));

	const cohortIds = userCohorts.map((c) => c.cohortId);

	const assignmentsData = yield* db
		.select({
			id: assignments.id,
			title: assignments.title,
			description: assignments.description,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
			dueAt: assignments.dueAt,
			preTestFormId: assignments.preTestFormId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			tamFormId: assignments.tamFormId,
			createdAt: assignments.createdAt,
			goalMapTitle: goalMaps.title,
			learnerMapStatus: learnerMaps.status,
			learnerMapAttempt: learnerMaps.attempt,
			learnerMapUpdatedAt: learnerMaps.updatedAt,
		})
		.from(assignments)
		.innerJoin(
			assignmentTargets,
			and(
				eq(assignmentTargets.assignmentId, assignments.id),
				isNull(assignmentTargets.deletedAt),
				or(
					eq(assignmentTargets.userId, userId),
					cohortIds.length > 0
						? inArray(assignmentTargets.cohortId, cohortIds)
						: eq(assignmentTargets.userId, ""),
				),
			),
		)
		.leftJoin(goalMaps, and(eq(assignments.goalMapId, goalMaps.id), isNull(goalMaps.deletedAt)))
		.leftJoin(
			learnerMaps,
			and(
				eq(learnerMaps.assignmentId, assignments.id),
				eq(learnerMaps.userId, userId),
				isNull(learnerMaps.deletedAt),
			),
		)
		.where(and(isNull(assignments.deletedAt)))
		.orderBy(desc(assignments.createdAt));

	const formIds = assignmentsData.flatMap((a) =>
		[a.preTestFormId, a.postTestFormId].filter((id): id is string => id !== null),
	);

	const progressRows: Array<typeof formProgress.$inferSelect> =
		formIds.length > 0
			? yield* db
					.select()
					.from(formProgress)
					.where(
						and(
							inArray(formProgress.formId, formIds),
							eq(formProgress.userId, userId),
							isNull(formProgress.deletedAt),
						),
					)
			: [];

	const progressByFormId = new Map(progressRows.map((p) => [p.formId, p]));

	const uniqueAssignments = new Map(
		assignmentsData.map((row) => [
			row.id,
			{
				id: row.id,
				title: row.title,
				description: row.description,
				goalMapId: row.goalMapId,
				kitId: row.kitId,
				preTestFormId: row.preTestFormId,
				postTestFormId: row.postTestFormId,
				delayedPostTestFormId: row.delayedPostTestFormId,
				tamFormId: row.tamFormId,
				goalMapTitle: row.goalMapTitle,
				dueAt: row.dueAt?.getTime(),
				createdAt: row.createdAt?.getTime(),
				status: row.learnerMapStatus || "not_started",
				attempt: row.learnerMapAttempt || 0,
				isLate:
					row.dueAt &&
					row.dueAt.getTime() < Date.now() &&
					row.learnerMapStatus !== "submitted",
				lastUpdated: row.learnerMapUpdatedAt?.getTime(),
				preTestCompleted:
					!row.preTestFormId ||
					progressByFormId.get(row.preTestFormId)?.status === "completed",
				postTestCompleted:
					!row.postTestFormId ||
					progressByFormId.get(row.postTestFormId)?.status === "completed",
			},
		]),
	);

	return Array.from(uniqueAssignments.values());
});

export const getAssignmentForStudent = Effect.fn("getAssignmentForStudent")(function* (
	userId: string,
	input: GetAssignmentForStudentInput,
) {
	const db = yield* Database;

	const userRows = yield* db
		.select({ studyGroup: user.studyGroup })
		.from(user)
		.where(and(eq(user.id, userId), isNull(user.deletedAt)))
		.limit(1);
	const studyGroup = userRows[0]?.studyGroup ?? null;

	yield* requireAssignmentMembership(userId, input.assignmentId);

	const results = yield* db
		.select({
			assignment: {
				id: assignments.id,
				title: assignments.title,
				description: assignments.description,
				readingMaterial: assignments.readingMaterial,
				timeLimitMinutes: assignments.timeLimitMinutes,
				goalMapId: assignments.goalMapId,
				kitId: assignments.kitId,
				dueAt: assignments.dueAt,
				preTestFormId: assignments.preTestFormId,
				postTestFormId: assignments.postTestFormId,
				delayedPostTestFormId: assignments.delayedPostTestFormId,
				delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
				tamFormId: assignments.tamFormId,
			},
			kit: {
				id: kits.id,
				nodes: kits.nodes,
				edges: kits.edges,
				textId: kits.textId,
			},
			goalMap: {
				textId: goalMaps.textId,
			},
			learnerMap: {
				id: learnerMaps.id,
				nodes: learnerMaps.nodes,
				edges: learnerMaps.edges,
				status: learnerMaps.status,
				attempt: learnerMaps.attempt,
				controlText: learnerMaps.controlText,
			},
		})
		.from(assignments)
		.leftJoin(kits, and(eq(kits.id, assignments.kitId), isNull(kits.deletedAt)))
		.leftJoin(goalMaps, and(eq(goalMaps.id, assignments.goalMapId), isNull(goalMaps.deletedAt)))
		.leftJoin(
			learnerMaps,
			and(
				eq(learnerMaps.assignmentId, assignments.id),
				eq(learnerMaps.userId, userId),
				isNull(learnerMaps.deletedAt),
			),
		)
		.where(and(eq(assignments.id, input.assignmentId), isNull(assignments.deletedAt)))
		.limit(1);

	const result = results[0];
	if (!result || !result.kit) return null;

	const textId = result.kit.textId || result.goalMap?.textId;
	const [kitNodes, kitEdges, learnerMapNodes, learnerMapEdges, materialText] = yield* Effect.all(
		[
			safeParseJson(result.kit.nodes, [], Schema.Array(NodeSchema)),
			safeParseJson(result.kit.edges, [], Schema.Array(EdgeSchema)),
			result.learnerMap
				? safeParseJson(result.learnerMap.nodes, [], Schema.Array(NodeSchema))
				: Effect.succeed([]),
			result.learnerMap
				? safeParseJson(result.learnerMap.edges, [], Schema.Array(EdgeSchema))
				: Effect.succeed([]),
			textId
				? Effect.promise(() =>
						db
							.select({ content: texts.content })
							.from(texts)
							.where(and(eq(texts.id, textId), isNull(texts.deletedAt)))
							.limit(1)
							.then((rows) => rows[0]?.content ?? null),
					)
				: Effect.succeed(null),
		],
		{ concurrency: 10 },
	);

	return {
		studyGroup,
		assignment: {
			...result.assignment,
			dueAt: result.assignment.dueAt?.getTime(),
		},
		kit: {
			id: result.kit.id,
			nodes: kitNodes,
			edges: kitEdges,
		},
		materialText: result.assignment.readingMaterial || materialText || null,
		learnerMap: result.learnerMap
			? {
					id: result.learnerMap.id,
					nodes: learnerMapNodes,
					edges: learnerMapEdges,
					status: result.learnerMap.status,
					attempt: result.learnerMap.attempt,
					controlText: result.learnerMap.controlText,
				}
			: null,
	};
});

export const getDiagnosis = Effect.fn("getDiagnosis")(function* (
	userId: string,
	input: GetDiagnosisInput,
) {
	const db = yield* Database;

	const results = yield* db
		.select({
			learnerMap: {
				id: learnerMaps.id,
				userId: learnerMaps.userId,
				nodes: learnerMaps.nodes,
				edges: learnerMaps.edges,
				status: learnerMaps.status,
				attempt: learnerMaps.attempt,
				submittedAt: learnerMaps.submittedAt,
				goalMapId: learnerMaps.goalMapId,
			},
			assignment: {
				goalMapId: assignments.goalMapId,
				title: assignments.title,
				postTestFormId: assignments.postTestFormId,
				tamFormId: assignments.tamFormId,
			},
			diagnosis: {
				id: diagnoses.id,
				summary: diagnoses.summary,
				score: diagnoses.score,
				perLink: diagnoses.perLink,
				createdAt: diagnoses.createdAt,
			},
		})
		.from(learnerMaps)
		.innerJoin(
			assignments,
			and(eq(assignments.id, learnerMaps.assignmentId), isNull(assignments.deletedAt)),
		)
		.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
		.where(
			and(
				eq(learnerMaps.assignmentId, input.assignmentId),
				eq(learnerMaps.userId, userId),
				isNull(learnerMaps.deletedAt),
			),
		)
		.orderBy(desc(diagnoses.createdAt))
		.limit(1);

	const result = results[0];
	if (!result) {
		return null;
	}

	const goalMapRows = yield* db
		.select({
			id: goalMaps.id,
			title: goalMaps.title,
			nodes: goalMaps.nodes,
			edges: goalMaps.edges,
			direction: goalMaps.direction,
		})
		.from(goalMaps)
		.where(and(eq(goalMaps.id, result.assignment.goalMapId), isNull(goalMaps.deletedAt)))
		.limit(1);

	const goalMap = goalMapRows[0];
	if (!goalMap) {
		return yield* new GoalMapNotFoundError({ goalMapId: result.assignment.goalMapId });
	}

	const diagnosisData = result.diagnosis?.perLink
		? yield* parseJson(result.diagnosis.perLink, PerLinkDiagnosisSchema)
		: null;

	const [learnerMapNodes, learnerMapEdges, goalMapNodes, goalMapEdges] = yield* Effect.all(
		[
			safeParseJson(result.learnerMap.nodes, [], Schema.Array(NodeSchema)),
			safeParseJson(result.learnerMap.edges, [], Schema.Array(EdgeSchema)),
			safeParseJson(goalMap.nodes, [], Schema.Array(NodeSchema)),
			safeParseJson(goalMap.edges, [], Schema.Array(EdgeSchema)),
		],
		{ concurrency: 10 },
	);

	return {
		learnerMap: {
			id: result.learnerMap.id,
			userId: result.learnerMap.userId,
			nodes: learnerMapNodes,
			edges: learnerMapEdges,
			status: result.learnerMap.status,
			attempt: result.learnerMap.attempt,
			submittedAt: result.learnerMap.submittedAt?.getTime() ?? null,
		},
		goalMap: {
			id: goalMap.id,
			title: goalMap.title,
			nodes: goalMapNodes,
			edges: goalMapEdges,
			direction: goalMap.direction,
		},
		assignment: {
			title: result.assignment.title,
			postTestFormId: result.assignment.postTestFormId,
			tamFormId: result.assignment.tamFormId,
		},
		diagnosis: result.diagnosis
			? {
					id: result.diagnosis.id,
					summary: result.diagnosis.summary,
					score: result.diagnosis.score,
					correct: diagnosisData?.correct ?? [],
					missing: diagnosisData?.missing ?? [],
					excessive: diagnosisData?.excessive ?? [],
				}
			: null,
	};
});

export const getPeerStats = Effect.fn("getPeerStats")(function* (
	userId: string,
	input: GetPeerStatsInput,
) {
	const db = yield* Database;

	const allSubmittedMaps = yield* db
		.select({
			id: learnerMaps.id,
			userId: learnerMaps.userId,
			score: diagnoses.score,
			attempt: learnerMaps.attempt,
		})
		.from(learnerMaps)
		.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
		.where(
			and(
				eq(learnerMaps.assignmentId, input.assignmentId),
				eq(learnerMaps.status, "submitted"),
				isNull(learnerMaps.deletedAt),
			),
		);

	const currentUserMaps = allSubmittedMaps.filter((m) => m.userId === userId);
	const peerMaps = allSubmittedMaps.filter((m) => m.userId !== userId);

	const peerScores = peerMaps
		.map((m) => m.score)
		.filter((s): s is number => s !== null && s !== undefined);

	if (peerScores.length === 0) {
		return {
			count: 0,
			avgScore: null,
			medianScore: null,
			highestScore: null,
			lowestScore: null,
			userPercentile: null,
		};
	}

	const sortedScores = peerScores.slice().sort((a, b) => a - b);
	const avgScore = sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length;
	const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
	const highestScore = sortedScores[sortedScores.length - 1];
	const lowestScore = sortedScores[0];

	const userBestScore = Math.max(...currentUserMaps.map((m) => m.score ?? 0));
	const userPercentile =
		(peerScores.filter((s) => s < userBestScore).length / peerScores.length) * 100;

	return {
		count: peerScores.length,
		avgScore: roundToDecimals(avgScore, 2),
		medianScore: roundToDecimals(medianScore, 2),
		highestScore: roundToDecimals(highestScore, 2),
		lowestScore: roundToDecimals(lowestScore, 2),
		userPercentile: roundToDecimals(userPercentile, 1),
	};
});
