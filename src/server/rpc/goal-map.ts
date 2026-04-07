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
	UpdateMaterialInput,
	updateMaterial,
} from "@/features/goal-map/lib/goal-map-service";
import { authMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const getGoalMapRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getGoalMap(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getGoalMap"),
				Effect.tapError(logRpcError("getGoalMap")),
				Effect.catchAll(logAndReturnError("getGoalMap")),
				Effect.catchAllDefect(logAndReturnDefect("getGoalMap")),
			),
		),
	);

export const saveGoalMapRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware]) // Only check authentication, not authorization
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			saveGoalMap(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("saveGoalMap"),
				Effect.tapError(logRpcError("saveGoalMap")),
				Effect.catchTags({
					GoalMapValidationError: (e: { errors: string[] }) =>
						Rpc.err(`Validation failed: ${e.errors.join(", ")}`),
					GoalMapAccessDeniedError: (e: { goalMapId: string }) =>
						Rpc.forbidden(`Access denied to goal map ${e.goalMapId}`),
				}),
				Effect.catchAll(logAndReturnError("saveGoalMap")),
				Effect.catchAllDefect(logAndReturnDefect("saveGoalMap")),
			),
		),
	);

export const listGoalMapsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			listGoalMaps(context.user.id).pipe(Effect.map(Rpc.ok), Effect.withSpan("listGoalMaps")),
		),
	);

export const listGoalMapsByTopicRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ListGoalMapsByTopicInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			listGoalMapsByTopic(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listGoalMapsByTopic"),
				Effect.tapError(logRpcError("listGoalMapsByTopic")),
				Effect.catchAll(logAndReturnError("listGoalMapsByTopic")),
				Effect.catchAllDefect(logAndReturnDefect("listGoalMapsByTopic")),
			),
		),
	);

export const deleteGoalMapRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteGoalMapInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			deleteGoalMap(context.user.id, data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("deleteGoalMap"),
				Effect.tapError(logRpcError("deleteGoalMap")),
				Effect.catchTags({
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
					GoalMapAccessDeniedError: (e: { goalMapId: string }) =>
						Rpc.forbidden(`Access denied to goal map ${e.goalMapId}`),
				}),
				Effect.catchAll(logAndReturnError("deleteGoalMap")),
				Effect.catchAllDefect(logAndReturnDefect("deleteGoalMap")),
			),
		),
	);

export const updateMaterialRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateMaterialInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			updateMaterial(context.user.id, data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("updateMaterial"),
				Effect.tapError(logRpcError("updateMaterial")),
				Effect.catchTags({
					GoalMapNotFoundError: () => Rpc.notFound("Goal map"),
					GoalMapAccessDeniedError: (e: { goalMapId: string }) =>
						Rpc.forbidden(`Access denied to goal map ${e.goalMapId}`),
				}),
				Effect.catchAll(logAndReturnError("updateMaterial")),
				Effect.catchAllDefect(logAndReturnDefect("updateMaterial")),
			),
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
	updateMaterial: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap(), "material"],
			mutationFn: (data: UpdateMaterialInput) => updateMaterialRpc({ data }),
		}),
};
