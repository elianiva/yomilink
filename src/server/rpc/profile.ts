import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import {
	UpdateProfileInput,
	updateProfile,
} from "@/features/profile/lib/profile-service";
import { authMiddleware, authMiddlewareOptional } from "@/middlewares/auth";
import { AppLayer } from "../app-layer";
import { errorResponse, logRpcError } from "../rpc-helper";

export const getMe = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(({ context }) => context.user);

export const updateProfileRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateProfileInput)(raw))
	.handler(({ data, context }) =>
		updateProfile(context.user.id, data).pipe(
			Effect.withSpan("updateProfile"),
			Effect.tapError(logRpcError("updateProfile")),
			Effect.catchTags({
				UserNotFoundError: (e) => errorResponse(`User ${e.userId} not found`),
			}),
			Effect.catchAll(() => errorResponse("Internal server error")),
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
