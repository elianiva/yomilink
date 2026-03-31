import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { forms } from "@/server/db/schema/app-schema";

import { publishForm, unpublishForm } from "./form-service";

describe("form-service > publishForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should publish form", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			yield* publishForm(form.id);

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, form.id))
				.limit(1);

			expect(formRows[0]?.status).toBe("published");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return true on successful publish", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id);

			const result = yield* publishForm(form.id);

			expect(result).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("form-service > unpublishForm", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should unpublish form", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id, { status: "published" });

			yield* unpublishForm(form.id);

			const db = yield* Database;
			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, form.id))
				.limit(1);

			expect(formRows[0]?.status).toBe("draft");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return true on successful unpublish", () =>
		Effect.gen(function* () {
			const user = yield* createTestUser();
			const form = yield* createTestForm(user.id, { status: "published" });

			const result = yield* unpublishForm(form.id);

			expect(result).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
