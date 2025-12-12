import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, isNull } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { goalMaps, topics } from "@/server/db/schema/app-schema";
import { Database } from "../db/client";

const GetGoalMapSchema = Schema.Struct({
	id: Schema.NonEmptyString,
});

const TopicSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});
export type Topic = typeof TopicSchema.Type;

const GoalMapResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.optionalWith(Schema.Array(Schema.Any), { default: () => [] }),
	edges: Schema.optionalWith(Schema.Array(Schema.Any), { default: () => [] }),
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const getGoalMap = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const row = yield* Effect.tryPromise(() =>
				db.select().from(goalMaps).where(eq(goalMaps.goalMapId, data.id)).get(),
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
});

export const saveGoalMap = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const payload = {
				id: data.goalMapId,
				goalMapId: data.goalMapId,
				title: data.title,
				description: data.description ?? null,
				nodes: JSON.stringify(data.nodes ?? []),
				edges: JSON.stringify(data.edges ?? []),
				updatedAt: new Date(),
				teacherId: data.teacherId ?? "",
			};

			yield* Effect.tryPromise(() =>
				db
					.insert(goalMaps)
					.values(payload)
					.onConflictDoUpdate({
						where: eq(goalMaps.goalMapId, data.goalMapId),
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

export const listTopics = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						id: topics.id,
						title: topics.title,
						description: topics.description,
					})
					.from(topics)
					.where(eq(topics.enabled, true))
					.orderBy(topics.title)
					.all(),
			);
			return yield* Schema.decodeUnknown(Schema.Array(TopicSchema))(rows);
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("listTopics"),
			Effect.runPromise,
		),
	);

// List all goal maps for current teacher, optionally filtered by topic
export const listGoalMaps = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						goalMapId: goalMaps.goalMapId,
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

// List goal maps filtered by topic
const ListGoalMapsByTopicSchema = Schema.Struct({
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const listGoalMapsByTopic = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(ListGoalMapsByTopicSchema)(raw),
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const query = db
				.select({
					goalMapId: goalMaps.goalMapId,
					title: goalMaps.title,
					description: goalMaps.description,
					teacherId: goalMaps.teacherId,
					topicId: goalMaps.topicId,
					createdAt: goalMaps.createdAt,
					updatedAt: goalMaps.updatedAt,
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

export const deleteGoalMap = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteGoalMapSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			yield* Effect.tryPromise(() =>
				db.delete(goalMaps).where(eq(goalMaps.goalMapId, data.goalMapId)).run(),
			);
			return { success: true };
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("deleteGoalMap"),
			Effect.runPromise,
		),
	);

export const GoalMapRpc = {
	goalMap: () => ["goal-map"],
	topics: () => [...GoalMapRpc.goalMap(), "topics"],
	listTopics: () =>
		queryOptions({
			queryKey: [...GoalMapRpc.topics()],
			queryFn: () => listTopics(),
		}),
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
	saveGoalMap: (data: typeof SaveGoalMapSchema.Type) =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: () => saveGoalMap({ data }),
		}),
	deleteGoalMap: () =>
		mutationOptions({
			mutationKey: [...GoalMapRpc.goalMap()],
			mutationFn: (data: typeof DeleteGoalMapSchema.Type) =>
				deleteGoalMap({ data }),
		}),
};
