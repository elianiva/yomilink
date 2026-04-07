import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Runtime, Schema } from "effect";

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

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const listStudentKitsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		Runtime.runPromise(
			AppRuntime,
			listStudentKits().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listStudentKits"),
				Effect.tapError(logRpcError("listStudentKits")),
				Effect.catchAll(logAndReturnError("listStudentKits")),
				Effect.catchAllDefect(logAndReturnDefect("listStudentKits")),
			),
		),
	);

export const getKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitInput)(raw))
	.handler(({ data }) =>
		Runtime.runPromise(
			AppRuntime,
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
		Runtime.runPromise(
			AppRuntime,
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
		Runtime.runPromise(
			AppRuntime,
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
