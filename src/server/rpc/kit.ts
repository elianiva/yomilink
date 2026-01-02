import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import {
	GenerateKitInput,
	GetKitInput,
	GetKitStatusInput,
	generateKit,
	getKit,
	getKitStatus,
	listStudentKits,
} from "@/features/kit/lib/kit-service";
import { requireRoleMiddleware } from "@/middlewares/auth";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { errorResponse, logRpcError } from "../rpc-helper";

export const listStudentKitsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		listStudentKits().pipe(
			Effect.withSpan("listStudentKits"),
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const getKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitInput)(raw))
	.handler(({ data }) =>
		getKit(data).pipe(
			Effect.withSpan("getKit"),
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const getKitStatusRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitStatusInput)(raw))
	.handler(({ data }) =>
		getKitStatus(data).pipe(
			Effect.withSpan("getKitStatus"),
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const generateKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitInput)(raw))
	.handler(({ data, context }) =>
		generateKit(context.user.id, data).pipe(
			Effect.withSpan("generateKit"),
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchTags({
				GoalMapNotFoundError: (e) =>
					errorResponse(`Goal map ${e.goalMapId} not found`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.runPromise,
		),
	);

export const KitRpc = {
	studentKits: () => ["student-kits"],
	listStudentKits: () =>
		queryOptions({
			queryKey: [...KitRpc.studentKits()],
			queryFn: () => listStudentKitsRpc(),
		}),
	getKit: () =>
		queryOptions({
			queryKey: [...KitRpc.studentKits(), "current"],
			queryFn: () => getKitRpc(),
		}),
	getKitStatus: (goalMapId: string) =>
		queryOptions({
			queryKey: [...KitRpc.studentKits(), goalMapId, "status"],
			queryFn: () => getKitStatusRpc({ data: { goalMapId } }),
		}),
	generateKit: () =>
		mutationOptions({
			mutationKey: [...KitRpc.studentKits()],
			mutationFn: (data: GenerateKitInput) => generateKitRpc({ data }),
		}),
};
