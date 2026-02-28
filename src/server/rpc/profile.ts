import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { UpdateProfileInput, updateProfile } from "@/features/profile/lib/profile-service";
import { authMiddleware, authMiddlewareOptional } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const getMe = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(({ context }) =>
		Effect.gen(function* () {
			if (!context.user) {
				return yield* Rpc.err("Not authenticated");
			}
			return yield* Rpc.ok(context.user);
		}).pipe(
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const updateProfileRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateProfileInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const result = yield* updateProfile(context.user.id, data);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.withSpan("updateProfile"),
			Effect.tapError(logRpcError("updateProfile")),
			Effect.catchTags({
				UserNotFoundError: () => Rpc.notFound("User"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
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
