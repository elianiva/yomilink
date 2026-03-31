import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";

import {
	createTestForm,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import {
	getRegistrationFormStatus,
	getStudentForms,
	publishForm,
	submitFormResponse,
} from "./form-service";

describe("form-service > getStudentForms", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return published forms for student", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			const form = yield* createTestForm(teacher.id, {
				title: "Test Form",
				type: "registration",
			});
			yield* publishForm(form.id);

			const result = yield* getStudentForms(student.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe(form.id);
			expect(result[0]?.title).toBe("Test Form");
			expect(result[0]?.isUnlocked).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should not return draft forms", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			yield* createTestForm(teacher.id, {
				title: "Draft Form",
				type: "registration",
			});

			const result = yield* getStudentForms(student.id);

			expect(result).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should mark completed forms correctly", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			const form = yield* createTestForm(teacher.id, {
				title: "Test Form",
				type: "registration",
			});
			yield* publishForm(form.id);

			yield* submitFormResponse({
				formId: form.id,
				userId: student.id,
				answers: {},
				timeSpentSeconds: 60,
			});

			const result = yield* getStudentForms(student.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.unlockStatus).toBe("completed");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return empty array when no forms exist", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser();

			const result = yield* getStudentForms(student.id);

			expect(result).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("form-service > getRegistrationFormStatus", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return hasRegistrationForm=false when no registration form exists", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser();

			const result = yield* getRegistrationFormStatus(student.id);

			expect(result.hasRegistrationForm).toBe(false);
			expect(result.isCompleted).toBe(true);
			expect(result.formId).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return hasRegistrationForm=true and isCompleted=false when not completed", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			const form = yield* createTestForm(teacher.id, {
				title: "Registration Form",
				type: "registration",
			});
			yield* publishForm(form.id);

			const result = yield* getRegistrationFormStatus(student.id);

			expect(result.hasRegistrationForm).toBe(true);
			expect(result.isCompleted).toBe(false);
			expect(result.formId).toBe(form.id);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return hasRegistrationForm=true and isCompleted=true when completed", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			const form = yield* createTestForm(teacher.id, {
				title: "Registration Form",
				type: "registration",
			});
			yield* publishForm(form.id);

			yield* submitFormResponse({
				formId: form.id,
				userId: student.id,
				answers: {},
				timeSpentSeconds: 60,
			});

			const result = yield* getRegistrationFormStatus(student.id);

			expect(result.hasRegistrationForm).toBe(true);
			expect(result.isCompleted).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should only check published registration forms (not drafts)", () =>
		Effect.gen(function* () {
			const teacher = yield* createTestUser();
			const student = yield* createTestUser();

			yield* createTestForm(teacher.id, {
				title: "Draft Registration Form",
				type: "registration",
			});

			const result = yield* getRegistrationFormStatus(student.id);

			expect(result.hasRegistrationForm).toBe(false);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
