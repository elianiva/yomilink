import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { compareMaps } from "@/features/learner-map/lib/comparator";
import { randomString, safeParseJson } from "@/lib/utils";
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

			// Get user's cohort memberships
			const userCohorts = yield* Effect.tryPromise(() =>
				db
					.select({ cohortId: cohortMembers.cohortId })
					.from(cohortMembers)
					.where(eq(cohortMembers.userId, userId))
					.all(),
			);

			const cohortIds = userCohorts.map((c) => c.cohortId);

			// Get assignments targeted to user directly or via cohort
			let assignmentIds: string[] = [];

			if (cohortIds.length > 0) {
				const targets = yield* Effect.tryPromise(() =>
					db
						.select({ assignmentId: assignmentTargets.assignmentId })
						.from(assignmentTargets)
						.where(
							or(
								eq(assignmentTargets.userId, userId),
								inArray(assignmentTargets.cohortId, cohortIds),
							),
						)
						.all(),
				);
				assignmentIds = [...new Set(targets.map((t) => t.assignmentId))];
			} else {
				const targets = yield* Effect.tryPromise(() =>
					db
						.select({ assignmentId: assignmentTargets.assignmentId })
						.from(assignmentTargets)
						.where(eq(assignmentTargets.userId, userId))
						.all(),
				);
				assignmentIds = targets.map((t) => t.assignmentId);
			}

			if (assignmentIds.length === 0) {
				return [];
			}

			// Get assignment details with learner map status
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						description: assignments.description,
						goalMapId: assignments.goalMapId,
						kitId: assignments.kitId,
						dueAt: assignments.dueAt,
						createdAt: assignments.createdAt,
						goalMapTitle: goalMaps.title,
					})
					.from(assignments)
					.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
					.where(inArray(assignments.id, assignmentIds))
					.orderBy(desc(assignments.createdAt))
					.all(),
			);

			// Get learner maps for these assignments
			const learnerMapRows = yield* Effect.tryPromise(() =>
				db
					.select({
						assignmentId: learnerMaps.assignmentId,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						updatedAt: learnerMaps.updatedAt,
					})
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.userId, userId),
							inArray(learnerMaps.assignmentId, assignmentIds),
						),
					)
					.all(),
			);

			const learnerMapsByAssignment = new Map(
				learnerMapRows.map((lm) => [
					lm.assignmentId,
					{ status: lm.status, attempt: lm.attempt, updatedAt: lm.updatedAt },
				]),
			);

			return rows.map((row) => {
				const learnerMap = learnerMapsByAssignment.get(row.id);
				const now = Date.now();
				const isLate = row.dueAt && row.dueAt.getTime() < now;

				return {
					...row,
					dueAt: row.dueAt?.getTime(),
					createdAt: row.createdAt?.getTime(),
					status: learnerMap?.status || "not_started",
					attempt: learnerMap?.attempt || 0,
					isLate: isLate && learnerMap?.status !== "submitted",
					lastUpdated: learnerMap?.updatedAt?.getTime(),
				};
			});
		}).pipe(
			Effect.provide(DatabaseLive),
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

			// Get assignment
			const assignment = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						description: assignments.description,
						readingMaterial: assignments.readingMaterial,
						timeLimitMinutes: assignments.timeLimitMinutes,
						goalMapId: assignments.goalMapId,
						kitId: assignments.kitId,
						dueAt: assignments.dueAt,
					})
					.from(assignments)
					.where(eq(assignments.id, data.assignmentId))
					.get(),
			);

			if (!assignment) return null;

			// Get kit nodes (concepts + connectors)
			const kit = yield* Effect.tryPromise(() =>
				db
					.select({
						id: kits.id,
						nodes: kits.nodes,
						edges: kits.edges,
						textId: kits.textId,
					})
					.from(kits)
					.where(eq(kits.id, assignment.kitId))
					.get(),
			);

			if (!kit) return null;

			// Use reading material from assignment if available, fallback to kit's text
			let materialText: string | null = assignment.readingMaterial;
			if (!materialText && kit.textId) {
				const textId = kit.textId;
				const text = yield* Effect.tryPromise(() =>
					db
						.select({ content: texts.content })
						.from(texts)
						.where(eq(texts.id, textId))
						.get(),
				);
				materialText = text?.content || null;
			}

			// Get existing learner map if any
			const learnerMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
					})
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, data.assignmentId),
							eq(learnerMaps.userId, userId),
						),
					)
					.get(),
			);

			// Parse kit nodes
			const kitNodes = yield* safeParseJson(kit.nodes, []);
			const kitEdges = yield* safeParseJson(kit.edges, []);

			return {
				assignment: {
					...assignment,
					dueAt: assignment.dueAt?.getTime(),
				},
				kit: {
					id: kit.id,
					nodes: kitNodes,
					edges: kitEdges,
				},
				materialText,
				learnerMap: learnerMap
					? {
							id: learnerMap.id,
							nodes: yield* safeParseJson(learnerMap.nodes, []),
							edges: yield* safeParseJson(learnerMap.edges, []),
							status: learnerMap.status,
							attempt: learnerMap.attempt,
						}
					: null,
			};
		}).pipe(
			Effect.provide(DatabaseLive),
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
			const assignment = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						goalMapId: assignments.goalMapId,
						kitId: assignments.kitId,
					})
					.from(assignments)
					.where(eq(assignments.id, data.assignmentId))
					.get(),
			);

			if (!assignment) {
				return { success: false, error: "Assignment not found" } as const;
			}

			// Check if learner map exists
			const existing = yield* Effect.tryPromise(() =>
				db
					.select({ id: learnerMaps.id, status: learnerMaps.status })
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, data.assignmentId),
							eq(learnerMaps.userId, userId),
						),
					)
					.get(),
			);

			if (existing) {
				// Don't allow editing submitted maps
				if (existing.status === "submitted") {
					return {
						success: false,
						error: "Cannot edit submitted map",
					} as const;
				}

				// Update existing
				yield* Effect.tryPromise(() =>
					db
						.update(learnerMaps)
						.set({
							nodes: data.nodes,
							edges: data.edges,
						})
						.where(eq(learnerMaps.id, existing.id))
						.run(),
				);

				return { success: true, learnerMapId: existing.id } as const;
			}

			// Create new learner map
			const learnerMapId = randomString();
			yield* Effect.tryPromise(() =>
				db
					.insert(learnerMaps)
					.values({
						id: learnerMapId,
						assignmentId: data.assignmentId,
						goalMapId: assignment.goalMapId,
						kitId: assignment.kitId,
						userId,
						nodes: data.nodes,
						edges: data.edges,
						status: "draft",
						attempt: 1,
					})
					.run(),
			);

			return { success: true, learnerMapId } as const;
		}).pipe(
			Effect.provide(DatabaseLive),
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
			const learnerMap = yield* Effect.tryPromise(() =>
				db
					.select()
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, data.assignmentId),
							eq(learnerMaps.userId, userId),
						),
					)
					.get(),
			);

			if (!learnerMap) {
				return { success: false, error: "Learner map not found" } as const;
			}

			if (learnerMap.status === "submitted") {
				return { success: false, error: "Already submitted" } as const;
			}

			// Get goal map edges for comparison
			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({ edges: goalMaps.edges })
					.from(goalMaps)
					.where(eq(goalMaps.id, learnerMap.goalMapId))
					.get(),
			);

			if (!goalMap) {
				return { success: false, error: "Goal map not found" } as const;
			}

			const goalMapEdges = Array.isArray(goalMap.edges) ? goalMap.edges : [];
			const learnerEdges = yield* safeParseJson(learnerMap.edges, []);

			// Compare maps
			const diagnosis = compareMaps(goalMapEdges, learnerEdges);

			// Update learner map status
			yield* Effect.tryPromise(() =>
				db
					.update(learnerMaps)
					.set({
						status: "submitted",
						submittedAt: new Date(),
					})
					.where(eq(learnerMaps.id, learnerMap.id))
					.run(),
			);

			// Create diagnosis record
			const diagnosisId = randomString();
			yield* Effect.tryPromise(() =>
				db
					.insert(diagnoses)
					.values({
						id: diagnosisId,
						goalMapId: learnerMap.goalMapId,
						learnerMapId: learnerMap.id,
						summary: `Correct: ${diagnosis.correct.length}, Missing: ${diagnosis.missing.length}, Excessive: ${diagnosis.excessive.length}`,
						perLink: JSON.stringify(diagnosis),
						score: diagnosis.score,
						rubricVersion: "1.0",
					})
					.run(),
			);

			return {
				success: true,
				diagnosisId,
				diagnosis,
			} as const;
		}).pipe(
			Effect.provide(DatabaseLive),
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

			// Get learner map
			const learnerMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						goalMapId: learnerMaps.goalMapId,
					})
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, data.assignmentId),
							eq(learnerMaps.userId, userId),
						),
					)
					.get(),
			);

			if (!learnerMap) {
				return null;
			}

			// Get goal map for node info
			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({ nodes: goalMaps.nodes, edges: goalMaps.edges })
					.from(goalMaps)
					.where(eq(goalMaps.id, learnerMap.goalMapId))
					.get(),
			);

			if (!goalMap) {
				return null;
			}

			// Get diagnosis
			const diagnosis = yield* Effect.tryPromise(() =>
				db
					.select()
					.from(diagnoses)
					.where(eq(diagnoses.learnerMapId, learnerMap.id))
					.orderBy(desc(diagnoses.createdAt))
					.get(),
			);

			const diagnosisData = diagnosis?.perLink
				? yield* safeParseJson(diagnosis.perLink, {
						correct: [],
						missing: [],
						excessive: [],
					})
				: null;

			return {
				learnerMap: {
					id: learnerMap.id,
					nodes: yield* safeParseJson(learnerMap.nodes, []),
					edges: yield* safeParseJson(learnerMap.edges, []),
					status: learnerMap.status,
					attempt: learnerMap.attempt,
				},
				goalMap: {
					nodes: Array.isArray(goalMap.nodes) ? goalMap.nodes : [],
					edges: Array.isArray(goalMap.edges) ? goalMap.edges : [],
				},
				diagnosis: diagnosis
					? {
							id: diagnosis.id,
							summary: diagnosis.summary,
							score: diagnosis.score,
							correct: diagnosisData?.correct ?? [],
							missing: diagnosisData?.missing ?? [],
							excessive: diagnosisData?.excessive ?? [],
						}
					: null,
			};
		}).pipe(
			Effect.provide(DatabaseLive),
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
			const existing = yield* Effect.tryPromise(() =>
				db
					.select()
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, data.assignmentId),
							eq(learnerMaps.userId, userId),
						),
					)
					.get(),
			);

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
			yield* Effect.tryPromise(() =>
				db
					.update(learnerMaps)
					.set({
						status: "draft",
						attempt: existing.attempt + 1,
						submittedAt: null,
					})
					.where(eq(learnerMaps.id, existing.id))
					.run(),
			);

			return { success: true, attempt: existing.attempt + 1 } as const;
		}).pipe(
			Effect.provide(DatabaseLive),
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
			const allSubmittedMaps = yield* Effect.tryPromise(() =>
				db
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
					)
					.all(),
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
			Effect.provide(DatabaseLive),
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
