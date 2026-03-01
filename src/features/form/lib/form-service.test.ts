import { assert, beforeEach, describe, it } from "@effect/vitest";
import { eq, like } from "drizzle-orm";
import { Effect, Either } from "effect";

import { createTestForm, createTestUser } from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { formProgress, formResponses, forms, questions } from "@/server/db/schema/app-schema";

import {
	cloneForm,
	createForm,
	deleteForm,
	getFormById,
	getFormResponses,
	getRegistrationFormStatus,
	getStudentForms,
	listForms,
	publishForm,
	submitFormResponse,
	unpublishForm,
	updateForm,
} from "./form-service";

describe("form-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));

	describe("createForm", () => {
		it.effect("should create a form with valid data", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				yield* createForm(user.id, {
					title: "Test Form",
					description: "Test Description",
					type: "registration",
				});

				const db = yield* Database;
				const formRows = yield* db
					.select()
					.from(forms)
					.where(eq(forms.title, "Test Form"))
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

				yield* createForm(user.id, {
					title: "Test Form",
				});

				const db = yield* Database;
				const formRows = yield* db
					.select()
					.from(forms)
					.where(eq(forms.title, "Test Form"))
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
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
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
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
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
							assert.fail(`Expected FormHasResponsesError but got ${error._tag}`);
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
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
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
				yield* cloneForm(form.id, newUser.id);

				const clonedForm = yield* db
					.select()
					.from(forms)
					.where(like(forms.title, "% (Copy)"))
					.limit(1);
				const clonedQuestions = yield* db
					.select()
					.from(questions)
					.where(eq(questions.formId, clonedForm[0]?.id))
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
				const result = yield* Effect.either(cloneForm("non-existent-id", user.id));

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("submitFormResponse", () => {
		it.effect("should submit response for published form", () =>
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

				const db = yield* Database;
				const responseRows = yield* db
					.select()
					.from(formResponses)
					.where(eq(formResponses.formId, form.id))
					.limit(1);

				assert.equal(responseRows.length, 1);
				assert.equal(responseRows[0]?.formId, form.id);
				assert.equal(responseRows[0]?.userId, user.id);
				assert.deepEqual(responseRows[0]?.answers, {
					q1: "answer1",
					q2: "answer2",
				});
				assert.equal(responseRows[0]?.timeSpentSeconds, 120);
				assert.strictEqual(result, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					submitFormResponse({
						formId: "non-existent-id",
						userId: user.id,
						answers: { q1: "answer" },
					}),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotPublishedError when form is draft", () =>
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

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotPublishedError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormAlreadySubmittedError when user already submitted", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);
				yield* publishForm(form.id);

				// First submission
				yield* submitFormResponse({
					formId: form.id,
					userId: user.id,
					answers: { q1: "first answer" },
				});

				// Second submission should fail
				const result = yield* Effect.either(
					submitFormResponse({
						formId: form.id,
						userId: user.id,
						answers: { q1: "second answer" },
					}),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "FormAlreadySubmittedError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update form progress to completed on submission", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);
				yield* publishForm(form.id);

				const db = yield* Database;
				// Insert initial progress as available
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

				assert.equal(progressRows.length, 1);
				assert.equal(progressRows[0]?.status, "completed");
				assert.ok(progressRows[0]?.completedAt);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should allow different users to submit to same form", () =>
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

				assert.equal(responseRows.length, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getFormResponses", () => {
		it.effect("should return paginated responses with user info", () =>
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

				assert.equal(result.responses.length, 1);
				assert.equal(result.responses[0]?.userId, student.id);
				assert.equal(result.responses[0]?.user.name, "Student One");
				assert.equal(result.responses[0]?.user.email, "student1@test.com");
				assert.deepEqual(result.responses[0]?.answers, {
					q1: "answer1",
					q2: "answer2",
				});
				assert.equal(result.responses[0]?.timeSpentSeconds, 120);
				assert.ok(result.pagination);
				assert.equal(result.pagination.total, 1);
				assert.equal(result.pagination.page, 1);
				assert.equal(result.pagination.totalPages, 1);
				assert.equal(result.pagination.hasNextPage, false);
				assert.equal(result.pagination.hasPrevPage, false);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return FormNotFoundError when form does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					getFormResponses({ formId: "non-existent-id" }),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "FormNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should paginate responses correctly", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);
				yield* publishForm(form.id);

				// Create 5 responses
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

				// Get page 1 with limit 2
				const page1 = yield* getFormResponses({
					formId: form.id,
					page: 1,
					limit: 2,
				});

				assert.equal(page1.responses.length, 2);
				assert.equal(page1.pagination.total, 5);
				assert.equal(page1.pagination.page, 1);
				assert.equal(page1.pagination.totalPages, 3);
				assert.equal(page1.pagination.hasNextPage, true);
				assert.equal(page1.pagination.hasPrevPage, false);

				// Get page 2
				const page2 = yield* getFormResponses({
					formId: form.id,
					page: 2,
					limit: 2,
				});

				assert.equal(page2.responses.length, 2);
				assert.equal(page2.pagination.page, 2);
				assert.equal(page2.pagination.hasNextPage, true);
				assert.equal(page2.pagination.hasPrevPage, true);

				// Get page 3 (last page)
				const page3 = yield* getFormResponses({
					formId: form.id,
					page: 3,
					limit: 2,
				});

				assert.equal(page3.responses.length, 1);
				assert.equal(page3.pagination.page, 3);
				assert.equal(page3.pagination.hasNextPage, false);
				assert.equal(page3.pagination.hasPrevPage, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty responses array when no responses exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();
				const form = yield* createTestForm(user.id);

				const result = yield* getFormResponses({ formId: form.id });

				assert.equal(result.responses.length, 0);
				assert.equal(result.pagination.total, 0);
				assert.equal(result.pagination.totalPages, 0);
				assert.equal(result.pagination.hasNextPage, false);
				assert.equal(result.pagination.hasPrevPage, false);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getStudentForms", () => {
		it.effect("should return published forms for student", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser();

				// Create and publish a form
				const form = yield* createTestForm(teacher.id, {
					title: "Test Form",
					type: "registration",
				});
				yield* publishForm(form.id);

				const result = yield* getStudentForms(student.id);

				assert.equal(result.length, 1);
				assert.equal(result[0]?.id, form.id);
				assert.equal(result[0]?.title, "Test Form");
				assert.equal(result[0]?.isUnlocked, true);
				assert.equal(result[0]?.unlockStatus, "available");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should not return draft forms", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser();

				// Create a draft form (not published)
				yield* createTestForm(teacher.id, {
					title: "Draft Form",
					type: "registration",
				});

				const result = yield* getStudentForms(student.id);

				assert.equal(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should mark completed forms correctly", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser();

				// Create and publish a form
				const form = yield* createTestForm(teacher.id, {
					title: "Test Form",
					type: "registration",
				});
				yield* publishForm(form.id);

				// Submit the form
				yield* submitFormResponse({
					formId: form.id,
					userId: student.id,
					answers: {},
					timeSpentSeconds: 60,
				});

				const result = yield* getStudentForms(student.id);

				assert.equal(result.length, 1);
				assert.equal(result[0]?.unlockStatus, "completed");
				assert.equal(result[0]?.isUnlocked, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return empty array when no forms exist", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser();

				const result = yield* getStudentForms(student.id);

				assert.equal(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getRegistrationFormStatus", () => {
		it.effect("should return hasRegistrationForm=false when no registration form exists", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser();

				const result = yield* getRegistrationFormStatus(student.id);

				assert.equal(result.hasRegistrationForm, false);
				assert.equal(result.isCompleted, true);
				assert.equal(result.formId, null);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return hasRegistrationForm=true and isCompleted=false when registration form is not completed",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const student = yield* createTestUser();

					// Create and publish a registration form
					const form = yield* createTestForm(teacher.id, {
						title: "Registration Form",
						type: "registration",
					});
					yield* publishForm(form.id);

					const result = yield* getRegistrationFormStatus(student.id);

					assert.equal(result.hasRegistrationForm, true);
					assert.equal(result.isCompleted, false);
					assert.equal(result.formId, form.id);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return hasRegistrationForm=true and isCompleted=true when registration form is completed",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const student = yield* createTestUser();

					// Create and publish a registration form
					const form = yield* createTestForm(teacher.id, {
						title: "Registration Form",
						type: "registration",
					});
					yield* publishForm(form.id);

					// Submit the form
					yield* submitFormResponse({
						formId: form.id,
						userId: student.id,
						answers: {},
						timeSpentSeconds: 60,
					});

					const result = yield* getRegistrationFormStatus(student.id);

					assert.equal(result.hasRegistrationForm, true);
					assert.equal(result.isCompleted, true);
					assert.equal(result.formId, form.id);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should only check published registration forms (not drafts)", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser();

				// Create a draft registration form (not published)
				yield* createTestForm(teacher.id, {
					title: "Draft Registration Form",
					type: "registration",
				});

				const result = yield* getRegistrationFormStatus(student.id);

				// Should return false because the form is not published
				assert.equal(result.hasRegistrationForm, false);
				assert.equal(result.isCompleted, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
