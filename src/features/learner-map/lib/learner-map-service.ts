import { Effect, Schema } from "effect";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { compareMaps } from "./comparator";
import { randomString } from "@/lib/utils";
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
import { Database } from "@/server/db/client";

export const GetAssignmentForStudentInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type GetAssignmentForStudentInput =
	typeof GetAssignmentForStudentInput.Type;

export const SaveLearnerMapInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
	nodes: Schema.String,
	edges: Schema.String,
});

export type SaveLearnerMapInput = typeof SaveLearnerMapInput.Type;

export const SubmitLearnerMapInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type SubmitLearnerMapInput = typeof SubmitLearnerMapInput.Type;

export const GetDiagnosisInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type GetDiagnosisInput = typeof GetDiagnosisInput.Type;

export const StartNewAttemptInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type StartNewAttemptInput = typeof StartNewAttemptInput.Type;

export const GetPeerStatsInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type GetPeerStatsInput = typeof GetPeerStatsInput.Type;

export const listStudentAssignments = Effect.fn("listStudentAssignments")(
	(userId: string) =>
		Effect.gen(function* () {
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
		}),
);

export const getAssignmentForStudent = Effect.fn("getAssignmentForStudent")(
	(userId: string, input: GetAssignmentForStudentInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

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
				.where(eq(assignments.id, input.assignmentId))
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
		}),
);

export const saveLearnerMap = Effect.fn("saveLearnerMap")(
	(
		userId: string,
		data: { assignmentId: string; nodes: string; edges: string },
	) =>
		Effect.gen(function* () {
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
				return { success: false, error: "Assignment not found" } as const;
			}

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
				if (existing.status === "submitted") {
					return {
						success: false,
						error: "Cannot edit submitted map",
					} as const;
				}

				yield* db
					.update(learnerMaps)
					.set({
						nodes: data.nodes,
						edges: data.edges,
					})
					.where(eq(learnerMaps.id, existing.id));

				return { success: true, learnerMapId: existing.id } as const;
			}

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
		}),
);

export const submitLearnerMap = Effect.fn("submitLearnerMap")(
	(userId: string, input: SubmitLearnerMapInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const learnerMapRows = yield* db
				.select()
				.from(learnerMaps)
				.where(
					and(
						eq(learnerMaps.assignmentId, input.assignmentId),
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

			return {
				success: true,
				diagnosisId,
				diagnosis,
			} as const;
		}),
);

export const getDiagnosis = Effect.fn("getDiagnosis")(
	(userId: string, input: GetDiagnosisInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

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
						eq(learnerMaps.assignmentId, input.assignmentId),
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
							correct: (diagnosisData?.correct as unknown[]) ?? [],
							missing: (diagnosisData?.missing as unknown[]) ?? [],
							excessive: (diagnosisData?.excessive as unknown[]) ?? [],
						}
					: null,
			};
		}),
);

export const startNewAttempt = Effect.fn("startNewAttempt")(
	(userId: string, input: StartNewAttemptInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const existingRows = yield* db
				.select()
				.from(learnerMaps)
				.where(
					and(
						eq(learnerMaps.assignmentId, input.assignmentId),
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

			yield* db
				.update(learnerMaps)
				.set({
					status: "draft",
					attempt: existing.attempt + 1,
					submittedAt: null,
				})
				.where(eq(learnerMaps.id, existing.id));

			return { success: true, attempt: existing.attempt + 1 } as const;
		}),
);

export const getPeerStats = Effect.fn("getPeerStats")(
	(userId: string, input: GetPeerStatsInput) =>
		Effect.gen(function* () {
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

			const currentUserMaps = allSubmittedMaps.filter(
				(m) => m.userId === userId,
			);
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
			const avgScore =
				sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length;
			const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
			const highestScore = sortedScores[sortedScores.length - 1];
			const lowestScore = sortedScores[0];

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
		}),
);
