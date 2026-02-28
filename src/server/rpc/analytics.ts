import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

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

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const getTeacherAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		Effect.gen(function* () {
			const rows = yield* getTeacherAssignments(context.user.id);
			return yield* Rpc.ok(rows);
		}).pipe(
			Effect.withSpan("getTeacherAssignments"),
			Effect.tapError(logRpcError("getTeacherAssignments")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAnalyticsForAssignmentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetAnalyticsForAssignmentInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* getAnalyticsForAssignment(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getAnalyticsForAssignment"),
			Effect.tapError(logRpcError("getAnalyticsForAssignment")),
			Effect.catchTags({
				AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
				GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getLearnerMapForAnalyticsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetLearnerMapForAnalyticsInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* getLearnerMapForAnalytics(data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.tapError(logRpcError("getLearnerMapForAnalytics")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				LearnerMapNotFoundError: () => Rpc.notFound("Learner map"),
				GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getMultipleLearnerMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetMultipleLearnerMapsInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* getMultipleLearnerMaps(data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getMultipleLearnerMaps"),
			Effect.tapError(logRpcError("getMultipleLearnerMaps")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const exportAnalyticsDataRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ExportAnalyticsDataInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* exportAnalyticsData(data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("exportAnalyticsData"),
			Effect.tapError(logRpcError("exportAnalyticsData")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
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
			mutationFn: (data: ExportAnalyticsDataInput) => exportAnalyticsDataRpc({ data }),
		}),
};
