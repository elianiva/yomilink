import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { Data, Effect, Layer, Schema } from "effect";
import Papa from "papaparse";
import {
	classifyEdges,
	compareMaps,
	type DiagnosisResult,
	type EdgeClassification,
	EdgeSchema,
	NodeSchema,
} from "@/features/learner-map/lib/comparator";
import { requireTeacher } from "@/lib/auth-authorization";
import { parseJson } from "@/lib/utils";
import { authMiddleware } from "@/middlewares/auth";
import {
	assignments,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { user as usersTable } from "@/server/db/schema/auth-schema";
import { Database, DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError, rpcErrorResponses } from "./handler";

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
	.handler(async () => {
		return Effect.gen(function* () {
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
					submissionCount: db.$count(learnerMaps.id),
					avgScore: sql<number>`AVG(${diagnoses.score})`,
				})
				.from(assignments)
				.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
				.leftJoin(kits, eq(assignments.kitId, kits.id))
				.leftJoin(learnerMaps, eq(learnerMaps.assignmentId, assignments.id))
				.leftJoin(diagnoses, eq(diagnoses.goalMapId, assignments.goalMapId))
				.where(eq(assignments.createdBy, user.id))
				.groupBy(
					assignments.id,
					goalMaps.title,
					kits.id,
					assignments.createdAt,
					assignments.dueAt,
				)
				.orderBy(desc(assignments.createdAt));

			const result = assignmentsWithStats.map((row) => ({
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

			return result as TeacherAssignment[];
		}).pipe(
			Effect.tapError(logRpcError("getTeacherAssignmentsForAnalytics")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
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
		return Effect.gen(function* () {
			const db = yield* Database;

			// Verify user is a teacher
			yield* requireTeacher(context.user.id);

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
				.where(
					and(
						eq(assignments.id, data.assignmentId),
						eq(assignments.createdBy, user.id),
					),
				)
				.limit(1);

			const assignment = assignmentRows[0];
			if (!assignment) {
				return yield* Effect.fail(
					new AssignmentNotFoundError({ assignmentId: data.assignmentId }),
				);
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

			const learnerMapsData = yield* db
				.select({
					id: learnerMaps.id,
					userId: learnerMaps.userId,
					status: learnerMaps.status,
					attempt: learnerMaps.attempt,
					submittedAt: learnerMaps.submittedAt,
					score: diagnoses.score,
					perLink: diagnoses.perLink,
					userName: usersTable.name,
				})
				.from(learnerMaps)
				.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
				.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
				.where(eq(learnerMaps.assignmentId, data.assignmentId))
				.orderBy(desc(learnerMaps.attempt), desc(learnerMaps.updatedAt));

			const finalLearners = yield* Effect.all(
				learnerMapsData.map((lm) =>
					Effect.gen(function* () {
						let correct = 0;
						let missing = 0;
						let excessive = 0;
						let totalGoalEdges = 0;

						if (lm.perLink) {
							const parsed = yield* parseJson(
								lm.perLink,
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
					}),
				),
				{ concurrency: 10 },
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
			Effect.tapError(logRpcError("getAnalyticsForAssignment")),
			Effect.catchTags({
				ForbiddenError: rpcErrorResponses.ForbiddenError,
				AssignmentNotFoundError: (e) =>
					Effect.succeed({
						success: false,
						error: `Assignment not found: ${e.assignmentId}`,
					} as const),
				GoalMapNotFoundError: (e) =>
					Effect.succeed({
						success: false,
						error: `Goal map not found: ${e.goalMapId}`,
					} as const),
				ParseJsonError: rpcErrorResponses.ParseError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAnalyticsForAssignment"),
			Effect.runPromise,
		);
	});

export const getLearnerMapForAnalytics = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetLearnerMapForAnalyticsSchema)(raw),
	)
	.handler(async ({ data }) => {
		return Effect.gen(function* () {
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
					userName: usersTable.name,
				})
				.from(learnerMaps)
				.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
				.where(eq(learnerMaps.id, data.learnerMapId))
				.limit(1);

			const learnerMap = learnerMapRows[0];
			if (!learnerMap) {
				return yield* Effect.fail(
					new LearnerMapNotFoundError({ learnerMapId: data.learnerMapId }),
				);
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

			const parsedLearnerMapNodes = Array.isArray(learnerMap.nodes)
				? learnerMap.nodes
				: [];
			const parsedLearnerMapEdges = Array.isArray(learnerMap.edges)
				? learnerMap.edges
				: [];

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
			Effect.tapError(logRpcError("getLearnerMapForAnalytics")),
			Effect.catchTags({
				LearnerMapNotFoundError: (e) =>
					Effect.succeed({
						success: false,
						error: `Learner map not found: ${e.learnerMapId}`,
					} as const),
				GoalMapNotFoundError: (e) =>
					Effect.succeed({
						success: false,
						error: `Goal map not found: ${e.goalMapId}`,
					} as const),
				ParseJsonError: rpcErrorResponses.ParseError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.runPromise,
		);
	});

export const exportAnalyticsData = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ExportAnalyticsSchema)(raw))
	.handler(async ({ data }) => {
		const analyticsResult = await getAnalyticsForAssignment({
			data,
		});

		if (!analyticsResult || !("learners" in analyticsResult)) {
			return {
				filename: "KB-Analytics.csv",
				data: "",
				contentType: "text/csv" as const,
			};
		}

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

			const learners = analyticsResult.learners as LearnerAnalytics[];
			const assignment = (
				analyticsResult as unknown as {
					assignment: { title: string };
				}
			).assignment;

			for (const learner of learners) {
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
					assignment.title,
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
			assignment: (analyticsResult as unknown as AssignmentAnalytics)
				.assignment,
			goalMap: (analyticsResult as unknown as AssignmentAnalytics).goalMap,
			learners: analyticsResult.learners,
			summary: (analyticsResult as unknown as AssignmentAnalytics).summary,
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
