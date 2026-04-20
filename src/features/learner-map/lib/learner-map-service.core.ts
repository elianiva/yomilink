import { and, desc, eq, inArray, or } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { PerLinkDiagnosisSchema } from "@/features/analyzer/lib/analytics-service.core";
import { unlockPostTestAfterAssignment } from "@/features/form/lib/unlock-service.progress";
import { parseJson, randomString, roundToDecimals, safeParseJson } from "@/lib/utils";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
	texts,
} from "@/server/db/schema/app-schema";
import { cohortMembers, user } from "@/server/db/schema/auth-schema";

import { compareMaps, EdgeSchema, NodeSchema } from "./comparator";

export class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

export class LearnerMapNotFoundError extends Data.TaggedError("LearnerMapNotFoundError")<{
	readonly assignmentId: string;
	readonly userId: string;
}> {}

export class LearnerMapAlreadySubmittedError extends Data.TaggedError(
	"LearnerMapAlreadySubmittedError",
)<{
	readonly learnerMapId: string;
}> {}

export class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export class AccessDeniedError extends Data.TaggedError("AccessDeniedError")<{
	readonly assignmentId: string;
}> {}

export class NoPreviousAttemptError extends Data.TaggedError("NoPreviousAttemptError")<{
	readonly assignmentId: string;
}> {}

export class PreviousAttemptNotSubmittedError extends Data.TaggedError(
	"PreviousAttemptNotSubmittedError",
)<{
	readonly learnerMapId: string;
}> {}

export const GetAssignmentForStudentInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetAssignmentForStudentInput = typeof GetAssignmentForStudentInput.Type;

export const SaveLearnerMapInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
	nodes: Schema.optionalWith(Schema.String, { nullable: true }),
	edges: Schema.optionalWith(Schema.String, { nullable: true }),
	controlText: Schema.optionalWith(Schema.String, { nullable: true }),
});

export type SaveLearnerMapInput = typeof SaveLearnerMapInput.Type;

export const SubmitLearnerMapInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type SubmitLearnerMapInput = typeof SubmitLearnerMapInput.Type;

export const GetDiagnosisInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetDiagnosisInput = typeof GetDiagnosisInput.Type;

export const StartNewAttemptInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type StartNewAttemptInput = typeof StartNewAttemptInput.Type;

export const GetPeerStatsInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetPeerStatsInput = typeof GetPeerStatsInput.Type;

export const SubmitControlTextInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
	text: NonEmpty("Text"),
});

export type SubmitControlTextInput = typeof SubmitControlTextInput.Type;

type ExperimentCondition = "summarizing" | "concept_map";

function mapStudyGroupToCondition(studyGroup: "experiment" | "control" | null): ExperimentCondition {
	return studyGroup === "experiment" ? "concept_map" : "summarizing";
}

const getAssignmentMembership = Effect.fn("getAssignmentMembership")(function* (
	userId: string,
	assignmentId: string,
) {
	const db = yield* Database;

	const userCohorts = yield* db
		.select({ cohortId: cohortMembers.cohortId })
		.from(cohortMembers)
		.where(eq(cohortMembers.userId, userId));

	const cohortIds = userCohorts.map((c) => c.cohortId);

	const membershipRows = yield* db
		.select({ id: assignments.id })
		.from(assignments)
		.leftJoin(assignmentTargets, eq(assignmentTargets.assignmentId, assignments.id))
		.where(
			and(
				eq(assignments.id, assignmentId),
				or(
					eq(assignmentTargets.userId, userId),
					cohortIds.length > 0
						? inArray(assignmentTargets.cohortId, cohortIds)
						: eq(assignmentTargets.userId, ""),
				),
			),
		)
		.limit(1);

	const userRows = yield* db.select({ studyGroup: user.studyGroup }).from(user).where(eq(user.id, userId)).limit(1);

	return {
		hasAccess: membershipRows.length > 0,
		condition: mapStudyGroupToCondition(userRows[0]?.studyGroup ?? null),
	};
});

const requireAssignmentMembership = Effect.fn("requireAssignmentMembership")(function* (
	userId: string,
	assignmentId: string,
) {
	const membership = yield* getAssignmentMembership(userId, assignmentId);
	if (!membership.hasAccess) {
		return yield* new AccessDeniedError({ assignmentId });
	}

	return membership;
});

const requireAssignmentCondition = Effect.fn("requireAssignmentCondition")(function* (
	userId: string,
	assignmentId: string,
	expectedCondition: ExperimentCondition,
) {
	const membership = yield* requireAssignmentMembership(userId, assignmentId);
	if (membership.condition !== expectedCondition) {
		return yield* new AccessDeniedError({ assignmentId });
	}

	return membership;
});

export const listStudentAssignments = Effect.fn("listStudentAssignments")(function* (
	userId: string,
) {
	const db = yield* Database;

	const userCohorts = yield* db
		.select({ cohortId: cohortMembers.cohortId })
		.from(cohortMembers)
		.where(eq(cohortMembers.userId, userId));

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
		.leftJoin(assignmentTargets, eq(assignmentTargets.assignmentId, assignments.id))
		.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
		.leftJoin(
			learnerMaps,
			and(eq(learnerMaps.assignmentId, assignments.id), eq(learnerMaps.userId, userId)),
		)
		.where(
			or(
				eq(assignmentTargets.userId, userId),
				cohortIds.length > 0
					? inArray(assignmentTargets.cohortId, cohortIds)
					: eq(assignmentTargets.userId, ""),
			),
		)
		.orderBy(desc(assignments.createdAt));

	const uniqueAssignments = new Map(
		assignmentsData.map((row) => [
			row.id,
			{
				...row,
				dueAt: row.dueAt?.getTime(),
				createdAt: row.createdAt?.getTime(),
				status: row.learnerMapStatus || "not_started",
				attempt: row.learnerMapAttempt || 0,
				isLate:
					row.dueAt &&
					row.dueAt.getTime() < Date.now() &&
					row.learnerMapStatus !== "submitted",
				lastUpdated: row.learnerMapUpdatedAt?.getTime(),
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

	yield* requireAssignmentMembership(userId, input.assignmentId);

	// Fetch assignment with kit and goal map
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
		.leftJoin(kits, eq(kits.id, assignments.kitId))
		.leftJoin(goalMaps, eq(goalMaps.id, assignments.goalMapId))
		.leftJoin(
			learnerMaps,
			and(eq(learnerMaps.assignmentId, assignments.id), eq(learnerMaps.userId, userId)),
		)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const result = results[0];
	if (!result || !result.kit) return null;

	// Fetch reading material from kit or goal map
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
							.where(eq(texts.id, textId))
							.limit(1)
							.then((rows) => rows[0]?.content ?? null),
					)
				: Effect.succeed(null),
		],
		{ concurrency: "unbounded" },
	);

	return {
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

export const saveLearnerMap = Effect.fn("saveLearnerMap")(function* (
	userId: string,
	data: {
		assignmentId: string;
		nodes?: string | null;
		edges?: string | null;
		controlText?: string | null;
	},
) {
	const db = yield* Database;

	const assignmentRows = yield* db
		.select({
			id: assignments.id,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
		})
		.from(assignments)
		.where(eq(assignments.id, data.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: data.assignmentId });
	}

	yield* requireAssignmentMembership(userId, data.assignmentId);

	const existingRows = yield* db
		.select({ id: learnerMaps.id, status: learnerMaps.status })
		.from(learnerMaps)
		.where(and(eq(learnerMaps.assignmentId, data.assignmentId), eq(learnerMaps.userId, userId)))
		.limit(1);

	const existing = existingRows[0];
	if (existing) {
		if (existing.status === "submitted") {
			return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: existing.id });
		}

		yield* db
			.update(learnerMaps)
			.set({
				...(data.nodes !== undefined && { nodes: data.nodes }),
				...(data.edges !== undefined && { edges: data.edges }),
				...(data.controlText !== undefined && {
					controlText: data.controlText,
				}),
			})
			.where(eq(learnerMaps.id, existing.id));

		return true;
	}

	const learnerMapId = randomString();
	yield* db.insert(learnerMaps).values({
		id: learnerMapId,
		assignmentId: data.assignmentId,
		goalMapId: assignment.goalMapId,
		kitId: assignment.kitId,
		userId,
		nodes: data.nodes ?? null,
		edges: data.edges ?? null,
		controlText: data.controlText ?? null,
		status: "draft",
		attempt: 1,
	});

	return true;
});

export const submitLearnerMap = Effect.fn("submitLearnerMap")(function* (
	userId: string,
	input: SubmitLearnerMapInput,
) {
	const db = yield* Database;

	yield* requireAssignmentCondition(userId, input.assignmentId, "concept_map");

	const learnerMapRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const learnerMap = learnerMapRows[0];
	if (!learnerMap) {
		return yield* new LearnerMapNotFoundError({ assignmentId: input.assignmentId, userId });
	}

	if (learnerMap.status === "submitted") {
		return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: learnerMap.id });
	}

	// Fetch assignment to get the correct goalMapId and form unlock configuration
	const assignmentRows = yield* db
		.select({
			goalMapId: assignments.goalMapId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
		})
		.from(assignments)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.assignmentId });
	}

	// Use assignment's goalMapId for comparison (not learnerMap.goalMapId which may be null for kits)
	const goalMapRows = yield* db
		.select({ edges: goalMaps.edges })
		.from(goalMaps)
		.where(eq(goalMaps.id, assignment.goalMapId))
		.limit(1);

	const goalMap = goalMapRows[0];
	if (!goalMap) {
		return yield* new GoalMapNotFoundError({ goalMapId: assignment.goalMapId });
	}

	const goalMapEdges = Array.isArray(goalMap.edges) ? goalMap.edges : [];
	const learnerEdges = Array.isArray(learnerMap.edges) ? learnerMap.edges : [];

	const diagnosis = compareMaps(goalMapEdges, learnerEdges);

	yield* db
		.update(learnerMaps)
		.set({
			status: "submitted",
			submittedAt: new Date(),
		})
		.where(eq(learnerMaps.id, learnerMap.id));

	const diagnosisId = randomString();
	yield* db.insert(diagnoses).values({
		id: diagnosisId,
		goalMapId: learnerMap.goalMapId,
		learnerMapId: learnerMap.id,
		summary: `Correct: ${diagnosis.correct.length}, Missing: ${diagnosis.missing.length}, Excessive: ${diagnosis.excessive.length}`,
		perLink: JSON.stringify(diagnosis),
		score: diagnosis.score,
		rubricVersion: "1.0",
	});

	// Unlock post-test immediately if configured
	if (assignment.postTestFormId) {
		yield* unlockPostTestAfterAssignment({
			assignmentId: input.assignmentId,
			userId,
			postTestFormId: assignment.postTestFormId,
			delayDays: 0, // Unlock immediately
		});
	}

	// Schedule delayed post-test unlock if configured
	if (assignment.delayedPostTestFormId && assignment.delayedPostTestDelayDays) {
		yield* unlockPostTestAfterAssignment({
			assignmentId: input.assignmentId,
			userId,
			postTestFormId: assignment.delayedPostTestFormId,
			delayDays: assignment.delayedPostTestDelayDays,
		});
	}

	return {
		diagnosisId,
		diagnosis,
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
		.innerJoin(assignments, eq(assignments.id, learnerMaps.assignmentId))
		.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.orderBy(desc(diagnoses.createdAt))
		.limit(1);

	const result = results[0];
	if (!result) {
		return null;
	}

	// Fetch the goal map from the assignment's goalMapId (not learnerMap's goalMapId)
	// This ensures kit-based assignments use the correct goal map for diagnosis
	const goalMapRows = yield* db
		.select({
			id: goalMaps.id,
			title: goalMaps.title,
			nodes: goalMaps.nodes,
			edges: goalMaps.edges,
			direction: goalMaps.direction,
		})
		.from(goalMaps)
		.where(eq(goalMaps.id, result.assignment.goalMapId))
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
		{ concurrency: "unbounded" },
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

export const startNewAttempt = Effect.fn("startNewAttempt")(function* (
	userId: string,
	input: StartNewAttemptInput,
) {
	const db = yield* Database;

	const existingRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const existing = existingRows[0];
	if (!existing) {
		return yield* new NoPreviousAttemptError({ assignmentId: input.assignmentId });
	}

	if (existing.status !== "submitted") {
		return yield* new PreviousAttemptNotSubmittedError({ learnerMapId: existing.id });
	}

	yield* db
		.update(learnerMaps)
		.set({
			status: "draft",
			attempt: existing.attempt + 1,
			submittedAt: null,
		})
		.where(eq(learnerMaps.id, existing.id));

	return true;
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

	const sortedScores = [...peerScores].sort((a, b) => a - b);
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

export const submitControlText = Effect.fn("submitControlText")(function* (
	userId: string,
	input: SubmitControlTextInput,
) {
	const db = yield* Database;

	// Verify assignment exists and get form unlock configuration
	const assignmentRows = yield* db
		.select({
			id: assignments.id,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
		})
		.from(assignments)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.assignmentId });
	}

	yield* requireAssignmentCondition(userId, input.assignmentId, "summarizing");

	const existingRows = yield* db
		.select({ id: learnerMaps.id, status: learnerMaps.status })
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const existing = existingRows[0];
	if (existing?.status === "submitted") {
		return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: existing.id });
	}

	if (existing) {
		yield* db
			.update(learnerMaps)
			.set({
				controlText: input.text,
				status: "submitted",
				submittedAt: new Date(),
			})
			.where(eq(learnerMaps.id, existing.id));
	} else {
		const learnerMapId = randomString();
		yield* db.insert(learnerMaps).values({
			id: learnerMapId,
			assignmentId: input.assignmentId,
			goalMapId: assignment.goalMapId,
			kitId: assignment.kitId,
			userId,
			controlText: input.text,
			nodes: null,
			edges: null,
			status: "submitted",
			attempt: 1,
			submittedAt: new Date(),
		});
	}

	// Unlock post-test immediately if configured
	if (assignment.postTestFormId) {
		yield* unlockPostTestAfterAssignment({
			assignmentId: input.assignmentId,
			userId,
			postTestFormId: assignment.postTestFormId,
			delayDays: 0, // Unlock immediately
		});
	}

	// Schedule delayed post-test unlock if configured
	if (assignment.delayedPostTestFormId && assignment.delayedPostTestDelayDays) {
		yield* unlockPostTestAfterAssignment({
			assignmentId: input.assignmentId,
			userId,
			postTestFormId: assignment.delayedPostTestFormId,
			delayDays: assignment.delayedPostTestDelayDays,
		});
	}

	return true;
});
