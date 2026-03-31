import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";

import {
	createTestForm,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { formProgress, formResponses } from "@/server/db/schema/app-schema";

import { publishForm, submitFormResponse } from "./form-service";

describe("form-service > submitFormResponse", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should submit response for published form", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);
			yield* publishForm(form.id);

			const result = yield* submitFormResponse({
				formId: form.id,
				userId: user.id,
				answers: { q1: "answer1", q2: "answer2" },
				timeSpentSeconds: 120,
			});

			expect(result).toBe(true);

			const db = yield* Database;
			const responseRows = yield* db
				.select()
				.from(formResponses)
				.where(eq(formResponses.formId, form.id))
				.limit(1);

			expect(responseRows).toHaveLength(1);
			expect(responseRows[0]?.formId).toBe(form.id);
			expect(responseRows[0]?.userId).toBe(user.id);
			expect(responseRows[0]?.timeSpentSeconds).toBe(120);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError when form does not exist", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			const result = yield* Effect.either(
				submitFormResponse({
					formId: "non-existent-id",
					userId: user.id,
					answers: { q1: "answer" },
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotPublishedError when form is draft", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* Effect.either(
				submitFormResponse({
					formId: form.id,
					userId: user.id,
					answers: { q1: "answer" },
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotPublishedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormAlreadySubmittedError when user already submitted", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);
			yield* publishForm(form.id);

			yield* submitFormResponse({
				formId: form.id,
				userId: user.id,
				answers: { q1: "first answer" },
			});

			const result = yield* Effect.either(
				submitFormResponse({
					formId: form.id,
					userId: user.id,
					answers: { q1: "second answer" },
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormAlreadySubmittedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should update form progress to completed on submission", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);
			yield* publishForm(form.id);

			const db = yield* Database;
			yield* db.insert(formProgress).values({
				id: crypto.randomUUID(),
				formId: form.id,
				userId: user.id,
				status: "available",
				unlockedAt: new Date(),
			});

			yield* submitFormResponse({
				formId: form.id,
				userId: user.id,
				answers: { q1: "answer" },
			});

			const progressRows = yield* db
				.select()
				.from(formProgress)
				.where(eq(formProgress.formId, form.id));

			expect(progressRows).toHaveLength(1);
			expect(progressRows[0]?.status).toBe("completed");
			expect(progressRows[0]?.completedAt).toBeTruthy();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should allow different users to submit to same form", () =>
		Effect.gen(function* () {
			const user1 = yield* createTestUser();
			const user2 = yield* createTestUser();
			const form = yield* createTestForm(user1.id);
			yield* publishForm(form.id);

			yield* submitFormResponse({
				formId: form.id,
				userId: user1.id,
				answers: { q1: "user1 answer" },
			});

			yield* submitFormResponse({
				formId: form.id,
				userId: user2.id,
				answers: { q1: "user2 answer" },
			});

			const db = yield* Database;
			const responseRows = yield* db
				.select()
				.from(formResponses)
				.where(eq(formResponses.formId, form.id));

			expect(responseRows).toHaveLength(2);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
