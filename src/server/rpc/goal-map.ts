import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, isNull } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { validateNodes } from "@/features/goal-map/lib/validator";
import { EdgeSchema, NodeSchema } from "@/features/learner-map/lib/comparator";
import { requireGoalMapOwner } from "@/lib/auth-authorization";
import { authMiddleware } from "@/middlewares/auth";
import { safeParseJson } from "@/lib/utils";
import { goalMaps, kits, texts } from "@/server/db/schema/app-schema";
import { Database, DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError, rpcErrorResponses } from "./handler";

const GetGoalMapSchema = Schema.Struct({
	id: Schema.NonEmptyString,
});

// Schema to parse JSON string or array into array
const JsonArraySchema = Schema.transform(
	Schema.Union(Schema.String, Schema.Array(Schema.Any), Schema.Null),
	Schema.Array(Schema.Any),
	{
		decode: (input) => {
			if (input === null || input === undefined) return [];
			const parsed = Effect.runSync(safeParseJson(input, []));
			return Array.isArray(parsed) ? parsed : [];
		},
		encode: (input) => input,
	},
);

// Schema that accepts any string and converts empty strings to null
const NullableNonEmptyString = Schema.transform(
	Schema.String,
	Schema.Union(Schema.String.pipe(Schema.minLength(1)), Schema.Null),
	{
		decode: (s) => (s.length > 0 ? s : null),
		encode: (s) => s ?? "",
	},
);

const GoalMapResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.optionalWith(JsonArraySchema, { default: () => [] }),
	edges: Schema.optionalWith(JsonArraySchema, { default: () => [] }),
	teacherId: Schema.optionalWith(NullableNonEmptyString, { nullable: true }),
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), {
		default: () => [],
	}),
	kitId: Schema.optionalWith(Schema.String, { nullable: true }),
	kitExists: Schema.optionalWith(Schema.Boolean, { default: () => false }),
	createdAt: Schema.optionalWith(Schema.DateFromSelf, { nullable: true }),
	updatedAt: Schema.optionalWith(Schema.DateFromSelf, { nullable: true }),
});

export const getGoalMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					goalMapId: goalMaps.id,
					title: goalMaps.title,
					description: goalMaps.description,
					nodes: goalMaps.nodes,
					edges: goalMaps.edges,
					teacherId: goalMaps.teacherId,
					topicId: goalMaps.topicId,
					textId: goalMaps.textId,
					materialText: texts.content,
					materialImages: texts.images,
				})
				.from(goalMaps)
				.leftJoin(texts, eq(goalMaps.textId, texts.id))
				.where(eq(goalMaps.id, data.id))
				.limit(1);

			const row = rows[0];
			if (!row) return null;

			const result = yield* Schema.decodeUnknown(GoalMapResultSchema)(row);
			return result;
		}).pipe(
			Effect.tapError(logRpcError("getGoalMap")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getGoalMap"),
			Effect.runPromise,
		),
	);

const SaveGoalMapSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(
		Schema.Array(
			Schema.Struct({
				id: Schema.NonEmptyString,
				url: Schema.NonEmptyString,
				name: Schema.NonEmptyString,
				size: Schema.Number,
				type: Schema.NonEmptyString,
				uploadedAt: Schema.Number,
			}),
		),
		{ nullable: true },
	),
});

export const saveGoalMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapSchema)(raw))
	.handler(async ({ data, context }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Check ownership if updating existing map
			if (data.goalMapId !== "new") {
				yield* requireGoalMapOwner(context.user.id, data.goalMapId);
			}

			// Validate goal map structure
			const validationResult = yield* validateNodes(data.nodes, data.edges);

			// If validation fails, return errors
			if (!validationResult.isValid) {
				return {
					success: false,
					errors: validationResult.errors,
					warnings: validationResult.warnings,
				} as const;
			}

			// Handle material text - create or update text record
			let textId: string | null = null;
			const hasMaterial =
				data.materialText?.trim() ||
				(data.materialImages && data.materialImages.length > 0);

			if (hasMaterial) {
				// Check if goalmap already has a text linked
				const existingRows = yield* db
					.select({ textId: goalMaps.textId })
					.from(goalMaps)
					.where(eq(goalMaps.id, data.goalMapId))
					.limit(1);

				const existing = existingRows[0];
				if (existing?.textId) {
					// Update existing text record
					textId = existing.textId;
					yield* db
						.update(texts)
						.set({
							content: data.materialText || "",
							images:
								data.materialImages && data.materialImages.length > 0
									? JSON.stringify(data.materialImages)
									: null,
							updatedAt: new Date(),
						})
						.where(eq(texts.id, textId as string));
				} else {
					// Create new text record
					textId = crypto.randomUUID();
					yield* db.insert(texts).values({
						id: textId as string,
						title: `Material for ${data.title}`,
						content: data.materialText || "",
						images:
							data.materialImages && data.materialImages.length > 0
								? JSON.stringify(data.materialImages)
								: null,
					});
				}
			}

			const payload = {
				id: data.goalMapId,
				goalMapId: data.goalMapId,
				title: data.title,
				description: data.description ?? null,
				nodes: JSON.stringify(data.nodes ?? []),
				edges: JSON.stringify(data.edges ?? []),
				updatedAt: new Date(),
				teacherId: context.user.id,
				topicId: data.topicId ?? null,
				textId,
			};

			yield* db
				.insert(goalMaps)
				.values(payload)
				.onConflictDoUpdate({
					where: eq(goalMaps.id, data.goalMapId),
					target: goalMaps.id,
					set: payload,
				});

			return {
				success: true,
				errors: validationResult.errors,
				warnings: validationResult.warnings,
				propositions: validationResult.propositions,
			} as const;
		}).pipe(
			Effect.tapError(logRpcError("saveGoalMap")),
			Effect.catchTags({
				ForbiddenError: rpcErrorResponses.ForbiddenError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("saveGoalMap"),
			Effect.runPromise,
		),
	);

export const listGoalMaps = createServerFn()
	.middleware([authMiddleware])
	.handler(({ context }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					goalMapId: goalMaps.id,
					title: goalMaps.title,
					description: goalMaps.description,
					teacherId: goalMaps.teacherId,
					topicId: goalMaps.topicId,
					createdAt: goalMaps.createdAt,
					updatedAt: goalMaps.updatedAt,
				})
				.from(goalMaps)
				.where(eq(goalMaps.teacherId, context.user.id))
				.orderBy(desc(goalMaps.updatedAt));

			return yield* Schema.decodeUnknown(Schema.Array(GoalMapResultSchema))(
				rows,
			);
		}).pipe(
			Effect.tapError(logRpcError("listGoalMaps")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listGoalMaps"),
			Effect.runPromise,
		),
	);

const ListGoalMapsByTopicSchema = Schema.Struct({
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const listGoalMapsByTopic = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(ListGoalMapsByTopicSchema)(raw),
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const query = db
				.select({
					goalMapId: goalMaps.id,
					title: goalMaps.title,
					description: goalMaps.description,
					teacherId: goalMaps.teacherId,
					topicId: goalMaps.topicId,
					createdAt: goalMaps.createdAt,
					updatedAt: goalMaps.updatedAt,
					nodes: goalMaps.nodes,
					edges: goalMaps.edges,
					kitId: kits.id,
				})
				.from(goalMaps)
				.leftJoin(kits, eq(kits.goalMapId, goalMaps.id));

			if (data.topicId) {
				query.where(eq(goalMaps.topicId, data.topicId));
			} else {
				query.where(isNull(goalMaps.topicId));
			}

			const rows = yield* query.orderBy(desc(goalMaps.updatedAt));

			return yield* Schema.decodeUnknown(Schema.Array(GoalMapResultSchema))(
				rows,
			);
		}).pipe(
			Effect.tapError(logRpcError("listGoalMapsByTopic")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listGoalMapsByTopic"),
			Effect.runPromise,
		),
	);

const DeleteGoalMapSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});

export const deleteGoalMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteGoalMapSchema)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Check ownership
			yield* requireGoalMapOwner(context.user.id, data.goalMapId);

			yield* db.delete(goalMaps).where(eq(goalMaps.id, data.goalMapId));

			return { success: true } as const;
		}).pipe(
			Effect.tapError(logRpcError("deleteGoalMap")),
			Effect.catchTags({
				ForbiddenError: rpcErrorResponses.ForbiddenError,
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("deleteGoalMap"),
			Effect.runPromise,
		),
	);

// LocalStorage fallback for offline support
export const saveToLocalStorage = (params: typeof SaveGoalMapSchema.Type) => {
	const localDoc = {
		goalMapId: params.goalMapId,
		title: params.title,
		description: params.description,
		nodes: params.nodes,
		edges: params.edges,
		materialText: params.materialText,
		updatedAt: Date.now(),
	};
	localStorage.setItem(`goalmap:${params.goalMapId}`, JSON.stringify(localDoc));
};

export const GoalMapRpc = {
	goalMap: () => ["goal-map"],
	getGoalMap: (data: typeof GetGoalMapSchema.Type) =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), data.id],
			queryFn: () => getGoalMap({ data }),
		}),
	listGoalMaps: () =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), "list"],
			queryFn: () => listGoalMaps(),
		}),
	listGoalMapsByTopic: (data: typeof ListGoalMapsByTopicSchema.Type) =>
		queryOptions({
			queryKey: [...GoalMapRpc.goalMap(), "by-topic", data.topicId ?? "null"],
			queryFn: () => listGoalMapsByTopic({ data }),
		}),
	saveGoalMap: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: (data: typeof SaveGoalMapSchema.Type) =>
				saveGoalMap({ data }),
		}),
	deleteGoalMap: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: (data: typeof DeleteGoalMapSchema.Type) =>
				deleteGoalMap({ data }),
		}),
};
