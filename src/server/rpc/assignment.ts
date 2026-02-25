import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
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
import { AppLayer } from "../app-layer";
import { errorResponse, logRpcError } from "../rpc-helper";

export const createAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateAssignmentInput)(raw))
	.handler(({ data, context }) =>
		createAssignment(context.user.id, data).pipe(
			Effect.withSpan("createAssignment"),
			Effect.tapError(logRpcError("createAssignment")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				KitNotFoundError: (e) =>
					errorResponse(`Kit not found for goal map: ${e.goalMapId}`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.runPromise,
		),
	);

export const listTeacherAssignmentsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		listTeacherAssignments(context.user.id).pipe(
			Effect.withSpan("listTeacherAssignments"),
			Effect.tapError(logRpcError("listTeacherAssignments")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const deleteAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteAssignmentInput)(raw))
	.handler(({ data, context }) =>
		deleteAssignment(context.user.id, data).pipe(
			Effect.withSpan("deleteAssignment"),
			Effect.tapError(logRpcError("deleteAssignment")),
			Effect.catchTags({
				AssignmentNotFoundError: (e) =>
					errorResponse(`Assignment not found: ${e.assignmentId}`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAvailableCohortsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableCohorts().pipe(
			Effect.withSpan("getAvailableCohorts"),
			Effect.tapError(logRpcError("getAvailableCohorts")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAvailableUsersRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableUsers().pipe(
			Effect.withSpan("getAvailableUsers"),
			Effect.tapError(logRpcError("getAvailableUsers")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getTeacherGoalMapsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getTeacherGoalMaps().pipe(
			Effect.withSpan("getTeacherGoalMaps"),
			Effect.tapError(logRpcError("getTeacherGoalMaps")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(AppLayer),
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
