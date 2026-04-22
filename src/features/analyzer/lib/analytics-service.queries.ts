import { and, avg, count, desc, eq } from "drizzle-orm";
import { Effect, Schema } from "effect";

import {
	classifyEdges,
	compareMaps,
	EdgeSchema,
	NodeSchema,
} from "@/features/learner-map/lib/comparator";
import { safeParseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, diagnoses, goalMaps, kits, learnerMaps } from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";

import {
	AssignmentNotFoundError,
	GetAnalyticsForAssignmentInput,
	GetLearnerMapForAnalyticsInput,
	GetLearnerSummaryTextInput,
	GetMultipleLearnerMapsInput,
	GoalMapDirectionSchema,
	GoalMapNotFoundError,
	LearnerAnalyticsSchema,
	LearnerMapNotFoundError,
	LearnerSummaryTextSchema,
	PerLinkDiagnosisSchema,
} from "./analytics-service.shared";

export type LearnerMapResult = Awaited<
	Effect.Effect.Success<ReturnType<typeof getLearnerMapForAnalytics>>
>;

export const getTeacherAssignments = Effect.fn("getTeacherAssignments")(function* (userId: string) {
	const db = yield* Database;

	const assignmentsWithStats = yield* db
		.select({
			id: assignments.id,
			title: assignments.title,
			goalMapId: assignments.goalMapId,
			goalMapTitle: goalMaps.title,
			kitId: kits.id,
			createdAt: assignments.createdAt,
			dueAt: assignments.dueAt,
			submissionCount: count(learnerMaps.id),
			avgScore: avg(diagnoses.score),
		})
		.from(assignments)
		.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
		.leftJoin(kits, eq(assignments.kitId, kits.id))
		.leftJoin(learnerMaps, eq(learnerMaps.assignmentId, assignments.id))
		.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
		.where(eq(assignments.createdBy, userId))
		.groupBy(assignments.id, goalMaps.title, kits.id, assignments.createdAt, assignments.dueAt)
		.orderBy(desc(assignments.createdAt));

	return assignmentsWithStats.map((row) => ({
		id: row.id,
		title: row.title,
		goalMapId: row.goalMapId,
		goalMapTitle: row.goalMapTitle,
		kitId: row.kitId,
		totalSubmissions: Number(row.submissionCount ?? 0),
		avgScore: row.avgScore ? Number(row.avgScore) : null,
		createdAt: row.createdAt?.getTime() ?? 0,
		dueAt: row.dueAt?.getTime() ?? null,
	}));
});

export const getAnalyticsForAssignment = Effect.fn("getAnalyticsForAssignment")(function* (
	userId: string,
	input: GetAnalyticsForAssignmentInput,
) {
	const db = yield* Database;

	const assignmentRows = yield* db
		.select({
			id: assignments.id,
			title: assignments.title,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
			createdAt: assignments.createdAt,
			dueAt: assignments.dueAt,
		})
		.from(assignments)
		.where(and(eq(assignments.id, input.assignmentId), eq(assignments.createdBy, userId)))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({
			assignmentId: input.assignmentId,
		});
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
		.where(eq(goalMaps.id, assignment.goalMapId))
		.limit(1);

	const goalMap = goalMapRows[0];
	if (!goalMap) {
		return yield* new GoalMapNotFoundError({
			goalMapId: assignment.goalMapId,
		});
	}

	const [parsedGoalMapNodes, parsedGoalMapEdges] = yield* Effect.all(
		[
			safeParseJson(goalMap.nodes, [], Schema.Array(NodeSchema)),
			safeParseJson(goalMap.edges, [], Schema.Array(EdgeSchema)),
		],
		{ concurrency: "unbounded" },
	);

	const learnerMapsData = yield* db
		.select({
			id: learnerMaps.id,
			userId: learnerMaps.userId,
			status: learnerMaps.status,
			attempt: learnerMaps.attempt,
			submittedAt: learnerMaps.submittedAt,
			score: diagnoses.score,
			perLink: diagnoses.perLink,
			userName: user.name,
			studyGroup: user.studyGroup,
		})
		.from(learnerMaps)
		.innerJoin(user, eq(learnerMaps.userId, user.id))
		.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
		.where(eq(learnerMaps.assignmentId, input.assignmentId))
		.orderBy(desc(learnerMaps.attempt), desc(learnerMaps.updatedAt));

	const finalLearners = yield* Effect.all(
		learnerMapsData.map((lm) =>
			Effect.gen(function* () {
				let correct = 0;
				let missing = 0;
				let excessive = 0;
				let totalGoalEdges = 0;

				if (lm.perLink) {
					const parsed = yield* safeParseJson(lm.perLink, {}, PerLinkDiagnosisSchema);
					correct = parsed.correct?.length ?? 0;
					missing = parsed.missing?.length ?? 0;
					excessive = parsed.excessive?.length ?? 0;
					totalGoalEdges = parsed.totalGoalEdges ?? 0;
				}

				return yield* Schema.encode(LearnerAnalyticsSchema)({
					userId: lm.userId,
					userName: lm.userName,
					learnerMapId: lm.id,
					condition:
						lm.studyGroup === "experiment"
							? "concept_map"
							: lm.studyGroup === "control"
								? "summarizing"
								: undefined,
					status: lm.status,
					score: lm.score,
					attempt: lm.attempt,
					submittedAt: lm.submittedAt?.getTime() ?? null,
					correct,
					missing,
					excessive,
					totalGoalEdges,
				});
			}),
		),
		{ concurrency: 10 },
	);

	const scores = finalLearners.map((l) => l.score).filter((s): s is number => s !== null);

	const summary = {
		totalLearners: finalLearners.length,
		submittedCount: finalLearners.filter((l) => l.status === "submitted").length,
		draftCount: finalLearners.filter((l) => l.status === "draft").length,
		avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
		medianScore:
			scores.length > 0 ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : null,
		highestScore: scores.length > 0 ? Math.max(...scores) : null,
		lowestScore: scores.length > 0 ? Math.min(...scores) : null,
	};

	return {
		assignment: {
			id: assignment.id,
			title: assignment.title,
			goalMapId: assignment.goalMapId,
			goalMapTitle: goalMap.title,
			kitId: assignment.kitId,
			totalSubmissions: summary.submittedCount,
			createdAt: assignment.createdAt?.getTime() ?? 0,
			dueAt: assignment.dueAt?.getTime() ?? null,
		},
		goalMap: {
			id: goalMap.id,
			title: goalMap.title,
			nodes: parsedGoalMapNodes,
			edges: parsedGoalMapEdges,
			direction: yield* Schema.encode(GoalMapDirectionSchema)(goalMap.direction),
		},
		learners: finalLearners,
		summary,
	};
});

export const getLearnerMapForAnalytics = Effect.fn("getLearnerMapForAnalytics")(function* (
	input: GetLearnerMapForAnalyticsInput,
) {
	const db = yield* Database;

	const learnerMapRows = yield* db
		.select({
			id: learnerMaps.id,
			userId: learnerMaps.userId,
			goalMapId: learnerMaps.goalMapId,
			status: learnerMaps.status,
			attempt: learnerMaps.attempt,
			submittedAt: learnerMaps.submittedAt,
			nodes: learnerMaps.nodes,
			edges: learnerMaps.edges,
			userName: user.name,
		})
		.from(learnerMaps)
		.innerJoin(user, eq(learnerMaps.userId, user.id))
		.where(eq(learnerMaps.id, input.learnerMapId))
		.limit(1);

	const learnerMap = learnerMapRows[0];
	if (!learnerMap) {
		return yield* new LearnerMapNotFoundError({
			learnerMapId: input.learnerMapId,
		});
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
		.where(eq(goalMaps.id, learnerMap.goalMapId))
		.limit(1);

	const goalMap = goalMapRows[0];
	if (!goalMap) {
		return yield* new GoalMapNotFoundError({
			goalMapId: learnerMap.goalMapId,
		});
	}

	const [parsedGoalMapNodes, parsedGoalMapEdges, parsedLearnerMapNodes, parsedLearnerMapEdges] =
		yield* Effect.all(
			[
				safeParseJson(goalMap.nodes, [], Schema.Array(NodeSchema)),
				safeParseJson(goalMap.edges, [], Schema.Array(EdgeSchema)),
				safeParseJson(learnerMap.nodes, [], Schema.Array(NodeSchema)),
				safeParseJson(learnerMap.edges, [], Schema.Array(EdgeSchema)),
			],
			{ concurrency: "unbounded" },
		);

	const diagnosis = compareMaps(parsedGoalMapEdges, parsedLearnerMapEdges);
	const edgeClassifications = classifyEdges(parsedGoalMapEdges, parsedLearnerMapEdges);

	return {
		learnerMap: {
			id: learnerMap.id,
			userId: learnerMap.userId,
			userName: learnerMap.userName,
			status: learnerMap.status,
			attempt: learnerMap.attempt,
			submittedAt: learnerMap.submittedAt?.getTime() ?? null,
			nodes: parsedLearnerMapNodes,
			edges: parsedLearnerMapEdges,
		},
		goalMap: {
			id: goalMap.id,
			title: goalMap.title,
			nodes: parsedGoalMapNodes,
			edges: parsedGoalMapEdges,
			direction: yield* Schema.encode(GoalMapDirectionSchema)(goalMap.direction),
		},
		diagnosis,
		edgeClassifications,
	};
});

export const getMultipleLearnerMaps = Effect.fn("getMultipleLearnerMaps")(function* (
	input: GetMultipleLearnerMapsInput,
) {
	if (input.learnerMapIds.length === 0) {
		return [];
	}

	const results = yield* Effect.all(
		input.learnerMapIds.map((id) =>
			getLearnerMapForAnalytics({ learnerMapId: id }).pipe(
				Effect.tapError((error) =>
					Effect.logError("Failed to get learner map for analytics", error).pipe(
						Effect.annotateLogs({ learnerMapId: id }),
					),
				),
				Effect.catchAll(() => Effect.succeed(null)),
			),
		),
		{ concurrency: 10 },
	);

	return results.filter((r) => r !== null);
});

export const getLearnerSummaryText = Effect.fn("getLearnerSummaryText")(function* (
	input: GetLearnerSummaryTextInput,
) {
	const db = yield* Database;

	const learnerMapRows = yield* db
		.select({
			learnerMapId: learnerMaps.id,
			learnerId: learnerMaps.userId,
			learnerName: user.name,
			status: learnerMaps.status,
			submittedAt: learnerMaps.submittedAt,
			controlText: learnerMaps.controlText,
		})
		.from(learnerMaps)
		.innerJoin(user, eq(learnerMaps.userId, user.id))
		.where(eq(learnerMaps.id, input.learnerMapId))
		.limit(1);

	const learnerMap = learnerMapRows[0];
	if (!learnerMap) {
		return yield* new LearnerMapNotFoundError({
			learnerMapId: input.learnerMapId,
		});
	}

	return yield* Schema.encode(LearnerSummaryTextSchema)({
		learnerMapId: learnerMap.learnerMapId,
		learnerId: learnerMap.learnerId,
		learnerName: learnerMap.learnerName,
		status: learnerMap.status,
		submittedAt: learnerMap.submittedAt?.getTime() ?? null,
		controlText: learnerMap.controlText ?? null,
	});
});
