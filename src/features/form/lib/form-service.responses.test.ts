import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect, Either } from "effect";

import {
	createTestForm,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import { getFormResponses, publishForm, submitFormResponse } from "./form-service";

describe("form-service > getFormResponses", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return paginated responses with user info", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);
			yield* publishForm(form.id);

			const student = yield* createTestUser({
				name: "Student One",
				email: "student1@test.com",
			});

			yield* submitFormResponse({
				formId: form.id,
				userId: student.id,
				answers: { q1: "answer1", q2: "answer2" },
				timeSpentSeconds: 120,
			});

			const result = yield* getFormResponses({ formId: form.id });

			expect(result.responses).toHaveLength(1);
			expect(result.responses[0]?.userId).toBe(student.id);
			expect(result.responses[0]?.user.name).toBe("Student One");
			expect(result.pagination.total).toBe(1);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return FormNotFoundError when form does not exist", () =>
		Effect.gen(function* () {
			const result = yield* Effect.either(
				getFormResponses({ formId: "non-existent-id" }),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("FormNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should paginate responses correctly", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);
			yield* publishForm(form.id);

			for (let i = 0; i < 5; i++) {
				const student = yield* createTestUser({
					name: `Student ${i + 1}`,
					email: `student${i + 1}@test.com`,
				});
				yield* submitFormResponse({
					formId: form.id,
					userId: student.id,
					answers: { q1: `answer${i + 1}` },
				});
			}

			const page1 = yield* getFormResponses({
				formId: form.id,
				page: 1,
				limit: 2,
			});

			expect(page1.responses).toHaveLength(2);
			expect(page1.pagination.total).toBe(5);
			expect(page1.pagination.totalPages).toBe(3);
			expect(page1.pagination.hasNextPage).toBe(true);

			const page3 = yield* getFormResponses({
				formId: form.id,
				page: 3,
				limit: 2,
			});

			expect(page3.responses).toHaveLength(1);
			expect(page3.pagination.hasNextPage).toBe(false);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return empty responses array when no responses exist", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* getFormResponses({ formId: form.id });

			expect(result.responses).toHaveLength(0);
			expect(result.pagination.total).toBe(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
