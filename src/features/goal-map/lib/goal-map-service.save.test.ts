import { beforeEach, describe, expect, it } from "vite-plus/test";
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
	saveGoalMap,
} from "./goal-map-service";

describe("goal-map-service > saveGoalMap", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should create a new goal map when goalMapId is 'new'", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const result = yield* saveGoalMap(teacher.id, {
				goalMapId: "new",
				title: "New Goal Map",
				nodes: simpleGoalMap.nodes,
				edges: simpleGoalMap.edges,
			});

			expect(result.errors).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should update existing goal map", () =>
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

			expect(result.errors).toHaveLength(0);

			const updated = yield* getGoalMap({ goalMapId: goalMap.id });
			expect(updated?.title).toBe("Updated Title");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return validation errors for empty nodes", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const result = yield* Effect.either(
				saveGoalMap(teacher.id, {
					goalMapId: "new",
					title: "Invalid Goal Map",
					nodes: [],
					edges: [],
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("GoalMapValidationError");
				expect(result.left.errors.length).toBeGreaterThan(0);
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should fail when non-owner tries to update", () =>
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

			expect(Either.isLeft(result)).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should include propositions in result on success", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const result = yield* saveGoalMap(teacher.id, {
				goalMapId: "new",
				title: "Goal Map with Propositions",
				nodes: simpleGoalMap.nodes,
				edges: simpleGoalMap.edges,
			});

			expect(result.errors).toHaveLength(0);
			expect(result.propositions).toBeDefined();
			expect(result.propositions.length).toBeGreaterThan(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should save goal map with topic association", () =>
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

			expect(result.errors).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should save goal map with material text", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const result = yield* saveGoalMap(teacher.id, {
				goalMapId: "new",
				title: "Goal Map with Material",
				nodes: simpleGoalMap.nodes,
				edges: simpleGoalMap.edges,
				materialText: "This is learning material text",
			});

			expect(result.errors).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should update existing material text", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const firstSave = yield* saveGoalMap(teacher.id, {
				goalMapId: "new",
				title: "Goal Map with Material",
				nodes: simpleGoalMap.nodes,
				edges: simpleGoalMap.edges,
				materialText: "Original material",
			});
			expect(firstSave.errors).toHaveLength(0);

			const maps = yield* listGoalMaps(teacher.id);
			const goalMapId = maps[0].id;

			const result = yield* saveGoalMap(teacher.id, {
				goalMapId,
				title: "Goal Map with Material",
				nodes: simpleGoalMap.nodes,
				edges: simpleGoalMap.edges,
				materialText: "Updated material",
			});

			expect(result.errors).toHaveLength(0);

			const updated = yield* getGoalMap({ goalMapId });
			expect(updated?.materialText).toBe("Updated material");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
