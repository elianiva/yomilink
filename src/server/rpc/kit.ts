import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	GenerateKitInput,
	GetKitInput,
	GetKitStatusInput,
	generateKit,
	getKit,
	getKitStatus,
	listGoalMapsWithKits,
} from "@/features/kit/lib/kit-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const listGoalMapsWithKitsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		AppRuntime.runPromise(
			listGoalMapsWithKits().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listGoalMapsWithKits"),
				Effect.tapError(logRpcError("listGoalMapsWithKits")),
				Effect.catchAll(logAndReturnError("listGoalMapsWithKits")),
				Effect.catchAllDefect(logAndReturnDefect("listGoalMapsWithKits")),
			),
		),
	);

export const getKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getKit(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getKit"),
				Effect.tapError(logRpcError("getKit")),
				Effect.catchAll(logAndReturnError("getKit")),
				Effect.catchAllDefect(logAndReturnDefect("getKit")),
			),
		),
	);

export const getKitStatusRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitStatusInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getKitStatus(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getKitStatus"),
				Effect.tapError(logRpcError("getKitStatus")),
				Effect.catchAll(logAndReturnError("getKitStatus")),
				Effect.catchAllDefect(logAndReturnDefect("getKitStatus")),
			),
		),
	);

export const generateKitRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			generateKit(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("generateKit"),
				Effect.tapError(logRpcError("generateKit")),
				Effect.catchTags({
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
				}),
				Effect.catchAll(logAndReturnError("generateKit")),
				Effect.catchAllDefect(logAndReturnDefect("generateKit")),
			),
		),
	);

export const KitRpc = {
	studentKits: () => ["student-kits"],
	listGoalMapsWithKits: () =>
		queryOptions({
			queryKey: [...KitRpc.studentKits()],
			queryFn: () => listGoalMapsWithKitsRpc(),
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
