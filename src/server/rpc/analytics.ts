import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import {
	ExportAnalyticsDataInput,
	exportAnalyticsData,
	GetAnalyticsForAssignmentInput,
	GetLearnerMapForAnalyticsInput,
	GetMultipleLearnerMapsInput,
	getAnalyticsForAssignment,
	getLearnerMapForAnalytics,
	getMultipleLearnerMaps,
	getTeacherAssignments,
} from "@/features/analyzer/lib/analytics-service";
import { authMiddleware } from "@/middlewares/auth";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { ServerTelemetry } from "../telemetry";
import { errorResponse, logRpcError } from "../rpc-helper";

export const getTeacherAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		getTeacherAssignments(context.user.id).pipe(
			Effect.withSpan("getTeacherAssignments"),
			Effect.tapError(logRpcError("getTeacherAssignments")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry)),
			Effect.runPromise,
		),
	);

export const getAnalyticsForAssignmentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetAnalyticsForAssignmentInput)(raw),
	)
	.handler(({ data, context }) =>
		getAnalyticsForAssignment(context.user.id, data).pipe(
			Effect.withSpan("getAnalyticsForAssignment"),
			Effect.tapError(logRpcError("getAnalyticsForAssignment")),
			Effect.catchTags({
				AssignmentNotFoundError: (e) =>
					errorResponse(`Assignment not found: ${e.assignmentId}`),
				GoalMapNotFoundError: (e) =>
					errorResponse(`Goal map not found: ${e.goalMapId}`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry)),
			Effect.runPromise,
		),
	);

export const getLearnerMapForAnalyticsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetLearnerMapForAnalyticsInput)(raw),
	)
	.handler(({ data }) =>
		getLearnerMapForAnalytics(data).pipe(
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.tapError(logRpcError("getLearnerMapForAnalytics")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry)),
			Effect.catchTags({
				LearnerMapNotFoundError: (e) =>
					errorResponse(`Learner map not found: ${e.learnerMapId}`),
				GoalMapNotFoundError: (e) =>
					errorResponse(`Goal map not found: ${e.goalMapId}`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.runPromise,
		),
	);

export const getMultipleLearnerMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetMultipleLearnerMapsInput)(raw),
	)
	.handler(({ data }) =>
		getMultipleLearnerMaps(data).pipe(
			Effect.withSpan("getMultipleLearnerMaps"),
			Effect.tapError(logRpcError("getMultipleLearnerMaps")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry)),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.runPromise,
		),
	);

export const exportAnalyticsDataRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(ExportAnalyticsDataInput)(raw),
	)
	.handler(({ data }) =>
		exportAnalyticsData(data).pipe(
			Effect.withSpan("exportAnalyticsData"),
			Effect.tapError(logRpcError("exportAnalyticsData")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry)),
			Effect.runPromise,
		),
	);

export const AnalyticsRpc = {
	analytics: () => ["analytics"],
	getTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "assignments"],
			queryFn: () => getTeacherAssignmentsRpc(),
		}),
	getAnalyticsForAssignment: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), assignmentId],
			queryFn: () => getAnalyticsForAssignmentRpc({ data: { assignmentId } }),
		}),
	getLearnerMapForAnalytics: (learnerMapId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "learner-map", learnerMapId],
			queryFn: () => getLearnerMapForAnalyticsRpc({ data: { learnerMapId } }),
		}),
	getMultipleLearnerMaps: (learnerMapIds: string[]) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "learner-maps", ...learnerMapIds],
			queryFn: () => getMultipleLearnerMapsRpc({ data: { learnerMapIds } }),
		}),
	exportAnalyticsData: () =>
		mutationOptions({
			mutationKey: [...AnalyticsRpc.analytics(), "export"],
			mutationFn: (data: ExportAnalyticsDataInput) =>
				exportAnalyticsDataRpc({ data }),
		}),
};
