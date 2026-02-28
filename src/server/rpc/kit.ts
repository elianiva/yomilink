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
	listStudentKits,
} from "@/features/kit/lib/kit-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const listStudentKitsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(() =>
		Effect.gen(function* () {
			const rows = yield* listStudentKits();
			return yield* Rpc.ok(rows);
		}).pipe(
			Effect.withSpan("listStudentKits"),
			Effect.tapError(logRpcError("listStudentKits")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* getKit(data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getKit"),
			Effect.tapError(logRpcError("getKit")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const getKitStatusRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitStatusInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* getKitStatus(data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("getKitStatus"),
			Effect.tapError(logRpcError("getKitStatus")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const generateKitRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* generateKit(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("generateKit"),
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchTags({
				GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
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
