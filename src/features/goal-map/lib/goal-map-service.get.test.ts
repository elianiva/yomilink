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

import { getGoalMap } from "./goal-map-service";

describe("goal-map-service > getGoalMap", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return null when goal map does not exist", () =>
		Effect.gen(function* () {
			const result = yield* getGoalMap({ goalMapId: "non-existent-id" });
			expect(result).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return goal map with nodes and edges", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const goalMap = yield* createTestGoalMap(teacher.id, {
				title: "Test Goal Map",
			});

			const result = yield* getGoalMap({ goalMapId: goalMap.id });

			expect(result).not.toBeNull();
			expect(result?.id).toBe(goalMap.id);
			expect(result?.title).toBe("Test Goal Map");
			expect(Array.isArray(result?.nodes)).toBe(true);
			expect(Array.isArray(result?.edges)).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return empty arrays when nodes/edges are invalid", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const goalMap = yield* createTestGoalMap(teacher.id, {
				nodes: "invalid",
				edges: "invalid",
			});

			const result = yield* getGoalMap({ goalMapId: goalMap.id });

			expect(result).not.toBeNull();
			expect(result?.nodes).toStrictEqual([]);
			expect(result?.edges).toStrictEqual([]);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return kitExists as true when kit exists", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const goalMap = yield* createTestGoalMap(teacher.id);

			yield* createTestKit(goalMap.id, teacher.id);

			const result = yield* getGoalMap({ goalMapId: goalMap.id });

			expect(result).not.toBeNull();
			expect(result?.kitExists).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return kitExists as false when kit does not exist", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const goalMap = yield* createTestGoalMap(teacher.id);

			const result = yield* getGoalMap({ goalMapId: goalMap.id });

			expect(result).not.toBeNull();
			expect(result?.kitExists).toBe(false);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should include topic id when associated", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const topic = yield* createTestTopic({ title: "Test Topic" });

			const goalMap = yield* createTestGoalMap(teacher.id, {
				topicId: topic.id,
			});

			const result = yield* getGoalMap({ goalMapId: goalMap.id });

			expect(result).not.toBeNull();
			expect(result?.topicId).toBe(topic.id);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
