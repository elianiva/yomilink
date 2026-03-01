import { assert, beforeEach, describe, it } from "@effect/vitest";
import { Effect, Either } from "effect";

import { simpleGoalMap } from "@/__tests__/fixtures/goal-maps";
import {
	createTestGoalMap,
	createTestKit,
	createTestTopic,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import {
	deleteGoalMap,
	getGoalMap,
	listGoalMaps,
	listGoalMapsByTopic,
	saveGoalMap,
} from "./goal-map-service";

describe("goal-map-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));

	describe("getGoalMap", () => {
		it.effect("should return null when goal map does not exist", () =>
			Effect.gen(function* () {
				const result = yield* getGoalMap({ goalMapId: "non-existent-id" });
				assert.isNull(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal map with nodes and edges", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				// Use createTestGoalMap fixture - it stores nodes correctly for the schema
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					// The fixture expects JSON strings as the schema uses mode: "json"
				});

				const result = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(result);
				assert.strictEqual(result?.id, goalMap.id);
				assert.strictEqual(result?.title, "Test Goal Map");
				assert.isTrue(Array.isArray(result?.nodes));
				assert.isTrue(Array.isArray(result?.edges));
				// Fixture creates empty arrays by default
				assert.deepStrictEqual(result?.nodes, []);
				assert.deepStrictEqual(result?.edges, []);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty arrays when nodes/edges are not arrays", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: "invalid",
					edges: "invalid",
				});

				const result = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(result);
				assert.deepStrictEqual(result?.nodes, []);
				assert.deepStrictEqual(result?.edges, []);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return kitExists as true when kit exists", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				yield* createTestKit(goalMap.id, teacher.id);

				const result = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(result);
				assert.isTrue(result?.kitExists);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return kitExists as false when kit does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(result);
				assert.isFalse(result?.kitExists);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include topic id when associated", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const topic = yield* createTestTopic({ title: "Test Topic" });

				const goalMap = yield* createTestGoalMap(teacher.id, {
					topicId: topic.id,
				});

				const result = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(result);
				assert.strictEqual(result?.topicId, topic.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("saveGoalMap", () => {
		it.effect("should create a new goal map when goalMapId is 'new'", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "New Goal Map",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
				});

				assert.strictEqual(result.errors.length, 0);
				assert.deepStrictEqual(result.errors, []);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update existing goal map", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Original Title",
				});

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: goalMap.id,
					title: "Updated Title",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
				});

				assert.strictEqual(result.errors.length, 0);

				const updated = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.strictEqual(updated?.title, "Updated Title");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return validation errors for invalid nodes", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Invalid Goal Map",
					nodes: [],
					edges: [],
				});

				assert.isTrue(result.errors.length > 0);
				assert.isTrue(result.errors.length > 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should fail when non-owner tries to update", () =>
			Effect.gen(function* () {
				const owner = yield* createTestUser({ email: "owner@example.com" });
				const otherUser = yield* createTestUser({ email: "other@example.com" });
				const goalMap = yield* createTestGoalMap(owner.id);

				const result = yield* Effect.either(
					saveGoalMap(otherUser.id, {
						goalMapId: goalMap.id,
						title: "Unauthorized Update",
						nodes: simpleGoalMap.nodes,
						edges: simpleGoalMap.edges,
					}),
				);

				assert.isTrue(Either.isLeft(result));
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include propositions in result on success", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Goal Map with Propositions",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
				});

				assert.strictEqual(result.errors.length, 0);
				assert.isDefined(result.propositions);
				assert.isTrue(result.propositions.length > 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should save goal map with topic association", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const topic = yield* createTestTopic({ title: "Test Topic" });

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Goal Map with Topic",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
					topicId: topic.id,
				});

				assert.strictEqual(result.errors.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should save goal map with material text", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Goal Map with Material",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
					materialText: "This is learning material text",
				});

				assert.strictEqual(result.errors.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update existing material text", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				// First save with material
				const firstSave = yield* saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Goal Map with Material",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
					materialText: "Original material",
				});
				assert.strictEqual(firstSave.errors.length, 0);

				// Get the created goal map
				const maps = yield* listGoalMaps(teacher.id);
				const goalMapId = maps[0].id;

				// Update with new material
				const result = yield* saveGoalMap(teacher.id, {
					goalMapId,
					title: "Goal Map with Material",
					nodes: simpleGoalMap.nodes,
					edges: simpleGoalMap.edges,
					materialText: "Updated material",
				});

				assert.strictEqual(result.errors.length, 0);

				const updated = yield* getGoalMap({ goalMapId });
				assert.strictEqual(updated?.materialText, "Updated material");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("listGoalMaps", () => {
		it.effect("should return empty array when no goal maps exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const result = yield* listGoalMaps(teacher.id);
				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return only goal maps belonging to the user", () =>
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
				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0].title, "Teacher 1 Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal maps ordered by updatedAt descending", () =>
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
				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0].title, "New Map");
				assert.strictEqual(result[1].title, "Old Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include timestamps as epoch numbers", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				yield* createTestGoalMap(teacher.id);

				const result = yield* listGoalMaps(teacher.id);
				assert.strictEqual(result.length, 1);
				assert.isNumber(result[0].createdAt);
				assert.isNumber(result[0].updatedAt);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle invalid nodes/edges gracefully", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				yield* createTestGoalMap(teacher.id, {
					nodes: "invalid",
					edges: "invalid",
				});

				const result = yield* listGoalMaps(teacher.id);
				assert.strictEqual(result.length, 1);
				assert.deepStrictEqual(result[0].nodes, []);
				assert.deepStrictEqual(result[0].edges, []);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("listGoalMapsByTopic", () => {
		it.effect("should return goal maps with null topic when topicId is null", () =>
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
				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0].title, "Map without topic");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal maps with specific topic", () =>
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
				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0].title, "Map for Topic 1");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include kit existence info", () =>
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
				assert.strictEqual(result.length, 2);

				const withKit = result.find((r) => r.id === goalMapWithKit.id);
				const withoutKit = result.find((r) => r.id === goalMapWithoutKit.id);

				assert.isDefined(withKit?.kitId);
				assert.isNull(withoutKit?.kitId);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty array when no goal maps match topic", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const topic = yield* createTestTopic();

				yield* createTestGoalMap(teacher.id, { topicId: null });

				const result = yield* listGoalMapsByTopic({ topicId: topic.id });
				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal maps ordered by updatedAt descending", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const topic = yield* createTestTopic();

				yield* createTestGoalMap(teacher.id, {
					title: "Old Map",
					topicId: topic.id,
					updatedAt: new Date("2024-01-01"),
				});
				yield* createTestGoalMap(teacher.id, {
					title: "New Map",
					topicId: topic.id,
					updatedAt: new Date("2024-01-02"),
				});

				const result = yield* listGoalMapsByTopic({ topicId: topic.id });
				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0].title, "New Map");
				assert.strictEqual(result[1].title, "Old Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("deleteGoalMap", () => {
		it.effect("should delete goal map when user is owner", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* deleteGoalMap(teacher.id, {
					goalMapId: goalMap.id,
				});
				assert.strictEqual(result, true);

				const deleted = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNull(deleted);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should fail when non-owner tries to delete", () =>
			Effect.gen(function* () {
				const owner = yield* createTestUser({ email: "owner@example.com" });
				const otherUser = yield* createTestUser({ email: "other@example.com" });
				const goalMap = yield* createTestGoalMap(owner.id);

				const result = yield* Effect.either(
					deleteGoalMap(otherUser.id, { goalMapId: goalMap.id }),
				);

				assert.isTrue(Either.isLeft(result));

				// Verify it was not deleted
				const stillExists = yield* getGoalMap({ goalMapId: goalMap.id });
				assert.isNotNull(stillExists);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should fail when goal map does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* Effect.either(
					deleteGoalMap(teacher.id, { goalMapId: "non-existent-id" }),
				);

				assert.isTrue(Either.isLeft(result));
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
