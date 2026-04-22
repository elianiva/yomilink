import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

import { importWhitelistCsv, listUnregisteredWhitelist } from "@/features/whitelist/lib/whitelist-service.mutations";
import { getWhitelistEntryByStudentId } from "@/features/whitelist/lib/whitelist-service.queries";
import {
	WhitelistImportInput,
	WhitelistLookupInput,
} from "@/features/whitelist/lib/whitelist-service.shared";

export const getWhitelistEntryRpc = createServerFn()
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
			),
		),
	);

export const listUnregisteredWhitelistRpc = createServerFn()
	.handler(() =>
		AppRuntime.runPromise(
			listUnregisteredWhitelist().pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listUnregisteredWhitelist"),
				Effect.tapError(logRpcError("listUnregisteredWhitelist")),
				Effect.catchAll(logAndReturnError("listUnregisteredWhitelist")),
				Effect.catchAllDefect(logAndReturnDefect("listUnregisteredWhitelist")),
			),
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
			),
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