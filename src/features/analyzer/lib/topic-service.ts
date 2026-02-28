import { Effect, Schema } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { topics } from "@/server/db/schema/app-schema";

export const TopicSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NullOr(Schema.NonEmptyString), {
		exact: true,
	}),
});

export type Topic = typeof TopicSchema.Type;

export const CreateTopicInput = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export type CreateTopicInput = typeof CreateTopicInput.Type;

export const listTopics = Effect.fn("listTopics")(function* () {
	const db = yield* Database;
	const rows = yield* db
		.select({
			id: topics.id,
			title: topics.title,
			description: topics.description,
		})
		.from(topics)
		.orderBy(topics.title);

	return rows;
});

export const createTopic = Effect.fn("createTopic")(function* (data: CreateTopicInput) {
	const db = yield* Database;
	yield* db.insert(topics).values({
		id: randomString(),
		title: data.title,
		description: data.description,
	});

	return { success: true } as const;
});
