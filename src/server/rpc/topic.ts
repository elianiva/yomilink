import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { Database } from "../db/client";
import { topics } from "../db/schema/app-schema";
import { randomString } from "@/lib/utils";

const TopicSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});
export type Topic = typeof TopicSchema.Type;

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

const CreateTopicSchema = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.NonEmptyString,
});

export const createTopic = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateTopicSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			yield* Effect.tryPromise(() =>
				db
					.insert(topics)
					.values({
						id: randomString(),
						title: data.title,
						description: data.description,
					})
					.run(),
			);
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("createTopic"),
			Effect.runPromise,
		),
	);

export const TopicRpc = {
	topics: () => ["topics"],
	listTopics: () =>
		queryOptions({
			queryKey: [...TopicRpc.topics()],
			queryFn: () => listTopics(),
		}),
	createTopic: () =>
		mutationOptions({
			mutationKey: [...TopicRpc.topics()],
			mutationFn: (data: typeof CreateTopicSchema.Type) =>
				createTopic({ data }),
		}),
};
