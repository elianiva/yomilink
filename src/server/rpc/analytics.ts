import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { exportAnalyticsData } from "@/features/analyzer/lib/analytics-service.mutations";
import {
	getAnalyticsForAssignment,
	getLearnerMapForAnalytics,
	getLearnerSummaryText,
	getMultipleLearnerMaps,
	getTeacherAssignments,
} from "@/features/analyzer/lib/analytics-service.queries";
import {
	ExportAnalyticsDataInput,
	GetAnalyticsForAssignmentInput,
	GetLearnerMapForAnalyticsInput,
	GetLearnerSummaryTextInput,
	GetMultipleLearnerMapsInput,
} from "@/features/analyzer/lib/analytics-service.shared";
import { authMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const getTeacherAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			getTeacherAssignments(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getTeacherAssignments"),
				Effect.tapError(logRpcError("getTeacherAssignments")),
				Effect.catchAll(logAndReturnError("getTeacherAssignments")),
				Effect.catchAllDefect(logAndReturnDefect("getTeacherAssignments")),
			),
		),
	);

export const getAnalyticsForAssignmentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetAnalyticsForAssignmentInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			getAnalyticsForAssignment(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAnalyticsForAssignment"),
				Effect.tapError(logRpcError("getAnalyticsForAssignment")),
				Effect.catchTags({
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
				}),
				Effect.catchAll(logAndReturnError("getAnalyticsForAssignment")),
				Effect.catchAllDefect(logAndReturnDefect("getAnalyticsForAssignment")),
			),
		),
	);

export const getLearnerMapForAnalyticsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetLearnerMapForAnalyticsInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getLearnerMapForAnalytics(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getLearnerMapForAnalytics"),
				Effect.tapError(logRpcError("getLearnerMapForAnalytics")),
				Effect.catchTags({
					LearnerMapNotFoundError: () => Rpc.notFound("Learner map"),
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
				}),
				Effect.catchAll(logAndReturnError("getLearnerMapForAnalytics")),
				Effect.catchAllDefect(logAndReturnDefect("getLearnerMapForAnalytics")),
			),
		),
	);

export const getMultipleLearnerMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetMultipleLearnerMapsInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getMultipleLearnerMaps(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getMultipleLearnerMaps"),
				Effect.tapError(logRpcError("getMultipleLearnerMaps")),
				Effect.catchAll(logAndReturnError("getMultipleLearnerMaps")),
				Effect.catchAllDefect(logAndReturnDefect("getMultipleLearnerMaps")),
			),
		),
	);

export const getLearnerSummaryTextRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetLearnerSummaryTextInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getLearnerSummaryText(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getLearnerSummaryText"),
				Effect.tapError(logRpcError("getLearnerSummaryText")),
				Effect.catchTags({
					LearnerMapNotFoundError: () => Rpc.notFound("Learner map"),
				}),
				Effect.catchAll(logAndReturnError("getLearnerSummaryText")),
				Effect.catchAllDefect(logAndReturnDefect("getLearnerSummaryText")),
			),
		),
	);

export const exportAnalyticsDataRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ExportAnalyticsDataInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			exportAnalyticsData(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("exportAnalyticsData"),
				Effect.tapError(logRpcError("exportAnalyticsData")),
				Effect.catchAll(logAndReturnError("exportAnalyticsData")),
				Effect.catchAllDefect(logAndReturnDefect("exportAnalyticsData")),
			),
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
	getMultipleLearnerMaps: (learnerMapIds: string[]) => {
		const normalizedLearnerMapIds = [...new Set(learnerMapIds)].sort();
		return queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "learner-maps", ...normalizedLearnerMapIds],
			queryFn: () =>
				getMultipleLearnerMapsRpc({ data: { learnerMapIds: normalizedLearnerMapIds } }),
		});
	},
	getLearnerSummaryText: (learnerMapId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "learner-summary", learnerMapId],
			queryFn: () => getLearnerSummaryTextRpc({ data: { learnerMapId } }),
		}),
	exportAnalyticsData: () =>
		mutationOptions({
			mutationKey: [...AnalyticsRpc.analytics(), "export"],
			mutationFn: (data: ExportAnalyticsDataInput) => exportAnalyticsDataRpc({ data }),
		}),
};
