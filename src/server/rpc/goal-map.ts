import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { requireGoalMapOwner } from "@/lib/auth-authorization";
import { authMiddleware } from "@/middlewares/auth";
import {
	getGoalMap,
	saveGoalMap,
	listGoalMaps,
	listGoalMapsByTopic,
	deleteGoalMap,
	GetGoalMapInput,
	SaveGoalMapInput,
	ListGoalMapsByTopicInput,
	DeleteGoalMapInput,
} from "@/features/goal-map/lib/goal-map-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const getGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapInput)(raw))
	.handler(({ data }) =>
		getGoalMap(data).pipe(
			Effect.tapError(logRpcError("getGoalMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getGoalMap"),
			Effect.runPromise,
		),
	);

export const saveGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapInput)(raw))
	.handler(async ({ data, context }) =>
		Effect.gen(function* () {
			if (data.goalMapId !== "new") {
				yield* requireGoalMapOwner(context.user.id, data.goalMapId);
			}
			return yield* saveGoalMap(context.user.id, data);
		}).pipe(
			Effect.tapError(logRpcError("saveGoalMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("saveGoalMap"),
			Effect.runPromise,
		),
	);

export const listGoalMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		listGoalMaps(context.user.id).pipe(
			Effect.tapError(logRpcError("listGoalMaps")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listGoalMaps"),
			Effect.runPromise,
		),
	);

export const listGoalMapsByTopicRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(ListGoalMapsByTopicInput)(raw),
	)
	.handler(({ data }) =>
		listGoalMapsByTopic(data).pipe(
			Effect.tapError(logRpcError("listGoalMapsByTopic")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listGoalMapsByTopic"),
			Effect.runPromise,
		),
	);

export const deleteGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteGoalMapInput)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			return yield* deleteGoalMap(context.user.id, data);
		}).pipe(
			Effect.tapError(logRpcError("deleteGoalMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("deleteGoalMap"),
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
