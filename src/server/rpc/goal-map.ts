import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, isNull } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { goalMaps, texts } from "@/server/db/schema/app-schema";
import { Database } from "../db/client";

const GetGoalMapSchema = Schema.Struct({
	id: Schema.NonEmptyString,
});

const GoalMapResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.optionalWith(Schema.Array(Schema.Any), { default: () => [] }),
	edges: Schema.optionalWith(Schema.Array(Schema.Any), { default: () => [] }),
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	createdAt: Schema.optionalWith(Schema.DateFromSelf, { nullable: true }),
	updatedAt: Schema.optionalWith(Schema.DateFromSelf, { nullable: true }),
});

export const getGoalMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const row = yield* Effect.tryPromise(() =>
				db
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
					})
					.from(goalMaps)
					.leftJoin(texts, eq(goalMaps.textId, texts.id))
					.where(eq(goalMaps.id, data.id))
					.get(),
			);
			if (!row) return null;

			const result = yield* Schema.decodeUnknown(GoalMapResultSchema)(row);
			return result;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("getGoalMap"),
			Effect.runPromise,
		),
	);

const SaveGoalMapSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.Array(Schema.Any),
	edges: Schema.Array(Schema.Any),
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
});

export const saveGoalMap = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Handle material text - create or update text record
			let textId: string | null = null;
			if (data.materialText?.trim()) {
				// Check if goalmap already has a text linked
				const existing = yield* Effect.tryPromise(() =>
					db
						.select({ textId: goalMaps.textId })
						.from(goalMaps)
						.where(eq(goalMaps.id, data.goalMapId))
						.get(),
				);

				if (existing?.textId) {
					// Update existing text record
					textId = existing.textId;
					yield* Effect.tryPromise(() =>
						db
							.update(texts)
							.set({
								content: data.materialText,
								updatedAt: new Date(),
							})
							.where(eq(texts.id, textId as string))
							.run(),
					);
				} else {
					// Create new text record
					textId = crypto.randomUUID();
					yield* Effect.tryPromise(() =>
						db
							.insert(texts)
							.values({
								id: textId as string,
								title: `Material for ${data.title}`,
								content: data.materialText as string,
							})
							.run(),
					);
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
				teacherId: data.teacherId ?? "",
				textId,
			};

			yield* Effect.tryPromise(() =>
				db
					.insert(goalMaps)
					.values(payload)
					.onConflictDoUpdate({
						where: eq(goalMaps.id, data.goalMapId),
						target: goalMaps.id,
						set: payload,
					})
					.run(),
			);
		}).pipe(
			Effect.withSpan("saveGoalMap"),
			Effect.provide(Database.Default),
			Effect.runPromise,
		),
	);

export const listGoalMaps = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
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
					.orderBy(desc(goalMaps.updatedAt))
					.all(),
			);
			return yield* Schema.decodeUnknown(Schema.Array(GoalMapResultSchema))(
				rows,
			);
		}).pipe(
			Effect.provide(Database.Default),
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
				})
				.from(goalMaps);

			if (data.topicId) {
				query.where(eq(goalMaps.topicId, data.topicId));
			} else {
				query.where(isNull(goalMaps.topicId));
			}

			const rows = yield* Effect.tryPromise(() =>
				query.orderBy(desc(goalMaps.updatedAt)).all(),
			);
			return yield* Schema.decodeUnknown(Schema.Array(GoalMapResultSchema))(
				rows,
			);
		}).pipe(
			Effect.provide(Database.Default),
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
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			yield* Effect.tryPromise(() =>
				db.delete(goalMaps).where(eq(goalMaps.id, data.goalMapId)).run(),
			);
			return { success: true };
		}).pipe(
			Effect.provide(Database.Default),
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
