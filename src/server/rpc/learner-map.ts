import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	saveLearnerMap,
	submitLearnerMap,
	startNewAttempt,
	submitControlText,
} from "@/features/learner-map/lib/learner-map-service.mutations";
import {
	listStudentAssignments,
	getAssignmentForStudent,
	getDiagnosis,
	getPeerStats,
} from "@/features/learner-map/lib/learner-map-service.queries";
import {
	GetAssignmentForStudentInput,
	SaveLearnerMapInput,
	SubmitLearnerMapInput,
	GetDiagnosisInput,
	StartNewAttemptInput,
	GetPeerStatsInput,
	SubmitControlTextInput,
} from "@/features/learner-map/lib/learner-map-service.shared";
import { authMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const listStudentAssignmentsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			listStudentAssignments(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listStudentAssignments"),
				Effect.tapError(logRpcError("listStudentAssignments")),
				Effect.catchAll(logAndReturnError("listStudentAssignments")),
				Effect.catchAllDefect(logAndReturnDefect("listStudentAssignments")),
			),
		),
	);

export const getAssignmentForStudentRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetAssignmentForStudentInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			getAssignmentForStudent(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAssignmentForStudent"),
				Effect.tapError(logRpcError("getAssignmentForStudent")),
				Effect.catchTags({
					AccessDeniedError: () => Rpc.forbidden("Access denied"),
				}),
				Effect.catchAll(logAndReturnError("getAssignmentForStudent")),
				Effect.catchAllDefect(logAndReturnDefect("getAssignmentForStudent")),
			),
		),
	);

export const saveLearnerMapRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			saveLearnerMap(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("saveLearnerMap"),
				Effect.tapError(logRpcError("saveLearnerMap")),
				Effect.catchTags({
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
					AccessDeniedError: () => Rpc.forbidden("Access denied"),
					LearnerMapAlreadySubmittedError: () => Rpc.err("Cannot edit submitted map"),
				}),
				Effect.catchAll(logAndReturnError("saveLearnerMap")),
				Effect.catchAllDefect(logAndReturnDefect("saveLearnerMap")),
			),
		),
	);

export const submitLearnerMapRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitLearnerMapInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			submitLearnerMap(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("submitLearnerMap"),
				Effect.tapError(logRpcError("submitLearnerMap")),
				Effect.catchTags({
					LearnerMapNotFoundError: () => Rpc.notFound("Learner map"),
					LearnerMapAlreadySubmittedError: () => Rpc.err("Already submitted"),
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
					AccessDeniedError: () => Rpc.forbidden("Access denied"),
				}),
				Effect.catchAll(logAndReturnError("submitLearnerMap")),
				Effect.catchAllDefect(logAndReturnDefect("submitLearnerMap")),
			),
		),
	);

export const getDiagnosisRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetDiagnosisInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			getDiagnosis(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getDiagnosis"),
				Effect.tapError(logRpcError("getDiagnosis")),
				Effect.catchAll(logAndReturnError("getDiagnosis")),
				Effect.catchAllDefect(logAndReturnDefect("getDiagnosis")),
			),
		),
	);

export const startNewAttemptRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(StartNewAttemptInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			startNewAttempt(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("startNewAttempt"),
				Effect.tapError(logRpcError("startNewAttempt")),
				Effect.catchTags({
					NoPreviousAttemptError: () => Rpc.err("No previous attempt found"),
					PreviousAttemptNotSubmittedError: () =>
						Rpc.err("Previous attempt not submitted"),
				}),
			),
		),
	);

export const getPeerStatsRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetPeerStatsInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			getPeerStats(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getPeerStats"),
				Effect.tapError(logRpcError("getPeerStats")),
				Effect.catchAll(logAndReturnError("getPeerStats")),
				Effect.catchAllDefect(logAndReturnDefect("getPeerStats")),
			),
		),
	);

export const submitControlTextRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitControlTextInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			submitControlText(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("submitControlText"),
				Effect.tapError(logRpcError("submitControlText")),
				Effect.catchTags({
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
					LearnerMapAlreadySubmittedError: () => Rpc.err("Already submitted"),
					AccessDeniedError: () => Rpc.forbidden("Access denied"),
				}),
				Effect.catchAll(logAndReturnError("submitControlText")),
				Effect.catchAllDefect(logAndReturnDefect("submitControlText")),
			),
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
