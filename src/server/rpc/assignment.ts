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
	SaveExperimentGroupsInput,
	saveExperimentGroups,
	getExperimentGroupsByAssignmentId,
	getAssignmentByPreTestFormId,
	getExperimentCondition,
	DeleteAssignmentInput,
} from "@/features/assignment/lib/assignment-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const createAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateAssignmentInput)(raw))
	.handler(({ data, context }) =>
		createAssignment(context.user.id, data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("createAssignment"),
			Effect.tapError(logRpcError("createAssignment")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				KitNotFoundError: () => Rpc.notFound("Kit"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const listTeacherAssignmentsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		listTeacherAssignments(context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listTeacherAssignments"),
			Effect.tapError(logRpcError("listTeacherAssignments")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const deleteAssignmentRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteAssignmentInput)(raw))
	.handler(({ data, context }) =>
		deleteAssignment(context.user.id, data).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("deleteAssignment"),
			Effect.tapError(logRpcError("deleteAssignment")),
			Effect.catchTags({
				AssignmentNotFoundError: () => Rpc.notFound("Assignment"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAvailableCohortsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableCohorts().pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getAvailableCohorts"),
			Effect.tapError(logRpcError("getAvailableCohorts")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAvailableUsersRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getAvailableUsers().pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getAvailableUsers"),
			Effect.tapError(logRpcError("getAvailableUsers")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getTeacherGoalMapsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		getTeacherGoalMaps().pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getTeacherGoalMaps"),
			Effect.tapError(logRpcError("getTeacherGoalMaps")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const saveExperimentGroupsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveExperimentGroupsInput)(raw))
	.handler(({ data }) =>
		saveExperimentGroups(data).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("saveExperimentGroups"),
			Effect.tapError(logRpcError("saveExperimentGroups")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getExperimentGroupsByAssignmentIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ assignmentId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		getExperimentGroupsByAssignmentId(data.assignmentId).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getExperimentGroupsByAssignmentId"),
			Effect.tapError(logRpcError("getExperimentGroupsByAssignmentId")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getAssignmentByPreTestFormIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ formId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		getAssignmentByPreTestFormId(data.formId).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getAssignmentByPreTestFormId"),
			Effect.tapError(logRpcError("getAssignmentByPreTestFormId")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getExperimentConditionRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ assignmentId: Schema.String }))(raw),
	)
	.handler(({ data, context }) =>
		getExperimentCondition(data.assignmentId, context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getExperimentCondition"),
			Effect.tapError(logRpcError("getExperimentCondition")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
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
	saveExperimentGroups: () =>
		mutationOptions({
			mutationKey: [...AssignmentRpc.assignments(), "saveGroups"],
			mutationFn: (data: SaveExperimentGroupsInput) => saveExperimentGroupsRpc({ data }),
		}),
	getExperimentGroupsByAssignmentId: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "groups", assignmentId],
			queryFn: () => getExperimentGroupsByAssignmentIdRpc({ data: { assignmentId } }),
		}),
	getAssignmentByPreTestFormId: (formId: string) =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "byPreTestForm", formId],
			queryFn: () => getAssignmentByPreTestFormIdRpc({ data: { formId } }),
		}),

	getExperimentCondition: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AssignmentRpc.assignments(), "condition", assignmentId],
			queryFn: () => getExperimentConditionRpc({ data: { assignmentId } }),
		}),
};
