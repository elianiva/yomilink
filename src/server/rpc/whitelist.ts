import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	importWhitelistCsv,
	listUnregisteredWhitelist,
} from "@/features/whitelist/lib/whitelist-service.mutations";
import { getWhitelistEntryByStudentId } from "@/features/whitelist/lib/whitelist-service.queries";
import {
	WhitelistImportInput,
	WhitelistLookupInput,
} from "@/features/whitelist/lib/whitelist-service.shared";
import { authMiddleware, authMiddlewareOptional, requireRoleMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, TIMEOUT_DURATION, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const getWhitelistEntryRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(WhitelistLookupInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getWhitelistEntryByStudentId(data.studentId).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getWhitelistEntry"),
				Effect.tapError(logRpcError("getWhitelistEntry")),
				Effect.catchTags({
					WhitelistNotFoundError: () => Rpc.notFound("Whitelist entry"),
				}),
				Effect.catchAll(logAndReturnError("getWhitelistEntry")),
				Effect.catchAllDefect(logAndReturnDefect("getWhitelistEntry")),
				Effect.timeout(TIMEOUT_DURATION),
				Effect.catchTag("TimeoutException", () =>
					Rpc.err("Request timed out", "TIMEOUT"),
				),			)
		),
	);

export const listUnregisteredWhitelistRpc = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(() =>
		AppRuntime.runPromise(
			listUnregisteredWhitelist().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listUnregisteredWhitelist"),
				Effect.tapError(logRpcError("listUnregisteredWhitelist")),
				Effect.catchAll(logAndReturnError("listUnregisteredWhitelist")),
				Effect.catchAllDefect(logAndReturnDefect("listUnregisteredWhitelist")),
				Effect.timeout(TIMEOUT_DURATION),
				Effect.catchTag("TimeoutException", () =>
					Rpc.err("Request timed out", "TIMEOUT"),
				),			)
		),
	);

export const importWhitelistCsvRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(WhitelistImportInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			importWhitelistCsv(data.csvText).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("importWhitelistCsv"),
				Effect.tapError(logRpcError("importWhitelistCsv")),
				Effect.catchTags({
					WhitelistImportFailedError: (e) => Rpc.err(e.message),
				}),
				Effect.catchAll(logAndReturnError("importWhitelistCsv")),
				Effect.catchAllDefect(logAndReturnDefect("importWhitelistCsv")),
				Effect.timeout(TIMEOUT_DURATION),
				Effect.catchTag("TimeoutException", () =>
					Rpc.err("Request timed out", "TIMEOUT"),
				),			)
		),
	);

export const WhitelistRpc = {
	whitelist: () => ["whitelist"],
	getWhitelistEntry: (studentId: string) =>
		queryOptions({
			queryKey: [...WhitelistRpc.whitelist(), studentId],
			queryFn: () => getWhitelistEntryRpc({ data: { studentId } }),
		}),
	listUnregistered: () =>
		queryOptions({
			queryKey: [...WhitelistRpc.whitelist(), "unregistered"],
			queryFn: () => listUnregisteredWhitelistRpc(),
		}),
	importCsv: () =>
		mutationOptions({
			mutationKey: [...WhitelistRpc.whitelist(), "importCsv"],
			mutationFn: (data: { csvText: string }) => importWhitelistCsvRpc({ data }),
		}),
};
