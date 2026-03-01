import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	DeleteGoalMapInput,
	deleteGoalMap,
	GetGoalMapInput,
	getGoalMap,
	ListGoalMapsByTopicInput,
	listGoalMaps,
	listGoalMapsByTopic,
	SaveGoalMapInput,
	saveGoalMap,
} from "@/features/goal-map/lib/goal-map-service";
import { requireGoalMapOwner } from "@/lib/auth-authorization";
import { authMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const getGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapInput)(raw))
	.handler(({ data }) =>
		getGoalMap(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getGoalMap"),
			Effect.tapError(logRpcError("getGoalMap")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const saveGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			if (data.goalMapId !== "new") {
				yield* requireGoalMapOwner(context.user.id, data.goalMapId);
			}
			return yield* saveGoalMap(context.user.id, data);
		}).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("saveGoalMap"),
			Effect.tapError(logRpcError("saveGoalMap")),
			Effect.catchTags({
				GoalMapValidationError: (e) => Rpc.err(`Validation failed: ${e.errors.join(", ")}`),
				GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
				ForbiddenError: (e) => Rpc.forbidden(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const listGoalMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		listGoalMaps(context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listGoalMaps"),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const listGoalMapsByTopicRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ListGoalMapsByTopicInput)(raw))
	.handler(({ data }) =>
		listGoalMapsByTopic(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listGoalMapsByTopic"),
			Effect.tapError(logRpcError("listGoalMapsByTopic")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const deleteGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteGoalMapInput)(raw))
	.handler(({ data, context }) =>
		deleteGoalMap(context.user.id, data).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("deleteGoalMap"),
			Effect.tapError(logRpcError("deleteGoalMap")),
			Effect.catchTags({
				GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
				ForbiddenError: (e) => Rpc.forbidden(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const GoalMapRpc = {
	goalMap: () => ["goal-map"],
	getGoalMap: (data: GetGoalMapInput) =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), data.goalMapId],
			queryFn: () => getGoalMapRpc({ data }),
		}),
	listGoalMaps: () =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), "list"],
			queryFn: () => listGoalMapsRpc(),
		}),
	listGoalMapsByTopic: (data: ListGoalMapsByTopicInput) =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), "by-topic", data.topicId ?? "null"],
			queryFn: () => listGoalMapsByTopicRpc({ data }),
		}),
	saveGoalMap: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: (data: SaveGoalMapInput) => saveGoalMapRpc({ data }),
		}),
	deleteGoalMap: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: (data: DeleteGoalMapInput) => deleteGoalMapRpc({ data }),
		}),
};
