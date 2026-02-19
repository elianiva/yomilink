import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import {
	listStudentAssignments,
	getAssignmentForStudent,
	saveLearnerMap,
	submitLearnerMap,
	getDiagnosis,
	startNewAttempt,
	getPeerStats,
	submitControlText,
	GetAssignmentForStudentInput,
	SaveLearnerMapInput,
	SubmitLearnerMapInput,
	GetDiagnosisInput,
	StartNewAttemptInput,
	GetPeerStatsInput,
	SubmitControlTextInput,
} from "@/features/learner-map/lib/learner-map-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { errorResponse, logRpcError } from "../rpc-helper";

export const listStudentAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		listStudentAssignments(context.user.id).pipe(
			Effect.withSpan("listStudentAssignments"),
			Effect.tapError(logRpcError("listStudentAssignments")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const getAssignmentForStudentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetAssignmentForStudentInput)(raw),
	)
	.handler(({ data, context }) =>
		getAssignmentForStudent(context.user.id, data).pipe(
			Effect.withSpan("getAssignmentForStudent"),
			Effect.tapError(logRpcError("getAssignmentForStudent")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const saveLearnerMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		saveLearnerMap(context.user.id, data).pipe(
			Effect.withSpan("saveLearnerMap"),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const submitLearnerMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		submitLearnerMap(context.user.id, data).pipe(
			Effect.withSpan("submitLearnerMap"),
			Effect.tapError(logRpcError("submitLearnerMap")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const getDiagnosisRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetDiagnosisInput)(raw))
	.handler(({ data, context }) =>
		getDiagnosis(context.user.id, data).pipe(
			Effect.withSpan("getDiagnosis"),
			Effect.tapError(logRpcError("getDiagnosis")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const startNewAttemptRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(StartNewAttemptInput)(raw))
	.handler(({ data, context }) =>
		startNewAttempt(context.user.id, data).pipe(
			Effect.withSpan("startNewAttempt"),
			Effect.tapError(logRpcError("startNewAttempt")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const getPeerStatsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetPeerStatsInput)(raw))
	.handler(({ data, context }) =>
		getPeerStats(context.user.id, data).pipe(
			Effect.withSpan("getPeerStats"),
			Effect.tapError(logRpcError("getPeerStats")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const submitControlTextRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(SubmitControlTextInput)(raw),
	)
	.handler(({ data, context }) =>
		submitControlText(context.user.id, data).pipe(
			Effect.withSpan("submitControlText"),
			Effect.tapError(logRpcError("submitControlText")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const LearnerMapRpc = {
	learnerMaps: () => ["learner-maps"],
	listStudentAssignments: () =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), "assignments"],
			queryFn: () => listStudentAssignmentsRpc(),
		}),
	getAssignmentForStudent: (data: GetAssignmentForStudentInput) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), data.assignmentId],
			queryFn: () => getAssignmentForStudentRpc({ data }),
		}),
	saveLearnerMap: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "save"],
			mutationFn: (data: SaveLearnerMapInput) => saveLearnerMapRpc({ data }),
		}),
	submitLearnerMap: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "submit"],
			mutationFn: (data: SubmitLearnerMapInput) =>
				submitLearnerMapRpc({ data }),
		}),
	getDiagnosis: (data: GetDiagnosisInput) =>
		queryOptions({
			queryKey: [
				...LearnerMapRpc.learnerMaps(),
				data.assignmentId,
				"diagnosis",
			],
			queryFn: () => getDiagnosisRpc({ data }),
		}),
	startNewAttempt: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "new-attempt"],
			mutationFn: (data: StartNewAttemptInput) => startNewAttemptRpc({ data }),
		}),
	getPeerStats: (data: GetPeerStatsInput) =>
		queryOptions({
			queryKey: [
				...LearnerMapRpc.learnerMaps(),
				data.assignmentId,
				"peer-stats",
			],
			queryFn: () => getPeerStatsRpc({ data }),
		}),
	submitControlText: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "submit-control-text"],
			mutationFn: (data: SubmitControlTextInput) =>
				submitControlTextRpc({ data }),
		}),
};
