import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";

import {
	createTestGoalMap,
	createTestKit,
	createTestTopic,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { listGoalMaps, listGoalMapsByTopic } from "./goal-map-service";

describe("goal-map-service > listGoalMaps", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return empty array when no goal maps exist", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const result = yield* listGoalMaps(teacher.id);
			expect(result).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return only goal maps belonging to the user", () =>
		Effect.gen(function* () {
			const teacher1 = yield* createTestUser({
				email: "teacher1@example.com",
			});
			const teacher2 = yield* createTestUser({
				email: "teacher2@example.com",
			});

			yield* createTestGoalMap(teacher1.id, { title: "Teacher 1 Map" });
			yield* createTestGoalMap(teacher2.id, { title: "Teacher 2 Map" });

			const result = yield* listGoalMaps(teacher1.id);

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("Teacher 1 Map");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return goal maps ordered by updatedAt descending", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			yield* createTestGoalMap(teacher.id, {
				title: "Old Map",
				updatedAt: new Date("2024-01-01"),
			});
			yield* createTestGoalMap(teacher.id, {
				title: "New Map",
				updatedAt: new Date("2024-01-02"),
			});

			const result = yield* listGoalMaps(teacher.id);

			expect(result[0].title).toBe("New Map");
			expect(result[1].title).toBe("Old Map");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should handle invalid nodes/edges gracefully", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			yield* createTestGoalMap(teacher.id, {
				nodes: "invalid",
				edges: "invalid",
			});

			const result = yield* listGoalMaps(teacher.id);

			expect(result).toHaveLength(1);
			expect(result[0].nodes).toStrictEqual([]);
			expect(result[0].edges).toStrictEqual([]);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("goal-map-service > listGoalMapsByTopic", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return goal maps with null topic when topicId is null", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const topic = yield* createTestTopic();

			yield* createTestGoalMap(teacher.id, {
				title: "Map without topic",
				topicId: null,
			});
			yield* createTestGoalMap(teacher.id, {
				title: "Map with topic",
				topicId: topic.id,
			});

			const result = yield* listGoalMapsByTopic({ topicId: undefined });

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("Map without topic");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return goal maps with specific topic", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const topic1 = yield* createTestTopic({ title: "Topic 1" });
			const topic2 = yield* createTestTopic({ title: "Topic 2" });

			yield* createTestGoalMap(teacher.id, {
				title: "Map for Topic 1",
				topicId: topic1.id,
			});
			yield* createTestGoalMap(teacher.id, {
				title: "Map for Topic 2",
				topicId: topic2.id,
			});

			const result = yield* listGoalMapsByTopic({ topicId: topic1.id });

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("Map for Topic 1");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should include kit existence info", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const topic = yield* createTestTopic();

			const goalMapWithKit = yield* createTestGoalMap(teacher.id, {
				title: "Map with Kit",
				topicId: topic.id,
			});
			const goalMapWithoutKit = yield* createTestGoalMap(teacher.id, {
				title: "Map without Kit",
				topicId: topic.id,
			});

			yield* createTestKit(goalMapWithKit.id, teacher.id);

			const result = yield* listGoalMapsByTopic({ topicId: topic.id });

			expect(result).toHaveLength(2);

			const withKit = result.find((r) => r.id === goalMapWithKit.id);
			const withoutKit = result.find((r) => r.id === goalMapWithoutKit.id);

			expect(withKit?.kitId).toBeDefined();
			expect(withoutKit?.kitId).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
