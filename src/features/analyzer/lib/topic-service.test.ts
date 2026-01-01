import { assert, beforeEach, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { createTestTopic } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";
import { createTopic, listTopics } from "./topic-service";

describe("topic-service", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);
	describe("listTopics", () => {
		it.effect("should return empty array when no topics exist", () =>
			Effect.gen(function* () {
				const result = yield* listTopics();
				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return all topics ordered by title", () =>
			Effect.gen(function* () {
				yield* createTestTopic({ title: "Zebra" });
				yield* createTestTopic({ title: "Apple" });
				yield* createTestTopic({ title: "Mango" });

				const result = yield* listTopics();
				assert.strictEqual(result.length, 3);
				assert.strictEqual(result[0]?.title, "Apple");
				assert.strictEqual(result[1]?.title, "Mango");
				assert.strictEqual(result[2]?.title, "Zebra");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should persist topic to database", () =>
			Effect.gen(function* () {
				const topic = yield* createTestTopic({
					title: "Persistent Topic",
					description: "This should be saved",
				});

				const topics = yield* listTopics();
				const found = topics.find((t) => t.id === topic.id);
				assert.isDefined(found);
				assert.strictEqual(found?.title, "Persistent Topic");
				assert.strictEqual(found?.description, "This should be saved");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return all topics ordered by title", () =>
			Effect.gen(function* () {
				yield* createTestTopic({ title: "Zebra" });
				yield* createTestTopic({ title: "Apple" });
				yield* createTestTopic({ title: "Mango" });

				const result = yield* listTopics();

				assert.strictEqual(result.length, 3);
				assert.strictEqual(result[0]?.title, "Apple");
				assert.strictEqual(result[1]?.title, "Mango");
				assert.strictEqual(result[2]?.title, "Zebra");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("createTopic", () => {
		it.effect("should create topic with valid data", () =>
			Effect.gen(function* () {
				const result = yield* createTopic({
					title: "Test Topic",
					description: "Test Description",
				});

				assert.isTrue(result.success);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create topic without description", () =>
			Effect.gen(function* () {
				const result = yield* createTopic({
					title: "Test Topic",
				});

				assert.isTrue(result.success);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create topic with null description", () =>
			Effect.gen(function* () {
				const result = yield* createTopic({
					title: "Test Topic",
					description: undefined,
				});

				assert.isTrue(result.success);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should persist topic to database", () =>
			Effect.gen(function* () {
				const topic = yield* createTestTopic({
					title: "Persistent Topic",
					description: "This should be saved",
				});

				const topics = yield* listTopics();
				const found = topics.find((t) => t.id === topic.id);

				assert.isDefined(found);
				assert.strictEqual(found?.title, "Persistent Topic");
				assert.strictEqual(found?.description, "This should be saved");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
