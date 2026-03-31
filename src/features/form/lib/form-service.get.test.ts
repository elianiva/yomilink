import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { questions } from "@/server/db/schema/app-schema";

import { createForm, getFormById } from "./form-service";

describe("form-service > getFormById", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return form with questions", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const db = yield* Database;
			yield* db.insert(questions).values({
				id: crypto.randomUUID(),
				formId: form.id,
				type: "mcq" as const,
				questionText: "What is 2+2?",
				options: JSON.stringify([
					{ id: "o1", text: "2" },
					{ id: "o2", text: "3" },
					{ id: "o3", text: "4" },
					{ id: "o4", text: "5" },
				]),
				orderIndex: 0,
				required: true,
			});

			const result = yield* getFormById(form.id);

			expect(result.form.id).toBe(form.id);
			expect(result.questions).toHaveLength(1);
			expect(result.questions[0]?.questionText).toBe("What is 2+2?");
			expect(result.questions[0]?.type).toBe("mcq");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return empty questions array when no questions exist", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* getFormById(form.id);

			expect(result.form.id).toBe(form.id);
			expect(result.questions).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError for non-existent form", () =>
		Effect.gen(function* () {
			const result = yield* Effect.either(getFormById("non-existent-id"));

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should parse unlock conditions correctly", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const unlockConditions = {
				conditions: [{ type: "previous_form", formId: "prev-form" }],
			};

			const form = yield* createForm(user.id, {
				title: "Test Form",
				unlockConditions,
			});

			const result = yield* getFormById(form.id);

			expect(result.form.unlockConditions).toEqual(unlockConditions);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should include timestamps as epoch numbers", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* getFormById(form.id);

			expect(typeof result.form.createdAt).toBe("number");
			expect(typeof result.form.updatedAt).toBe("number");
			expect(result.form.createdAt).toBeGreaterThan(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
