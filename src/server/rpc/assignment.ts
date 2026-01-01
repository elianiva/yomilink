import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { requireRoleMiddleware } from "@/middlewares/auth";
import {
	createAssignment,
	listTeacherAssignments,
	deleteAssignment,
	getAvailableCohorts,
	getAvailableUsers,
	getTeacherGoalMaps,
	CreateAssignmentInput,
	DeleteAssignmentInput,
} from "@/features/assignment/lib/assignment-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const createAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateAssignmentInput)(raw))
	.handler(({ data, context }) =>
		createAssignment(context.user.id, data).pipe(
			Effect.tapError(logRpcError("createAssignment")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("createAssignment"),
			Effect.runPromise,
		),
	);

export const listTeacherAssignmentsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		listTeacherAssignments(context.user.id).pipe(
			Effect.tapError(logRpcError("listTeacherAssignments")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listTeacherAssignments"),
			Effect.runPromise,
		),
	);

export const deleteAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteAssignmentInput)(raw))
	.handler(({ data, context }) =>
		deleteAssignment(context.user.id, data).pipe(
			Effect.tapError(logRpcError("deleteAssignment")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("deleteAssignment"),
			Effect.runPromise,
		),
	);

export const getAvailableCohortsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableCohorts().pipe(
			Effect.tapError(logRpcError("getAvailableCohorts")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAvailableCohorts"),
			Effect.runPromise,
		),
	);

export const getAvailableUsersRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableUsers().pipe(
			Effect.tapError(logRpcError("getAvailableUsers")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getAvailableUsers"),
			Effect.runPromise,
		),
	);

export const getTeacherGoalMapsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getTeacherGoalMaps().pipe(
			Effect.tapError(logRpcError("getTeacherGoalMaps")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getTeacherGoalMaps"),
			Effect.runPromise,
		),
	);

export const AssignmentRpc = {
	assignments: () => ["assignments"],
	createAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "create"],
			mutationFn: (data: CreateAssignmentInput) =>
				createAssignmentRpc({ data }),
		}),
	listTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "list"],
			queryFn: () => listTeacherAssignmentsRpc(),
		}),
	deleteAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "delete"],
			mutationFn: (data: DeleteAssignmentInput) =>
				deleteAssignmentRpc({ data }),
		}),
	getAvailableCohorts: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "cohorts"],
			queryFn: () => getAvailableCohortsRpc(),
		}),
	getAvailableUsers: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "users"],
			queryFn: () => getAvailableUsersRpc(),
		}),
	getTeacherGoalMaps: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "goalmaps"],
			queryFn: () => getTeacherGoalMapsRpc(),
		}),
};
