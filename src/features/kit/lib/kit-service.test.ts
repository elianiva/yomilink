import { beforeEach, describe, expect, it } from "vite-plus/test";
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
		it("should return empty array when no kits exist", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* listStudentKits();
					expect(result.length).toBe(0);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return all goal maps with kit info", () =>
			Effect.runPromise(
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
					expect(result.length).toBe(2);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return goal maps ordered by updatedAt descending", () =>
			Effect.runPromise(
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
					expect(foundOld).toBeDefined();
					expect(foundNew).toBeDefined();
					expect(foundNew?.title).toBe("New Goal Map");
					expect(foundOld?.title).toBe("Old Goal Map");
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});

	describe("getKit", () => {
		it("should return null when kit does not exist", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* getKit({ kitId: "non-existent-id" });
					expect(result).toBeNull();
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return kit with nodes and edges", () =>
			Effect.runPromise(
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
					expect(result).not.toBeNull();
					expect(result?.nodes).toStrictEqual(testNodes);
					expect(result?.edges).toStrictEqual(testEdges);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return empty arrays when nodes/edges are not arrays", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					yield* createTestKit(goalMap.id, teacher.id, {
						nodes: "invalid",
						edges: "invalid",
					});

					const result = yield* getKit({ kitId: goalMap.id });
					expect(result).not.toBeNull();
					expect(result?.nodes).toStrictEqual([]);
					expect(result?.edges).toStrictEqual([]);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});

	describe("getKitStatus", () => {
		it("should return status for non-existent kit", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					const result = yield* getKitStatus({ goalMapId: goalMap.id });
					expect(result.exists).toBe(false);
					expect(result.isOutdated).toBe(true);
					expect(result.nodeCount).toBe(0);
					expect(result.layout).toBe("preset");
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should return status for existing kit", () =>
			Effect.runPromise(
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
					expect(result.exists).toBe(true);
					expect(result.layout).toBe("random");
					expect(result.nodeCount).toBe(2);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should mark kit as outdated when goalMap is newer", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id, {
						updatedAt: new Date("2024-01-02"),
					});

					yield* createTestKit(goalMap.id, teacher.id, {
						updatedAt: new Date("2024-01-01"),
					});

					const result = yield* getKitStatus({ goalMapId: goalMap.id });
					expect(result.isOutdated).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should mark kit as not outdated when kit is newer", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id, {
						updatedAt: new Date("2024-01-01"),
					});

					yield* createTestKit(goalMap.id, teacher.id, {
						updatedAt: new Date("2024-01-02"),
					});

					const result = yield* getKitStatus({ goalMapId: goalMap.id });
					expect(result.isOutdated).toBe(false);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});

	describe("generateKit", () => {
		it("should return GoalMapNotFoundError when goalMap does not exist", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const result = yield* Effect.either(
						generateKit(teacher.id, {
							goalMapId: "non-existent-id",
						}),
					);

					expect(Either.isLeft(result)).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should create kit from goal map with text and connector nodes", () =>
			Effect.runPromise(
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

					expect(result).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should update existing kit", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					yield* createTestKit(goalMap.id, teacher.id);

					const result = yield* generateKit(teacher.id, {
						goalMapId: goalMap.id,
					});

					expect(result).toBe(true);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should use preset layout by default", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					yield* generateKit(teacher.id, {
						goalMapId: goalMap.id,
					});

					const status = yield* getKitStatus({ goalMapId: goalMap.id });
					expect(status.layout).toBe("preset");
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should use specified layout", () =>
			Effect.runPromise(
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					yield* generateKit(teacher.id, {
						goalMapId: goalMap.id,
						layout: "random",
					});

					const status = yield* getKitStatus({ goalMapId: goalMap.id });
					expect(status.layout).toBe("random");
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);

		it("should filter out non-text and non-connector nodes", () =>
			Effect.runPromise(
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
					expect(status.nodeCount).toBe(2);
				}).pipe(Effect.provide(DatabaseTest)),
			),
		);
	});
});
