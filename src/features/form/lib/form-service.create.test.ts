import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { forms } from "@/server/db/schema/app-schema";

import { createForm } from "./form-service";

describe("form-service > createForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should create a form with valid data", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			const result = yield* createForm(user.id, {
				title: "Test Form",
				description: "Test Description",
				type: "registration",
			});

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, result.id))
				.limit(1);

			expect(formRows).toHaveLength(1);
			expect(formRows[0]?.title).toBe("Test Form");
			expect(formRows[0]?.description).toBe("Test Description");
			expect(formRows[0]?.type).toBe("registration");
			expect(formRows[0]?.status).toBe("draft");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should create form with default type when not provided", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			const result = yield* createForm(user.id, {
				title: "Test Form",
			});

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, result.id))
				.limit(1);

			expect(formRows[0]?.type).toBe("registration");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should generate unique form IDs", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();

			const result1 = yield* createForm(user.id, { title: "Form 1" });
			const result2 = yield* createForm(user.id, { title: "Form 2" });

			expect(result1.id).not.toBe(result2.id);
			expect(result1.id.length).toBeGreaterThan(0);
			expect(result2.id.length).toBeGreaterThan(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should create form with all form types", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const types = [
				"pre_test",
				"post_test",
				"delayed_test",
				"registration",
				"tam",
				"control",
			] as const;

			for (const type of types) {
				const result = yield* createForm(user.id, { title: `Form ${type}`, type });
				const db = yield* Database;
				const formRows = yield* db
					.select()
					.from(forms)
					.where(eq(forms.id, result.id))
					.limit(1);

				expect(formRows[0]?.type).toBe(type);
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
