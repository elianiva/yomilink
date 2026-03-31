import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { listForms } from "./form-service";

describe("form-service > listForms", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return forms created by user", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			yield* createTestForm(user.id, { title: "Form 1" });
			yield* createTestForm(user.id, { title: "Form 2" });

			const result = yield* listForms(user.id);

			expect(result).toHaveLength(2);
			expect(result.map((f) => f.title).sort()).toEqual(["Form 1", "Form 2"]);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return empty array when no forms exist", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			const result = yield* listForms(user.id);

			expect(result).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should not return forms created by other users", () =>
		Effect.gen(function* () {
			const user1 = yield* createTestUser({ email: "user1@test.com" });
			const user2 = yield* createTestUser({ email: "user2@test.com" });

			yield* createTestForm(user1.id, { title: "User1 Form" });
			yield* createTestForm(user2.id, { title: "User2 Form" });

			const result = yield* listForms(user1.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.title).toBe("User1 Form");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should include form stats", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			yield* createTestForm(user.id, { title: "Form with Stats" });

			const result = yield* listForms(user.id);

			expect(result[0]?.stats).toBeDefined();
			expect(result[0]?.stats).toEqual({
				completed: 0,
				available: 0,
				locked: 0,
				total: 0,
			});
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should order forms by createdAt descending", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			yield* createTestForm(user.id, { title: "First Form" });
			yield* createTestForm(user.id, { title: "Second Form" });

			const result = yield* listForms(user.id);

			expect(result[0]?.title).toBe("Second Form");
			expect(result[1]?.title).toBe("First Form");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
