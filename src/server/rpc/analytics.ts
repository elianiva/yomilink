import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import {
	getTeacherAssignments,
	getAnalyticsForAssignment,
	getLearnerMapForAnalytics,
	exportAnalyticsData,
	GetAnalyticsForAssignmentInput,
	GetLearnerMapForAnalyticsInput,
	ExportAnalyticsDataInput,
} from "@/features/analyzer/lib/analytics-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const getTeacherAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		getTeacherAssignments(context.user.id).pipe(
			Effect.tapError(logRpcError("getTeacherAssignments")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getTeacherAssignments"),
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
			Effect.tapError(logRpcError("getAnalyticsForAssignment")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAnalyticsForAssignment"),
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
			Effect.tapError(logRpcError("getLearnerMapForAnalytics")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.runPromise,
		),
	);

export const exportAnalyticsDataRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(ExportAnalyticsDataInput)(raw),
	)
	.handler(({ data }) =>
		Effect.succeed(exportAnalyticsData(data)).pipe(
			Effect.tapError(logRpcError("exportAnalyticsData")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("exportAnalyticsData"),
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
	exportAnalyticsData: () =>
		mutationOptions({
			mutationKey: [...AnalyticsRpc.analytics(), "export"],
			mutationFn: (data: ExportAnalyticsDataInput) =>
				exportAnalyticsDataRpc({ data }),
		}),
};
