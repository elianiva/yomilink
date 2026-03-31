import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";

import { createTestTopic } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { createTopic, listTopics } from "./topic-service";

describe("topic-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));

	describe("listTopics", () => {
		it("should return empty array when no topics exist", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* listTopics();
					expect(result.length).toBe(0);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return all topics ordered by title", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					yield* createTestTopic({ title: "Zebra" });
					yield* createTestTopic({ title: "Apple" });
					yield* createTestTopic({ title: "Mango" });

					const result = yield* listTopics();
					expect(result.length).toBe(3);
					expect(result[0]?.title).toBe("Apple");
					expect(result[1]?.title).toBe("Mango");
					expect(result[2]?.title).toBe("Zebra");
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});

	describe("createTopic", () => {
		it("should create topic with valid data", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* createTopic({
						title: "Test Topic",
						description: "Test Description",
					});
					expect(result).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should create topic without description", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* createTopic({
						title: "Test Topic",
					});
					expect(result).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});
});
