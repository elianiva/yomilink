import { assert, beforeEach, describe, it } from "@effect/vitest";
import { Effect, Either } from "effect";

import {
	createTestGoalMap,
	createTestKit,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { generateKit, getKit, getKitStatus, listStudentKits } from "./kit-service";

describe("kit-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));
	describe("listStudentKits", () => {
		it.effect("should return empty array when no kits exist", () =>
			Effect.gen(function* () {
				const result = yield* listStudentKits();
				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return all goal maps with kit info", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap1 = yield* createTestGoalMap(teacher.id, {
					title: "First Goal Map",
				});
				const goalMap2 = yield* createTestGoalMap(teacher.id, {
					title: "Second Goal Map",
				});

				yield* createTestKit(goalMap1.id, teacher.id);
				yield* createTestKit(goalMap2.id, teacher.id);

				const result = yield* listStudentKits();
				assert.strictEqual(result.length, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal maps ordered by updatedAt descending", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const oldGoalMap = yield* createTestGoalMap(teacher.id, {
					title: "Old Goal Map",
					updatedAt: new Date("2024-01-01"),
				});
				const newGoalMap = yield* createTestGoalMap(teacher.id, {
					title: "New Goal Map",
					updatedAt: new Date("2024-01-02"),
				});

				yield* createTestKit(oldGoalMap.id, teacher.id);
				yield* createTestKit(newGoalMap.id, teacher.id);

				const result = yield* listStudentKits();
				const foundOld = result.find((r) => r.goalMapId === oldGoalMap.id);
				const foundNew = result.find((r) => r.goalMapId === newGoalMap.id);
				assert.isDefined(foundOld);
				assert.isDefined(foundNew);
				assert.strictEqual(foundNew?.title, "New Goal Map");
				assert.strictEqual(foundOld?.title, "Old Goal Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getKit", () => {
		it.effect("should return null when kit does not exist", () =>
			Effect.gen(function* () {
				const result = yield* getKit({ kitId: "non-existent-id" });
				assert.isNull(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return kit with nodes and edges", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const testNodes = [{ id: "1", type: "text", content: "Test" }];
				const testEdges = [{ id: "e1", source: "1", target: "2" }];

				yield* createTestKit(goalMap.id, teacher.id, {
					nodes: JSON.stringify(testNodes),
					edges: JSON.stringify(testEdges),
				});

				const result = yield* getKit({ kitId: goalMap.id });
				assert.isNotNull(result);
				assert.deepStrictEqual(result?.nodes, testNodes);
				assert.deepStrictEqual(result?.edges, testEdges);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty arrays when nodes/edges are not arrays", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				yield* createTestKit(goalMap.id, teacher.id, {
					nodes: "invalid",
					edges: "invalid",
				});

				const result = yield* getKit({ kitId: goalMap.id });
				assert.isNotNull(result);
				assert.deepStrictEqual(result?.nodes, []);
				assert.deepStrictEqual(result?.edges, []);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getKitStatus", () => {
		it.effect("should return status for non-existent kit", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.isFalse(result.exists);
				assert.isTrue(result.isOutdated);
				assert.strictEqual(result.nodeCount, 0);
				assert.strictEqual(result.layout, "preset");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return status for existing kit", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const testNodes = [
					{ id: "1", type: "text" },
					{ id: "2", type: "connector" },
					{ id: "3", type: "image" },
				];

				yield* createTestKit(goalMap.id, teacher.id, {
					nodes: JSON.stringify(testNodes),
					layout: "random",
				});

				const result = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.isTrue(result.exists);
				assert.strictEqual(result.layout, "random");
				assert.strictEqual(result.nodeCount, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should mark kit as outdated when goalMap is newer", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					updatedAt: new Date("2024-01-02"),
				});

				yield* createTestKit(goalMap.id, teacher.id, {
					updatedAt: new Date("2024-01-01"),
				});

				const result = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.isTrue(result.isOutdated);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should mark kit as not outdated when kit is newer", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					updatedAt: new Date("2024-01-01"),
				});

				yield* createTestKit(goalMap.id, teacher.id, {
					updatedAt: new Date("2024-01-02"),
				});

				const result = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.isFalse(result.isOutdated);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("generateKit", () => {
		it.effect("should return GoalMapNotFoundError when goalMap does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const result = yield* Effect.either(
					generateKit(teacher.id, {
						goalMapId: "non-existent-id",
					}),
				);

				assert.isTrue(Either.isLeft(result));
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create kit from goal map with text and connector nodes", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const testNodes = [
					{ id: "1", type: "text", content: "Text Node" },
					{ id: "2", type: "connector", label: "Connector" },
					{ id: "3", type: "image", url: "image.jpg" },
				];

				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					nodes: JSON.stringify(testNodes),
				});

				const result = yield* generateKit(teacher.id, {
					goalMapId: goalMap.id,
				});

				assert.isTrue(result.ok);
				assert.strictEqual(result.kitId, goalMap.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update existing kit", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				yield* createTestKit(goalMap.id, teacher.id);

				const result = yield* generateKit(teacher.id, {
					goalMapId: goalMap.id,
				});

				assert.isTrue(result.ok);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should use preset layout by default", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				yield* generateKit(teacher.id, {
					goalMapId: goalMap.id,
				});

				const status = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.strictEqual(status.layout, "preset");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should use specified layout", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				yield* generateKit(teacher.id, {
					goalMapId: goalMap.id,
					layout: "random",
				});

				const status = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.strictEqual(status.layout, "random");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should filter out non-text and non-connector nodes", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const testNodes = [
					{ id: "1", type: "text" },
					{ id: "2", type: "connector" },
					{ id: "3", type: "image" },
					{ id: "4", type: "link" },
				];

				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(testNodes),
				});

				yield* generateKit(teacher.id, {
					goalMapId: goalMap.id,
				});

				const status = yield* getKitStatus({ goalMapId: goalMap.id });
				assert.strictEqual(status.nodeCount, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
