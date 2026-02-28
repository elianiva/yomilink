import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

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
import { authMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const listStudentAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		Effect.gen(function* () {
			const rows = yield* listStudentAssignments(context.user.id);
			return yield* Rpc.ok(rows);
		}).pipe(
			Effect.withSpan("listStudentAssignments"),
			Effect.tapError(logRpcError("listStudentAssignments")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAssignmentForStudentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetAssignmentForStudentInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* getAssignmentForStudent(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getAssignmentForStudent"),
			Effect.tapError(logRpcError("getAssignmentForStudent")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const saveLearnerMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			yield* saveLearnerMap(context.user.id, data);
			return yield* Rpc.ok(true);
		}).pipe(
			Effect.withSpan("saveLearnerMap"),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const submitLearnerMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* submitLearnerMap(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("submitLearnerMap"),
			Effect.tapError(logRpcError("submitLearnerMap")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getDiagnosisRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetDiagnosisInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* getDiagnosis(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getDiagnosis"),
			Effect.tapError(logRpcError("getDiagnosis")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const startNewAttemptRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(StartNewAttemptInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* startNewAttempt(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("startNewAttempt"),
			Effect.tapError(logRpcError("startNewAttempt")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getPeerStatsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetPeerStatsInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* getPeerStats(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getPeerStats"),
			Effect.tapError(logRpcError("getPeerStats")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const submitControlTextRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitControlTextInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			yield* submitControlText(context.user.id, data);
			return yield* Rpc.ok(true);
		}).pipe(
			Effect.withSpan("submitControlText"),
			Effect.tapError(logRpcError("submitControlText")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
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
			mutationFn: (data: SubmitLearnerMapInput) => submitLearnerMapRpc({ data }),
		}),
	getDiagnosis: (data: GetDiagnosisInput) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), data.assignmentId, "diagnosis"],
			queryFn: () => getDiagnosisRpc({ data }),
		}),
	startNewAttempt: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "new-attempt"],
			mutationFn: (data: StartNewAttemptInput) => startNewAttemptRpc({ data }),
		}),
	getPeerStats: (data: GetPeerStatsInput) =>
		queryOptions({
			queryKey: [...LearnerMapRpc.learnerMaps(), data.assignmentId, "peer-stats"],
			queryFn: () => getPeerStatsRpc({ data }),
		}),
	submitControlText: () =>
		mutationOptions({
			mutationKey: [...LearnerMapRpc.learnerMaps(), "submit-control-text"],
			mutationFn: (data: SubmitControlTextInput) => submitControlTextRpc({ data }),
		}),
};
