import { Data, Schema } from "effect";

import { EdgeSchema, NodeSchema } from "@/features/learner-map/lib/comparator";
import { NonEmpty } from "@/lib/validation-schemas";

export const GetAnalyticsForAssignmentInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetAnalyticsForAssignmentInput = typeof GetAnalyticsForAssignmentInput.Type;

export const GetLearnerMapForAnalyticsInput = Schema.Struct({
	learnerMapId: NonEmpty("Learner map ID"),
});

export type GetLearnerMapForAnalyticsInput = typeof GetLearnerMapForAnalyticsInput.Type;

export const GetMultipleLearnerMapsInput = Schema.Struct({
	learnerMapIds: Schema.Array(NonEmpty("Learner map ID")),
});

export type GetMultipleLearnerMapsInput = typeof GetMultipleLearnerMapsInput.Type;

export const GetLearnerSummaryTextInput = Schema.Struct({
	learnerMapId: NonEmpty("Learner map ID"),
});

export type GetLearnerSummaryTextInput = typeof GetLearnerSummaryTextInput.Type;

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

class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

class LearnerMapNotFoundError extends Data.TaggedError("LearnerMapNotFoundError")<{
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
	dueAt: Schema.NullOr(Schema.Number),
});

export type TeacherAssignment = typeof TeacherAssignmentSchema.Type;

export const LearnerAnalyticsSchema = Schema.Struct({
	userId: Schema.String,
	userName: Schema.String,
	learnerMapId: Schema.String,
	condition: Schema.optional(
		Schema.Union(Schema.Literal("concept_map"), Schema.Literal("summarizing")),
	),
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
	avgScore: Schema.NullOr(Schema.Number),
	medianScore: Schema.NullOr(Schema.Number),
	highestScore: Schema.NullOr(Schema.Number),
	lowestScore: Schema.NullOr(Schema.Number),
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
	edge: EdgeSchema,
	type: Schema.Union(
		Schema.Literal("correct"),
		Schema.Literal("missing"),
		Schema.Literal("excessive"),
		Schema.Literal("neutral"),
	),
});

export const LearnerMapDetailsSchema = Schema.Struct({
	learnerMap: LearnerMapSchema,
	goalMap: GoalMapSchema,
	diagnosis: DiagnosisResultSchema,
	edgeClassifications: Schema.Array(EdgeClassificationSchema),
});

export type LearnerMapDetails = typeof LearnerMapDetailsSchema.Type;

export const LearnerSummaryTextSchema = Schema.Struct({
	learnerMapId: Schema.String,
	learnerId: Schema.String,
	learnerName: Schema.String,
	status: MapStatusSchema,
	submittedAt: Schema.NullOr(Schema.Number),
	controlText: Schema.NullOr(Schema.String),
});

export type LearnerSummaryText = typeof LearnerSummaryTextSchema.Type;

export const ExportResultSchema = Schema.Struct({
	filename: Schema.String,
	data: Schema.String,
	contentType: Schema.Union(Schema.Literal("text/csv"), Schema.Literal("application/json")),
});

export type ExportResult = typeof ExportResultSchema.Type;

export {
	AssignmentNotFoundError,
	GoalMapNotFoundError,
	LearnerMapNotFoundError,
};
