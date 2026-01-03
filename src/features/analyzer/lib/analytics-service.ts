import { and, avg, count, desc, eq } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";
import Papa from "papaparse";
import {
	classifyEdges,
	compareMaps,
	EdgeSchema,
	NodeSchema,
} from "@/features/learner-map/lib/comparator";
import { parseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	assignments,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";

export const GetAnalyticsForAssignmentInput = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export type GetAnalyticsForAssignmentInput =
	typeof GetAnalyticsForAssignmentInput.Type;

export const GetLearnerMapForAnalyticsInput = Schema.Struct({
	learnerMapId: Schema.NonEmptyString,
});

export type GetLearnerMapForAnalyticsInput =
	typeof GetLearnerMapForAnalyticsInput.Type;

export const GetMultipleLearnerMapsInput = Schema.Struct({
	learnerMapIds: Schema.Array(Schema.NonEmptyString),
});

export type GetMultipleLearnerMapsInput =
	typeof GetMultipleLearnerMapsInput.Type;

export const MapStatusSchema = Schema.Union(
	Schema.Literal("draft"),
	Schema.Literal("submitted"),
	Schema.Literal("graded"),
);

export const ExportAnalyticsDataInput = Schema.Struct({
	analytics: Schema.Any,
	format: Schema.Union(Schema.Literal("csv"), Schema.Literal("json")),
});

export type ExportAnalyticsDataInput = typeof ExportAnalyticsDataInput.Type;

export const LinkSchema = Schema.Struct({
	source: Schema.String,
	target: Schema.String,
});

export type Link = typeof LinkSchema.Type;

export const PerLinkDiagnosisSchema = Schema.Struct({
	correct: Schema.optional(Schema.Array(LinkSchema)),
	missing: Schema.optional(Schema.Array(LinkSchema)),
	excessive: Schema.optional(Schema.Array(LinkSchema)),
	totalGoalEdges: Schema.optional(Schema.Number),
});

export type PerLinkDiagnosis = typeof PerLinkDiagnosisSchema.Type;

export type LearnerMapResult = Awaited<
	Effect.Effect.Success<ReturnType<typeof getLearnerMapForAnalytics>>
>;

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

export const TeacherAssignmentSchema = Schema.Struct({
	id: Schema.String,
	title: Schema.String,
	goalMapId: Schema.String,
	goalMapTitle: Schema.optional(Schema.String),
	kitId: Schema.optional(Schema.String),
	totalSubmissions: Schema.Number,
	avgScore: Schema.optional(Schema.Number),
	createdAt: Schema.Number,
	dueAt: Schema.optional(Schema.Number),
});

export type TeacherAssignment = typeof TeacherAssignmentSchema.Type;

export const LearnerAnalyticsSchema = Schema.Struct({
	userId: Schema.String,
	userName: Schema.String,
	learnerMapId: Schema.String,
	status: MapStatusSchema,
	score: Schema.NullOr(Schema.Number),
	attempt: Schema.Number,
	submittedAt: Schema.NullOr(Schema.Number),
	correct: Schema.Number,
	missing: Schema.Number,
	excessive: Schema.Number,
	totalGoalEdges: Schema.Number,
});

export type LearnerAnalytics = typeof LearnerAnalyticsSchema.Type;

export const GoalMapDirectionSchema = Schema.Union(
	Schema.Literal("bi"),
	Schema.Literal("uni"),
	Schema.Literal("multi"),
);

export const GoalMapSchema = Schema.Struct({
	id: Schema.String,
	title: Schema.String,
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
	direction: GoalMapDirectionSchema,
});

export const AssignmentSummarySchema = Schema.Struct({
	totalLearners: Schema.Number,
	submittedCount: Schema.Number,
	draftCount: Schema.Number,
	avgScore: Schema.optional(Schema.Number),
	medianScore: Schema.optional(Schema.Number),
	highestScore: Schema.optional(Schema.Number),
	lowestScore: Schema.optional(Schema.Number),
});

export const AssignmentAnalyticsSchema = Schema.Struct({
	assignment: TeacherAssignmentSchema,
	goalMap: GoalMapSchema,
	learners: Schema.Array(LearnerAnalyticsSchema),
	summary: AssignmentSummarySchema,
});

export type AssignmentAnalytics = typeof AssignmentAnalyticsSchema.Type;

export const LearnerMapSchema = Schema.Struct({
	id: Schema.String,
	userId: Schema.String,
	userName: Schema.String,
	status: MapStatusSchema,
	attempt: Schema.Number,
	submittedAt: Schema.optional(Schema.Number),
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
});

export const DiagnosisResultSchema = Schema.Struct({
	correct: Schema.optional(Schema.Array(LinkSchema)),
	missing: Schema.optional(Schema.Array(LinkSchema)),
	excessive: Schema.optional(Schema.Array(LinkSchema)),
	totalGoalEdges: Schema.optional(Schema.Number),
});

export const EdgeClassificationSchema = Schema.Struct({
	source: Schema.String,
	target: Schema.String,
	correct: Schema.Boolean,
	missing: Schema.Boolean,
	excessive: Schema.Boolean,
});

export const LearnerMapDetailsSchema = Schema.Struct({
	learnerMap: LearnerMapSchema,
	goalMap: GoalMapSchema,
	diagnosis: DiagnosisResultSchema,
	edgeClassifications: Schema.Array(EdgeClassificationSchema),
});

export type LearnerMapDetails = typeof LearnerMapDetailsSchema.Type;

export const ExportResultSchema = Schema.Struct({
	filename: Schema.String,
	data: Schema.String,
	contentType: Schema.Union(
		Schema.Literal("text/csv"),
		Schema.Literal("application/json"),
	),
});

export type ExportResult = typeof ExportResultSchema.Type;

export const getTeacherAssignments = Effect.fn("getTeacherAssignments")(
	(userId: string) =>
		Effect.gen(function* () {
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
				.groupBy(
					assignments.id,
					goalMaps.title,
					kits.id,
					assignments.createdAt,
					assignments.dueAt,
				)
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
		}),
);

export const getAnalyticsForAssignment = Effect.fn("getAnalyticsForAssignment")(
	(userId: string, input: GetAnalyticsForAssignmentInput) =>
		Effect.gen(function* () {
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
				.where(
					and(
						eq(assignments.id, input.assignmentId),
						eq(assignments.createdBy, userId),
					),
				)
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
					parseJson(goalMap.nodes, Schema.Array(NodeSchema)),
					parseJson(goalMap.edges, Schema.Array(EdgeSchema)),
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
							const parsed = yield* parseJson(
								lm.perLink,
								PerLinkDiagnosisSchema,
							);
							correct = parsed.correct?.length ?? 0;
							missing = parsed.missing?.length ?? 0;
							excessive = parsed.excessive?.length ?? 0;
							totalGoalEdges = parsed.totalGoalEdges ?? 0;
						}

						return yield* Schema.encode(LearnerAnalyticsSchema)({
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
						});
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
					totalSubmissions: summary.submittedCount,
					createdAt: assignment.createdAt?.getTime() ?? 0,
					dueAt: assignment.dueAt?.getTime() ?? null,
				},
				goalMap: {
					id: goalMap.id,
					title: goalMap.title,
					nodes: parsedGoalMapNodes,
					edges: parsedGoalMapEdges,
					direction: yield* Schema.encode(GoalMapDirectionSchema)(
						goalMap.direction,
					),
				},
				learners: finalLearners,
				summary,
			};
		}),
);

export const getLearnerMapForAnalytics = Effect.fn("getLearnerMapForAnalytics")(
	(input: GetLearnerMapForAnalyticsInput) =>
		Effect.gen(function* () {
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

			const [
				parsedGoalMapNodes,
				parsedGoalMapEdges,
				parsedLearnerMapNodes,
				parsedLearnerMapEdges,
			] = yield* Effect.all(
				[
					parseJson(goalMap.nodes, Schema.Array(NodeSchema)),
					parseJson(goalMap.edges, Schema.Array(EdgeSchema)),
					parseJson(learnerMap.nodes, Schema.Array(NodeSchema)),
					parseJson(learnerMap.edges, Schema.Array(EdgeSchema)),
				],
				{ concurrency: "unbounded" },
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
					direction: yield* Schema.encode(GoalMapDirectionSchema)(
						goalMap.direction,
					),
				},
				diagnosis,
				edgeClassifications,
			};
		}),
);

export const getMultipleLearnerMaps = Effect.fn("getMultipleLearnerMaps")(
	(input: GetMultipleLearnerMapsInput) =>
		Effect.gen(function* () {
			if (input.learnerMapIds.length === 0) {
				return [];
			}

			const results = yield* Effect.all(
				input.learnerMapIds.map((id) =>
					getLearnerMapForAnalytics({ learnerMapId: id }).pipe(
						Effect.catchAll(() => Effect.succeed(null)),
					),
				),
				{ concurrency: 10 },
			);

			return results.filter((r) => r !== null);
		}),
);

export const exportAnalyticsData = Effect.fn("exportAnalyticsData")(
	(input: ExportAnalyticsDataInput) =>
		Effect.gen(function* () {
			const timestamp = new Date()
				.toISOString()
				.replace(/[:.]/g, "")
				.substring(0, 15);

			if (input.format === "csv") {
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

				for (const learner of input.analytics.learners) {
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
						input.analytics.assignment.title,
					]);
				}

				const csv = Papa.unparse(csvData, { header: false });

				return yield* Schema.encode(ExportResultSchema)({
					filename: `KB-Analytics-${timestamp}.csv`,
					data: csv,
					contentType: "text/csv",
				});
			}

			const jsonData = {
				assignment: input.analytics.assignment,
				goalMap: input.analytics.goalMap,
				learners: input.analytics.learners,
				summary: input.analytics.summary,
				exportedAt: new Date().toISOString(),
			};

			return yield* Schema.encode(ExportResultSchema)({
				filename: `KB-Analytics-${timestamp}.json`,
				data: JSON.stringify(jsonData, null, 2),
				contentType: "application/json",
			});
		}),
);
