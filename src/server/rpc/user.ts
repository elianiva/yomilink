import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	BanUserInput,
	BulkCohortAssignInput,
	listUsers,
	getUserById,
	updateUser,
	updateUserRole,
	banUser,
	unbanUser,
	bulkAssignCohort,
	triggerPasswordReset,
	UpdateUserInput,
	UpdateRoleInput,
	UserFilterInput,
} from "@/features/user/lib/user-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

// === List Users ===

export const listUsersRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UserFilterInput)(raw))
	.handler(({ data }) =>
		listUsers(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listUsers"),
			Effect.tapError(logRpcError("listUsers")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Get User By ID ===

export const getUserByIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ userId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		getUserById(data.userId).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getUserById"),
			Effect.tapError(logRpcError("getUserById")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Update User ===

export const updateUserRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(
			Schema.Struct({
				userId: Schema.String,
				data: UpdateUserInput,
			}),
		)(raw),
	)
	.handler(({ data, context }) =>
		updateUser(context.user.id, data.userId, data.data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("updateUser"),
			Effect.tapError(logRpcError("updateUser")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Update User Role (Admin only) ===

export const updateUserRoleRpc = createServerFn()
	.middleware([requireRoleMiddleware("admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateRoleInput)(raw))
	.handler(({ data, context }) =>
		updateUserRole(context.user.id, data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("updateUserRole"),
			Effect.tapError(logRpcError("updateUserRole")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
				CannotModifySelfError: (e) => Rpc.err(e.message),
				LastAdminError: (e) => Rpc.err(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Ban User (Admin only) ===

export const banUserRpc = createServerFn()
	.middleware([requireRoleMiddleware("admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(BanUserInput)(raw))
	.handler(({ data, context }) =>
		banUser(context.user.id, data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("banUser"),
			Effect.tapError(logRpcError("banUser")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
				CannotModifySelfError: (e) => Rpc.err(e.message),
				LastAdminError: (e) => Rpc.err(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Unban User (Admin only) ===

export const unbanUserRpc = createServerFn()
	.middleware([requireRoleMiddleware("admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ userId: Schema.String }))(raw),
	)
	.handler(({ data, context }) =>
		unbanUser(context.user.id, data.userId).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("unbanUser"),
			Effect.tapError(logRpcError("unbanUser")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
				CannotModifySelfError: (e) => Rpc.err(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Bulk Assign Cohort ===

export const bulkAssignCohortRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(BulkCohortAssignInput)(raw))
	.handler(({ data }) =>
		bulkAssignCohort(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("bulkAssignCohort"),
			Effect.tapError(logRpcError("bulkAssignCohort")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === Trigger Password Reset (Admin only) ===

export const triggerPasswordResetRpc = createServerFn()
	.middleware([requireRoleMiddleware("admin")])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(Schema.Struct({ userId: Schema.String }))(raw),
	)
	.handler(({ data }) =>
		triggerPasswordReset(data.userId).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("triggerPasswordReset"),
			Effect.tapError(logRpcError("triggerPasswordReset")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

// === RPC Query Options ===

export const UserRpc = {
	users: () => ["users"],
	listUsers: (filters: Partial<UserFilterInput> = {}) =>
		queryOptions({
			queryKey: [...UserRpc.users(), "list", filters],
			queryFn: () => listUsersRpc({ data: { page: 1, pageSize: 20, ...filters } }),
		}),
	getUserById: (userId: string) =>
		queryOptions({
			queryKey: [...UserRpc.users(), userId],
			queryFn: () => getUserByIdRpc({ data: { userId } }),
		}),
	updateUser: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "update"],
			mutationFn: (data: { userId: string; data: UpdateUserInput }) =>
				updateUserRpc({ data }),
		}),
	updateUserRole: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "updateRole"],
			mutationFn: (data: UpdateRoleInput) => updateUserRoleRpc({ data }),
		}),
	banUser: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "ban"],
			mutationFn: (data: BanUserInput) => banUserRpc({ data }),
		}),
	unbanUser: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "unban"],
			mutationFn: (data: { userId: string }) => unbanUserRpc({ data }),
		}),
	bulkAssignCohort: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "bulkCohort"],
			mutationFn: (data: BulkCohortAssignInput) => bulkAssignCohortRpc({ data }),
		}),
	triggerPasswordReset: () =>
		mutationOptions({
			mutationKey: [...UserRpc.users(), "passwordReset"],
			mutationFn: (data: { userId: string }) => triggerPasswordResetRpc({ data }),
		}),
};
