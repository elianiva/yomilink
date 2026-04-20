import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	createAssignment,
	listTeacherAssignments,
	deleteAssignment,
	getAvailableCohorts,
	getAvailableUsers,
	getTeacherGoalMaps,
	CreateAssignmentInput,
	getAssignmentByPreTestFormId,
	DeleteAssignmentInput,
	getAssignmentById,
} from "@/features/assignment/lib/assignment-service.core";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const createAssignmentRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateAssignmentInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			createAssignment(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("createAssignment"),
				Effect.tapError(logRpcError("createAssignment")),
				Effect.catchTags({
					KitNotFoundError: () => Rpc.notFound("Kit"),
				}),
				Effect.catchAll(logAndReturnError("createAssignment")),
				Effect.catchAllDefect(logAndReturnDefect("createAssignment")),
			),
		),
	);

export const listTeacherAssignmentsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			listTeacherAssignments(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listTeacherAssignments"),
				Effect.tapError(logRpcError("listTeacherAssignments")),
				Effect.catchAll(logAndReturnError("listTeacherAssignments")),
				Effect.catchAllDefect(logAndReturnDefect("listTeacherAssignments")),
			),
		),
	);

export const deleteAssignmentRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteAssignmentInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			deleteAssignment(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("deleteAssignment"),
				Effect.tapError(logRpcError("deleteAssignment")),
				Effect.catchTags({
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
				}),
				Effect.catchAll(logAndReturnError("deleteAssignment")),
				Effect.catchAllDefect(logAndReturnDefect("deleteAssignment")),
			),
		),
	);

export const getAvailableCohortsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		AppRuntime.runPromise(
			getAvailableCohorts().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAvailableCohorts"),
				Effect.tapError(logRpcError("getAvailableCohorts")),
				Effect.catchAll(logAndReturnError("getAvailableCohorts")),
				Effect.catchAllDefect(logAndReturnDefect("getAvailableCohorts")),
			),
		),
	);

export const getAvailableUsersRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		AppRuntime.runPromise(
			getAvailableUsers().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAvailableUsers"),
				Effect.tapError(logRpcError("getAvailableUsers")),
				Effect.catchAll(logAndReturnError("getAvailableUsers")),
				Effect.catchAllDefect(logAndReturnDefect("getAvailableUsers")),
			),
		),
	);

export const getTeacherGoalMapsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		AppRuntime.runPromise(
			getTeacherGoalMaps().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getTeacherGoalMaps"),
				Effect.tapError(logRpcError("getTeacherGoalMaps")),
				Effect.catchAll(logAndReturnError("getTeacherGoalMaps")),
				Effect.catchAllDefect(logAndReturnDefect("getTeacherGoalMaps")),
			),
		),
	);

export const getAssignmentByPreTestFormIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ formId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getAssignmentByPreTestFormId(data.formId).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAssignmentByPreTestFormId"),
				Effect.tapError(logRpcError("getAssignmentByPreTestFormId")),
				Effect.catchAll(logAndReturnError("getAssignmentByPreTestFormId")),
				Effect.catchAllDefect(logAndReturnDefect("getAssignmentByPreTestFormId")),
			),
		),
	);

export const getAssignmentByIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ assignmentId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getAssignmentById(data.assignmentId).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getAssignmentById"),
				Effect.tapError(logRpcError("getAssignmentById")),
				Effect.catchTags({
					AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
				}),
				Effect.catchAll(logAndReturnError("getAssignmentById")),
				Effect.catchAllDefect(logAndReturnDefect("getAssignmentById")),
			),
		),
	);

export const AssignmentRpc = {
	assignments: () => ["assignments"],
	createAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "create"],
			mutationFn: (data: CreateAssignmentInput) => createAssignmentRpc({ data }),
		}),
	listTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "list"],
			queryFn: () => listTeacherAssignmentsRpc(),
		}),
	deleteAssignment: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "delete"],
			mutationFn: (data: DeleteAssignmentInput) => deleteAssignmentRpc({ data }),
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
	getAssignmentByPreTestFormId: (formId: string) =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "byPreTestForm", formId],
			queryFn: () => getAssignmentByPreTestFormIdRpc({ data: { formId } }),
		}),
	getAssignmentById: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "byId", assignmentId],
			queryFn: () => getAssignmentByIdRpc({ data: { assignmentId } }),
		}),
};
