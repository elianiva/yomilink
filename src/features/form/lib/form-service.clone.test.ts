import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq, like } from "drizzle-orm";
import { Effect, Either } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { forms, questions } from "@/server/db/schema/app-schema";

import { cloneForm } from "./form-service";

describe("form-service > cloneForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should clone form with all questions", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const db = yield* Database;
			yield* db.insert(questions).values([
				{
					id: crypto.randomUUID(),
					formId: form.id,
					type: "mcq" as const,
					questionText: "Question 1",
					options: JSON.stringify([
						{ id: "o1", text: "A" },
						{ id: "o2", text: "B" },
						{ id: "o3", text: "C" },
					]),
					orderIndex: 0,
					required: true,
				},
				{
					id: crypto.randomUUID(),
					formId: form.id,
					type: "text" as const,
					questionText: "Question 2",
					options: null,
					orderIndex: 1,
					required: false,
				},
			]);

			const newUser = yield* createTestUser();
			yield* cloneForm(form.id, newUser.id);

			const clonedForm = yield* db
				.select()
				.from(forms)
				.where(like(forms.title, "% (Copy)"))
				.limit(1);

			expect(clonedForm).toHaveLength(1);
			expect(clonedForm[0]?.title).toBe(`${form.title} (Copy)`);
			expect(clonedForm[0]?.status).toBe("draft");

			const clonedQuestions = yield* db
				.select()
				.from(questions)
				.where(eq(questions.formId, clonedForm[0]?.id))
				.orderBy(questions.orderIndex);

			expect(clonedQuestions).toHaveLength(2);
			expect(clonedQuestions[0]?.questionText).toBe("Question 1");
			expect(clonedQuestions[1]?.questionText).toBe("Question 2");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError when form does not exist", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const result = yield* Effect.either(cloneForm("non-existent-id", user.id));

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should clone form description", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id, {
				description: "Original description",
			});

			const newUser = yield* createTestUser();
			yield* cloneForm(form.id, newUser.id);

			const db = yield* Database;
			const clonedForm = yield* db
				.select()
				.from(forms)
				.where(like(forms.title, "% (Copy)"))
				.limit(1);

			expect(clonedForm[0]?.description).toBe("Original description");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should set new form status to draft regardless of original", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id, { status: "published" });

			const newUser = yield* createTestUser();
			yield* cloneForm(form.id, newUser.id);

			const db = yield* Database;
			const clonedForm = yield* db
				.select()
				.from(forms)
				.where(like(forms.title, "% (Copy)"))
				.limit(1);

			expect(clonedForm[0]?.status).toBe("draft");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
