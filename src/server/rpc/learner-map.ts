import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { compareMaps } from "@/features/learner-map/lib/comparator";
import { randomString } from "@/lib/utils";
import { authMiddleware } from "@/middlewares/auth";
import {
	assignments,
	assignmentTargets,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
	texts,
} from "@/server/db/schema/app-schema";
import { cohortMembers } from "@/server/db/schema/auth-schema";
import { Database, DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

// Types
export const SaveLearnerMapSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
	nodes: Schema.String,
	edges: Schema.String,
});

export const SubmitLearnerMapSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

// Student: List assignments for current user
export const listStudentAssignments = createServerFn()
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

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
					createdAt: assignments.createdAt,
					goalMapTitle: goalMaps.title,
					learnerMapStatus: learnerMaps.status,
					learnerMapAttempt: learnerMaps.attempt,
					learnerMapUpdatedAt: learnerMaps.updatedAt,
				})
				.from(assignments)
				.leftJoin(
					assignmentTargets,
					eq(assignmentTargets.assignmentId, assignments.id),
				)
				.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
				.leftJoin(
					learnerMaps,
					and(
						eq(learnerMaps.assignmentId, assignments.id),
						eq(learnerMaps.userId, userId),
					),
				)
				.where(
					or(
						eq(assignmentTargets.userId, userId),
						cohortIds.length > 0
							? inArray(assignmentTargets.cohortId, cohortIds)
							: sql`1 = 0`,
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
		}).pipe(
			Effect.tapError(logRpcError("listStudentAssignments")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listStudentAssignments"),
			Effect.runPromise,
		);
	});

// Student: Get assignment details for building learner map
export const getAssignmentForStudent = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ assignmentId: Schema.NonEmptyString }),
		)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

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
					},
					kit: {
						id: kits.id,
						nodes: kits.nodes,
						edges: kits.edges,
						textId: kits.textId,
					},
					materialText: texts.content,
					learnerMap: {
						id: learnerMaps.id,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
					},
				})
				.from(assignments)
				.leftJoin(kits, eq(kits.id, assignments.kitId))
				.leftJoin(texts, eq(texts.id, kits.textId))
				.leftJoin(
					learnerMaps,
					and(
						eq(learnerMaps.assignmentId, assignments.id),
						eq(learnerMaps.userId, userId),
					),
				)
				.where(eq(assignments.id, data.assignmentId))
				.limit(1);

			const result = results[0];
			if (!result || !result.kit) return null;

			const kitNodes = Array.isArray(result.kit.nodes) ? result.kit.nodes : [];
			const kitEdges = Array.isArray(result.kit.edges) ? result.kit.edges : [];

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
				materialText:
					result.assignment.readingMaterial || result.materialText || null,
				learnerMap: result.learnerMap
					? {
							id: result.learnerMap.id,
							nodes: Array.isArray(result.learnerMap.nodes)
								? result.learnerMap.nodes
								: [],
							edges: Array.isArray(result.learnerMap.edges)
								? result.learnerMap.edges
								: [],
							status: result.learnerMap.status,
							attempt: result.learnerMap.attempt,
						}
					: null,
			};
		}).pipe(
			Effect.tapError(logRpcError("getAssignmentForStudent")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAssignmentForStudent"),
			Effect.runPromise,
		);
	});

// Student: Save learner map draft
export const saveLearnerMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveLearnerMapSchema)(raw))
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

			// Get assignment details
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
				return { success: false, error: "Assignment not found" } as const;
			}

			// Check if learner map exists
			const existingRows = yield* db
				.select({ id: learnerMaps.id, status: learnerMaps.status })
				.from(learnerMaps)
				.where(
					and(
						eq(learnerMaps.assignmentId, data.assignmentId),
						eq(learnerMaps.userId, userId),
					),
				)
				.limit(1);

			const existing = existingRows[0];
			if (existing) {
				// Don't allow editing submitted maps
				if (existing.status === "submitted") {
					return {
						success: false,
						error: "Cannot edit submitted map",
					} as const;
				}

				// Update existing
				yield* db
					.update(learnerMaps)
					.set({
						nodes: data.nodes,
						edges: data.edges,
					})
					.where(eq(learnerMaps.id, existing.id));

				return { success: true, learnerMapId: existing.id } as const;
			}

			// Create new learner map
			const learnerMapId = randomString();
			yield* db.insert(learnerMaps).values({
				id: learnerMapId,
				assignmentId: data.assignmentId,
				goalMapId: assignment.goalMapId,
				kitId: assignment.kitId,
				userId,
				nodes: data.nodes,
				edges: data.edges,
				status: "draft",
				attempt: 1,
			});

			return { success: true, learnerMapId } as const;
		}).pipe(
			Effect.tapError(logRpcError("saveLearnerMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("saveLearnerMap"),
			Effect.runPromise,
		);
	});

// Student: Submit learner map and generate diagnosis
export const submitLearnerMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(SubmitLearnerMapSchema)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

			// Get learner map
			const learnerMapRows = yield* db
				.select()
				.from(learnerMaps)
				.where(
					and(
						eq(learnerMaps.assignmentId, data.assignmentId),
						eq(learnerMaps.userId, userId),
					),
				)
				.limit(1);

			const learnerMap = learnerMapRows[0];
			if (!learnerMap) {
				return { success: false, error: "Learner map not found" } as const;
			}

			if (learnerMap.status === "submitted") {
				return { success: false, error: "Already submitted" } as const;
			}

			// Get goal map edges for comparison
			const goalMapRows = yield* db
				.select({ edges: goalMaps.edges })
				.from(goalMaps)
				.where(eq(goalMaps.id, learnerMap.goalMapId))
				.limit(1);

			const goalMap = goalMapRows[0];
			if (!goalMap) {
				return { success: false, error: "Goal map not found" } as const;
			}

			const goalMapEdges = Array.isArray(goalMap.edges) ? goalMap.edges : [];
			const learnerEdges = Array.isArray(learnerMap.edges)
				? learnerMap.edges
				: [];

			// Compare maps
			const diagnosis = compareMaps(goalMapEdges, learnerEdges);

			// Update learner map status
			yield* db
				.update(learnerMaps)
				.set({
					status: "submitted",
					submittedAt: new Date(),
				})
				.where(eq(learnerMaps.id, learnerMap.id));

			// Create diagnosis record
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

			return {
				success: true,
				diagnosisId,
				diagnosis,
			} as const;
		}).pipe(
			Effect.tapError(logRpcError("submitLearnerMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("submitLearnerMap"),
			Effect.runPromise,
		);
	});

// Student: Get diagnosis for a learner map
export const getDiagnosis = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ assignmentId: Schema.NonEmptyString }),
		)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

			const results = yield* db
				.select({
					learnerMap: {
						id: learnerMaps.id,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						goalMapId: learnerMaps.goalMapId,
					},
					goalMap: {
						nodes: goalMaps.nodes,
						edges: goalMaps.edges,
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
				.innerJoin(goalMaps, eq(goalMaps.id, learnerMaps.goalMapId))
				.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
				.where(
					and(
						eq(learnerMaps.assignmentId, data.assignmentId),
						eq(learnerMaps.userId, userId),
					),
				)
				.orderBy(desc(diagnoses.createdAt))
				.limit(1);

			const result = results[0];
			if (!result) {
				return null;
			}

			const diagnosisData =
				result.diagnosis?.perLink &&
				typeof result.diagnosis.perLink === "object"
					? (result.diagnosis.perLink as {
							correct?: unknown[];
							missing?: unknown[];
							excessive?: unknown[];
						})
					: null;

			return {
				learnerMap: {
					id: result.learnerMap.id,
					nodes: Array.isArray(result.learnerMap.nodes)
						? result.learnerMap.nodes
						: [],
					edges: Array.isArray(result.learnerMap.edges)
						? result.learnerMap.edges
						: [],
					status: result.learnerMap.status,
					attempt: result.learnerMap.attempt,
				},
				goalMap: {
					nodes: Array.isArray(result.goalMap.nodes)
						? result.goalMap.nodes
						: [],
					edges: Array.isArray(result.goalMap.edges)
						? result.goalMap.edges
						: [],
				},
				diagnosis: result.diagnosis
					? {
							id: result.diagnosis.id,
							summary: result.diagnosis.summary,
							score: result.diagnosis.score,
							correct: (diagnosisData?.correct ?? []) as any[],
							missing: (diagnosisData?.missing ?? []) as any[],
							excessive: (diagnosisData?.excessive ?? []) as any[],
						}
					: null,
			};
		}).pipe(
			Effect.tapError(logRpcError("getDiagnosis")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getDiagnosis"),
			Effect.runPromise,
		);
	});

// Student: Start a new attempt (after viewing diagnosis)
export const startNewAttempt = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ assignmentId: Schema.NonEmptyString }),
		)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;
			const userId = user.id;

			// Get existing learner map
			const existingRows = yield* db
				.select()
				.from(learnerMaps)
				.where(
					and(
						eq(learnerMaps.assignmentId, data.assignmentId),
						eq(learnerMaps.userId, userId),
					),
				)
				.limit(1);

			const existing = existingRows[0];
			if (!existing) {
				return { success: false, error: "No previous attempt found" } as const;
			}

			if (existing.status !== "submitted") {
				return {
					success: false,
					error: "Previous attempt not submitted",
				} as const;
			}

			// Reset to draft and increment attempt
			yield* db
				.update(learnerMaps)
				.set({
					status: "draft",
					attempt: existing.attempt + 1,
					submittedAt: null,
				})
				.where(eq(learnerMaps.id, existing.id));

			return { success: true, attempt: existing.attempt + 1 } as const;
		}).pipe(
			Effect.tapError(logRpcError("startNewAttempt")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("startNewAttempt"),
			Effect.runPromise,
		);
	});

// Student: Get peer comparison stats (anonymized)
export const getPeerStats = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ assignmentId: Schema.NonEmptyString }),
		)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			// Get all submitted learner maps for this assignment
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
						eq(learnerMaps.assignmentId, data.assignmentId),
						eq(learnerMaps.status, "submitted"),
					),
				);

			// Separate current user's maps from peers
			const currentUserMaps = allSubmittedMaps.filter(
				(m) => m.userId === user.id,
			);
			const peerMaps = allSubmittedMaps.filter((m) => m.userId !== user.id);

			// Calculate stats from peerMaps
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

			// Calculate statistics
			const sortedScores = [...peerScores].sort((a, b) => a - b);
			const avgScore =
				sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length;
			const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
			const highestScore = sortedScores[sortedScores.length - 1];
			const lowestScore = sortedScores[0];

			// Calculate user's percentile
			const userBestScore = Math.max(
				...currentUserMaps.map((m) => m.score ?? 0),
			);
			const userPercentile =
				(peerScores.filter((s) => s < userBestScore).length /
					peerScores.length) *
				100;

			return {
				count: peerScores.length,
				avgScore: Math.round(avgScore * 100) / 100,
				medianScore: Math.round(medianScore * 100) / 100,
				highestScore: Math.round(highestScore * 100) / 100,
				lowestScore: Math.round(lowestScore * 100) / 100,
				userPercentile: Math.round(userPercentile * 10) / 10,
			};
		}).pipe(
			Effect.tapError(logRpcError("getPeerStats")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getPeerStats"),
			Effect.runPromise,
		);
	});

export const LearnerMapRpc = {
	learnerMaps: () => ["learner-maps"],

	listStudentAssignments: () =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), "assignments"],
			queryFn: () => listStudentAssignments(),
		}),

	getAssignmentForStudent: (assignmentId: string) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), assignmentId],
			queryFn: () => getAssignmentForStudent({ data: { assignmentId } }),
		}),

	saveLearnerMap: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "save"],
			mutationFn: (data: typeof SaveLearnerMapSchema.Type) =>
				saveLearnerMap({ data }),
		}),

	submitLearnerMap: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "submit"],
			mutationFn: (data: typeof SubmitLearnerMapSchema.Type) =>
				submitLearnerMap({ data }),
		}),

	getDiagnosis: (assignmentId: string) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), assignmentId, "diagnosis"],
			queryFn: () => getDiagnosis({ data: { assignmentId } }),
		}),

	startNewAttempt: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "new-attempt"],
			mutationFn: (assignmentId: string) =>
				startNewAttempt({ data: { assignmentId } }),
		}),

	getPeerStats: (assignmentId: string) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), assignmentId, "peer-stats"],
			queryFn: () => getPeerStats({ data: { assignmentId } }),
		}),
};
