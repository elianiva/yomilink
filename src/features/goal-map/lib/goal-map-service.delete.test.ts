import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect, Either } from "effect";

import {
	createTestGoalMap,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { deleteGoalMap, getGoalMap } from "./goal-map-service";

describe("goal-map-service > deleteGoalMap", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should delete goal map when user is owner", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const goalMap = yield* createTestGoalMap(teacher.id);

			const result = yield* deleteGoalMap(teacher.id, {
				goalMapId: goalMap.id,
			});

			expect(result).toBe(true);

			const deleted = yield* getGoalMap({ goalMapId: goalMap.id });
			expect(deleted).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should fail when non-owner tries to delete", () =>
		Effect.gen(function* () {
			const owner = yield* createTestUser({ email: "owner@example.com" });
			const otherUser = yield* createTestUser({ email: "other@example.com" });
			const goalMap = yield* createTestGoalMap(owner.id);

			const result = yield* Effect.either(
				deleteGoalMap(otherUser.id, { goalMapId: goalMap.id }),
			);

			expect(Either.isLeft(result)).toBe(true);

			const stillExists = yield* getGoalMap({ goalMapId: goalMap.id });
			expect(stillExists).not.toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should fail when goal map does not exist", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();

			const result = yield* Effect.either(
				deleteGoalMap(teacher.id, { goalMapId: "non-existent-id" }),
			);

			expect(Either.isLeft(result)).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
