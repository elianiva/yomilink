import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { requireTeacher } from "@/lib/auth-authorization";
import { authMiddleware } from "@/middlewares/auth";
import {
	listStudentKits,
	getKit,
	getKitStatus,
	generateKit,
	GetKitInput,
	GetKitStatusInput,
	GenerateKitInput,
} from "@/features/kit/lib/kit-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const listStudentKitsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		listStudentKits().pipe(
			Effect.tapError(logRpcError("listStudentKits")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listStudentKits"),
			Effect.runPromise,
		),
	);

export const getKitRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitInput)(raw))
	.handler(({ data }) =>
		getKit(data).pipe(
			Effect.tapError(logRpcError("getKit")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getKit"),
			Effect.runPromise,
		),
	);

export const getKitStatusRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitStatusInput)(raw))
	.handler(({ data }) =>
		getKitStatus(data).pipe(
			Effect.tapError(logRpcError("getKitStatus")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getKitStatus"),
			Effect.runPromise,
		),
	);

export const generateKitRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitInput)(raw))
	.handler(async ({ data, context }) =>
		Effect.gen(function* () {
			yield* requireTeacher(context.user.id);
			return yield* generateKit(context.user.id, data);
		}).pipe(
			Effect.tapError(logRpcError("generateKit")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("generateKit"),
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
