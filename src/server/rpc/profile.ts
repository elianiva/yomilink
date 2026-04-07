import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Runtime, Schema } from "effect";

import { UpdateProfileInput, updateProfile } from "@/features/profile/lib/profile-service";
import { authMiddleware, authMiddlewareOptional } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const getMe = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(({ context }) =>
		Runtime.runPromise(
			AppRuntime,
			Effect.fromNullable(context.user).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getMe"),
				Effect.catchAll(() => Rpc.notFound("User")),
			),
		),
	);

export const updateProfileRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateProfileInput)(raw))
	.handler(({ data, context }) =>
		Runtime.runPromise(
			AppRuntime,
			updateProfile(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("updateProfile"),
				Effect.tapError(logRpcError("updateProfile")),
				Effect.catchTags({
					UserNotFoundError: () => Rpc.notFound("User"),
				}),
				Effect.catchAll(logAndReturnError("updateProfile")),
				Effect.catchAllDefect(logAndReturnDefect("updateProfile")),
			),
		),
	);

export const ProfileRpc = {
	me: () => ["me"],
	getMe: () =>
		queryOptions({
			queryKey: ProfileRpc.me(),
			queryFn: () => getMe(),
		}),
	updateProfile: () =>
		mutationOptions({
			mutationKey: ProfileRpc.me(),
			mutationFn: (data: UpdateProfileInput) => updateProfileRpc({ data }),
		}),
};
