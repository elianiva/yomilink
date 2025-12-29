import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";
import Papa from "papaparse";
import {
	classifyEdges,
	compareMaps,
	type DiagnosisResult,
	EdgeSchema,
	NodeSchema,
	type EdgeClassification,
} from "@/features/learner-map/lib/comparator";
import { parseJson } from "@/lib/utils";
import { authMiddleware } from "@/middlewares/auth";
import { requireTeacher } from "@/lib/auth-authorization";
import {
	assignments,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { user as usersTable } from "@/server/db/schema/auth-schema";
import { Database, DatabaseLive } from "../db/client";

class AssignmentNotFoundError extends Data.TaggedError(
	"AssignmentNotFoundError",
)<{
	readonly assignmentId: string;
}> {}

class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

class LearnerMapNotFoundError extends Data.TaggedError(
	"LearnerMapNotFoundError",
)<{
	readonly learnerMapId: string;
}> {}

export const GetAnalyticsForAssignmentSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export const GetLearnerMapForAnalyticsSchema = Schema.Struct({
	learnerMapId: Schema.NonEmptyString,
});

export const ExportAnalyticsSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
	format: Schema.Literal("csv", "json"),
});

export interface TeacherAssignment {
	id: string;
	title: string;
	goalMapId: string;
	goalMapTitle: string | null;
	kitId: string | null;
	totalSubmissions: number;
	avgScore: number | null;
	createdAt: number;
	dueAt: number | null;
}

export interface LearnerAnalytics {
	userId: string;
	userName: string;
	learnerMapId: string;
	status: "draft" | "submitted";
	score: number | null;
	attempt: number;
	submittedAt: number | null;
	correct: number;
	missing: number;
	excessive: number;
	totalGoalEdges: number;
}

export interface AssignmentAnalytics {
	assignment: {
		id: string;
		title: string;
		goalMapId: string;
		goalMapTitle: string | null;
		kitId: string | null;
		createdAt: number;
		dueAt: number | null;
	};
	goalMap: {
		id: string;
		title: string;
		nodes: unknown;
		edges: unknown;
		direction: "bi" | "uni" | "multi";
	};
	learners: LearnerAnalytics[];
	summary: {
		totalLearners: number;
		submittedCount: number;
		draftCount: number;
		avgScore: number | null;
		medianScore: number | null;
		highestScore: number | null;
		lowestScore: number | null;
	};
}

export interface LearnerMapDetails {
	learnerMap: {
		id: string;
		userId: string;
		userName: string;
		status: string;
		attempt: number;
		submittedAt: number | null;
		nodes: unknown;
		edges: unknown;
	};
	goalMap: {
		id: string;
		title: string;
		nodes: unknown;
		edges: unknown;
		direction: "bi" | "uni" | "multi";
	};
	diagnosis: DiagnosisResult;
	edgeClassifications: EdgeClassification[];
}

export interface ExportResult {
	filename: string;
	data: string;
	contentType: "text/csv" | "application/json";
}

export const getTeacherAssignmentsForAnalytics = createServerFn()
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			const assignments_ = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						goalMapId: assignments.goalMapId,
						goalMapTitle: goalMaps.title,
						kitId: kits.id,
						createdAt: assignments.createdAt,
						dueAt: assignments.dueAt,
					})
					.from(assignments)
					.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
					.leftJoin(kits, eq(assignments.kitId, kits.id))
					.where(eq(assignments.createdBy, user.id))
					.orderBy(desc(assignments.createdAt))
					.all(),
			);

			const getAssignmentStats = (assignment: (typeof assignments_)[number]) =>
				Effect.gen(function* () {
					const submissionCount = yield* Effect.tryPromise(() =>
						db
							.select({ count: db.$count(learnerMaps.id) })
							.from(learnerMaps)
							.where(eq(learnerMaps.assignmentId, assignment.id))
							.get(),
					);

					const diagnosesForAssignment = yield* Effect.tryPromise(() =>
						db
							.select({ score: diagnoses.score })
							.from(diagnoses)
							.where(eq(diagnoses.goalMapId, assignment.goalMapId))
							.all(),
					);

					const scores = diagnosesForAssignment
						.map((d) => d.score)
						.filter((s): s is number => s !== null);

					const avgScore =
						scores.length > 0
							? scores.reduce((a, b) => a + b, 0) / scores.length
							: null;

					return {
						id: assignment.id,
						title: assignment.title,
						goalMapId: assignment.goalMapId,
						goalMapTitle: assignment.goalMapTitle,
						kitId: assignment.kitId,
						totalSubmissions: Number(submissionCount?.count ?? 0),
						avgScore,
						createdAt: assignment.createdAt?.getTime() ?? 0,
						dueAt: assignment.dueAt?.getTime() ?? null,
					} as TeacherAssignment;
				});

			const assignmentsWithStats = yield* Effect.all(
				assignments_.map(getAssignmentStats),
				{ concurrency: "unbounded" },
			);

			return assignmentsWithStats;
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getTeacherAssignmentsForAnalytics"),
			Effect.runPromise,
		);
	});

export const getAnalyticsForAssignment = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetAnalyticsForAssignmentSchema)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			// Verify user is a teacher
			yield* requireTeacher(user.id);

			const assignment = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						goalMapId: assignments.goalMapId,
						kitId: assignments.kitId,
						createdAt: assignments.createdAt,
						dueAt: assignments.dueAt,
						createdBy: assignments.createdBy,
					})
					.from(assignments)
					.where(eq(assignments.id, data.assignmentId))
					.get(),
			);

			if (!assignment) {
				return yield* Effect.fail(
					new AssignmentNotFoundError({ assignmentId: data.assignmentId }),
				);
			}

			if (assignment.createdBy !== user.id) {
				return {
					success: false,
					error: "Access denied",
				} as const;
			}

			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: goalMaps.id,
						title: goalMaps.title,
						nodes: goalMaps.nodes,
						edges: goalMaps.edges,
						direction: goalMaps.direction,
					})
					.from(goalMaps)
					.where(eq(goalMaps.id, assignment.goalMapId))
					.get(),
			);

			if (!goalMap) {
				return yield* Effect.fail(
					new GoalMapNotFoundError({ goalMapId: assignment.goalMapId }),
				);
			}

			const parsedGoalMapNodes = yield* parseJson(
				goalMap.nodes,
				Schema.Array(NodeSchema),
			);
			const parsedGoalMapEdges = yield* parseJson(
				goalMap.edges,
				Schema.Array(EdgeSchema),
			);

			const learnerMapsData = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						userId: learnerMaps.userId,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						submittedAt: learnerMaps.submittedAt,
						score: diagnoses.score,
						userName: usersTable.name,
					})
					.from(learnerMaps)
					.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
					.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
					.where(eq(learnerMaps.assignmentId, data.assignmentId))
					.orderBy(desc(learnerMaps.attempt), desc(learnerMaps.updatedAt))
					.all(),
			);

			const lastAttempts = new Map<string, any>();
			for (const lm of learnerMapsData) {
				const existing = lastAttempts.get(lm.userId);
				if (!existing) {
					lastAttempts.set(lm.userId, lm);
				}
			}

			const getLearnerAnalytics = ([_userId, lm]: [string, any]) =>
				Effect.gen(function* () {
					const diagnosisData =
						lm.score !== null
							? yield* Effect.tryPromise(() =>
									db
										.select({ perLink: diagnoses.perLink })
										.from(diagnoses)
										.where(eq(diagnoses.learnerMapId, lm.id))
										.get(),
								)
							: null;

					let correct = 0;
					let missing = 0;
					let excessive = 0;
					let totalGoalEdges = 0;

					if (diagnosisData?.perLink) {
						const parsed = yield* parseJson(
							diagnosisData.perLink,
							Schema.Struct({
								correct: Schema.optional(Schema.Array(Schema.String)),
								missing: Schema.optional(Schema.Array(Schema.String)),
								excessive: Schema.optional(Schema.Array(Schema.String)),
								totalGoalEdges: Schema.optional(Schema.Number),
							}),
						);
						correct = parsed.correct?.length ?? 0;
						missing = parsed.missing?.length ?? 0;
						excessive = parsed.excessive?.length ?? 0;
						totalGoalEdges = parsed.totalGoalEdges ?? 0;
					}

					return {
						userId: lm.userId,
						userName: lm.userName,
						learnerMapId: lm.id,
						status: lm.status,
						score: lm.score,
						attempt: lm.attempt,
						submittedAt: lm.submittedAt?.getTime() ?? null,
						correct,
						missing,
						excessive,
						totalGoalEdges,
					} as LearnerAnalytics;
				});

			const finalLearners = yield* Effect.all(
				Array.from(lastAttempts.entries()).map(getLearnerAnalytics),
				{ concurrency: "unbounded" },
			);

			const scores = finalLearners
				.map((l) => l.score)
				.filter((s): s is number => s !== null);

			const summary = {
				totalLearners: finalLearners.length,
				submittedCount: finalLearners.filter((l) => l.status === "submitted")
					.length,
				draftCount: finalLearners.filter((l) => l.status === "draft").length,
				avgScore:
					scores.length > 0
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null,
				medianScore:
					scores.length > 0
						? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
						: null,
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
					createdAt: assignment.createdAt?.getTime() ?? 0,
					dueAt: assignment.dueAt?.getTime() ?? null,
				},
				goalMap: {
					id: goalMap.id,
					title: goalMap.title,
					nodes: parsedGoalMapNodes,
					edges: parsedGoalMapEdges,
					direction: goalMap.direction as "bi" | "uni" | "multi",
				},
				learners: finalLearners,
				summary,
			};
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getAnalyticsForAssignment"),
			Effect.catchTags({
				AssignmentNotFoundError: () =>
					Effect.succeed({
						success: false,
						error: "Assignment not found",
					} as const),
				GoalMapNotFoundError: () =>
					Effect.succeed({
						success: false,
						error: "Goal map not found",
					} as const),
				UnknownException: () =>
					Effect.succeed({
						success: false,
						error: "Unknown error",
					} as const),
			}),
			Effect.runPromise,
		);
	});

export const getLearnerMapForAnalytics = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetLearnerMapForAnalyticsSchema)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			const learnerMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						userId: learnerMaps.userId,
						goalMapId: learnerMaps.goalMapId,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						submittedAt: learnerMaps.submittedAt,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						userName: usersTable.name,
					})
					.from(learnerMaps)
					.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
					.where(eq(learnerMaps.id, data.learnerMapId))
					.get(),
			);

			if (!learnerMap) {
				return yield* Effect.fail(
					new LearnerMapNotFoundError({ learnerMapId: data.learnerMapId }),
				);
			}

			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: goalMaps.id,
						title: goalMaps.title,
						nodes: goalMaps.nodes,
						edges: goalMaps.edges,
						direction: goalMaps.direction,
					})
					.from(goalMaps)
					.where(eq(goalMaps.id, learnerMap.goalMapId))
					.get(),
			);

			if (!goalMap) {
				return yield* Effect.fail(
					new GoalMapNotFoundError({ goalMapId: learnerMap.goalMapId }),
				);
			}

			const parsedGoalMapNodes = yield* parseJson(
				goalMap.nodes,
				Schema.Array(NodeSchema),
			);
			const parsedGoalMapEdges = yield* parseJson(
				goalMap.edges,
				Schema.Array(EdgeSchema),
			);

			const parsedLearnerMapNodes = yield* parseJson(
				learnerMap.nodes,
				Schema.Array(NodeSchema),
			);
			const parsedLearnerMapEdges = yield* parseJson(
				learnerMap.edges,
				Schema.Array(EdgeSchema),
			);

			const diagnosis = compareMaps(parsedGoalMapEdges, parsedLearnerMapEdges);
			const edgeClassifications = classifyEdges(
				parsedGoalMapEdges,
				parsedLearnerMapEdges,
			);

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
					direction: goalMap.direction as "bi" | "uni" | "multi",
				},
				diagnosis,
				edgeClassifications,
			};
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.runPromise,
		);
	});

export const exportAnalyticsData = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ExportAnalyticsSchema)(raw))
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		const analyticsResult = (await getAnalyticsForAssignment({
			data,
		})) as AssignmentAnalytics;

		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "")
			.substring(0, 15);

		if (data.format === "csv") {
			const csvData = [
				[
					"UserID",
					"UserName",
					"LearnerMapID",
					"Status",
					"Attempt",
					"Score",
					"Correct",
					"Missing",
					"Excessive",
					"TotalGoalEdges",
					"SubmittedAt",
					"AssignmentTitle",
				],
			];

			for (const learner of analyticsResult.learners) {
				csvData.push([
					learner.userId,
					learner.userName,
					learner.learnerMapId,
					learner.status,
					learner.attempt.toString(),
					learner.score?.toString() ?? "0",
					learner.correct.toString(),
					learner.missing.toString(),
					learner.excessive.toString(),
					learner.totalGoalEdges.toString(),
					learner.submittedAt
						? new Date(learner.submittedAt).toISOString()
						: "",
					analyticsResult.assignment.title,
				]);
			}

			const csv = Papa.unparse(csvData, { header: false });

			return {
				filename: `KB-Analytics-${timestamp}.csv`,
				data: csv,
				contentType: "text/csv" as const,
			};
		}

		const jsonData = {
			assignment: analyticsResult.assignment,
			goalMap: analyticsResult.goalMap,
			learners: analyticsResult.learners,
			summary: analyticsResult.summary,
			exportedAt: new Date().toISOString(),
		};

		return {
			filename: `KB-Analytics-${timestamp}.json`,
			data: JSON.stringify(jsonData, null, 2),
			contentType: "application/json" as const,
		};
	});

export const AnalyticsRpc = {
	analytics: () => ["analytics"],

	getTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "assignments"],
			queryFn: () => getTeacherAssignmentsForAnalytics(),
		}),

	getAnalyticsForAssignment: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), assignmentId, "data"],
			queryFn: () => getAnalyticsForAssignment({ data: { assignmentId } }),
		}),

	getLearnerMapForAnalytics: (learnerMapId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), learnerMapId, "details"],
			queryFn: () => getLearnerMapForAnalytics({ data: { learnerMapId } }),
		}),

	exportAnalyticsData: (assignmentId: string, format: "csv" | "json") =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), assignmentId, "export", format],
			queryFn: () => exportAnalyticsData({ data: { assignmentId, format } }),
		}),
};
