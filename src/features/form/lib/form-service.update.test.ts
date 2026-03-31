import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { formResponses, forms } from "@/server/db/schema/app-schema";

import { deleteForm, updateForm } from "./form-service";

describe("form-service > updateForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should update form fields", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			yield* updateForm(form.id, {
				title: "Updated Title",
				description: "Updated Description",
			});

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, form.id))
				.limit(1);

			expect(formRows[0]?.title).toBe("Updated Title");
			expect(formRows[0]?.description).toBe("Updated Description");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError when form does not exist", () =>
		Effect.gen(function* () {
			const result = yield* Effect.either(
				updateForm("non-existent-id", { title: "Test" }),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should block update when form has responses", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const db = yield* Database;
			yield* db.insert(formResponses).values({
				id: crypto.randomUUID(),
				formId: form.id,
				userId: user.id,
				answers: JSON.stringify({ q1: "answer" }),
				submittedAt: new Date(),
				timeSpentSeconds: 120,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const result = yield* Effect.either(
				updateForm(form.id, { title: "Updated Title" }),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormHasResponsesError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should allow update when form has no responses", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* Effect.either(
				updateForm(form.id, { title: "Updated Title" }),
			);

			expect(Either.isRight(result)).toBe(true);
			if (Either.isRight(result)) {
				expect(result.right.title).toBe("Updated Title");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should update form status to published", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			yield* updateForm(form.id, { status: "published" });

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, form.id))
				.limit(1);

			expect(formRows[0]?.status).toBe("published");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("form-service > deleteForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should delete form", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			yield* deleteForm(form.id);

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, form.id))
				.limit(1);

			expect(formRows).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError when form does not exist", () =>
		Effect.gen(function* () {
			const result = yield* Effect.either(deleteForm("non-existent-id"));

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return true on successful deletion", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* deleteForm(form.id);

			expect(result).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
