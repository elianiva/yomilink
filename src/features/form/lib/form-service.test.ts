import { assert, beforeEach, describe, it } from "@effect/vitest";
import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";
import {
	createTestForm,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { formResponses, forms, questions } from "@/server/db/schema/app-schema";
import {
	cloneForm,
	createForm,
	deleteForm,
	getFormById,
	listForms,
	publishForm,
	unpublishForm,
	updateForm,
} from "./form-service";

describe("form-service", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	describe("createForm", () => {
		it.effect("should create a form with valid data", () =>
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

				assert.equal(formRows.length, 1);
				assert.equal(formRows[0]?.title, "Test Form");
				assert.equal(formRows[0]?.description, "Test Description");
				assert.equal(formRows[0]?.type, "registration");
				assert.equal(formRows[0]?.status, "draft");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create form with default type when not provided", () =>
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

				assert.equal(formRows[0]?.type, "registration");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getFormById", () => {
		it.effect("should return form with questions", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);

				const db = yield* Database;
				yield* db.insert(questions).values({
					id: crypto.randomUUID(),
					formId: form.id,
					type: "mcq" as const,
					questionText: "What is 2+2?",
					options: JSON.stringify(["2", "3", "4", "5"]),
					orderIndex: 0,
					required: true,
				});

				const result = yield* getFormById(form.id);

				assert.equal(result.form.id, form.id);
				assert.equal(result.questions.length, 1);
				assert.equal(result.questions[0]?.questionText, "What is 2+2?");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(getFormById("non-existent-id"));

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("listForms", () => {
		it.effect("should return forms created by user", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				yield* createTestForm(user.id, { title: "Form 1" });
				yield* createTestForm(user.id, { title: "Form 2" });

				const result = yield* listForms(user.id);

				assert.equal(result.length, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty array when no forms exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* listForms(user.id);

				assert.equal(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("updateForm", () => {
		it.effect("should update form fields", () =>
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

				assert.equal(formRows[0]?.title, "Updated Title");
				assert.equal(formRows[0]?.description, "Updated Description");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					updateForm("non-existent-id", { title: "Test" }),
				);

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should block update when form has responses", () =>
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

				Either.match(result, {
					onLeft: (error) => {
						if (error._tag === "FormHasResponsesError") {
							assert.strictEqual(error._tag, "FormHasResponsesError");
							assert.equal(error.formId, form.id);
							assert.equal(error.responseCount, 1);
						} else {
							assert.fail(
								"Expected FormHasResponsesError but got " + error._tag,
							);
						}
					},
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should allow update when form has no responses", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);

				const result = yield* Effect.either(
					updateForm(form.id, { title: "Updated Title" }),
				);

				Either.match(result, {
					onLeft: () => assert.fail("Expected Right but got Left"),
					onRight: (data) => assert.equal(data.title, "Updated Title"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("deleteForm", () => {
		it.effect("should delete form", () =>
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

				assert.equal(formRows.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(deleteForm("non-existent-id"));

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("publishForm", () => {
		it.effect("should publish form", () =>
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

				assert.equal(formRows[0]?.status, "published");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("unpublishForm", () => {
		it.effect("should unpublish form", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id, {
					status: "published" as const,
				});

				yield* unpublishForm(form.id);

				const db = yield* Database;
				const formRows = yield* db
					.select()
					.from(forms)
					.where(eq(forms.id, form.id))
					.limit(1);

				assert.equal(formRows[0]?.status, "draft");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("cloneForm", () => {
		it.effect("should clone form with all questions", () =>
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
						options: JSON.stringify(["A", "B", "C"]),
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
				const result = yield* cloneForm(form.id, newUser.id);

				const clonedForm = yield* db
					.select()
					.from(forms)
					.where(eq(forms.id, result.id))
					.limit(1);

				const clonedQuestions = yield* db
					.select()
					.from(questions)
					.where(eq(questions.formId, result.id))
					.orderBy(questions.orderIndex);

				assert.equal(clonedForm.length, 1);
				assert.equal(clonedForm[0]?.title, `${form.title} (Copy)`);
				assert.equal(clonedQuestions.length, 2);
				assert.equal(clonedQuestions[0]?.questionText, "Question 1");
				assert.equal(clonedQuestions[1]?.questionText, "Question 2");
				assert.equal(clonedForm[0]?.status, "draft");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const result = yield* Effect.either(
					cloneForm("non-existent-id", user.id),
				);

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
