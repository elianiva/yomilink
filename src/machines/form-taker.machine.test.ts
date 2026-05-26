import { createActor } from "xstate";
import { describe, expect, it } from "vite-plus/test";

import { formTakerMachine } from "./form-taker.machine";

const mockForm = {
	id: "f1",
	title: "Test Form",
	description: null,
	type: "pre_test" as const,
	status: "published" as const,
	audience: "all" as const,
	readingMaterialSections: null,
	createdBy: "teacher-1",
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

const mockQuestion = {
	id: "q1",
	formId: "f1",
	type: "text" as const,
	questionText: "What is this?",
	options: null,
	orderIndex: 0,
	required: true,
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

describe("formTakerMachine", () => {
	it("should start in loading state", () => {
		const actor = createActor(formTakerMachine).start();
		expect(actor.getSnapshot().value).toBe("loading");
		expect(actor.getSnapshot().context.answers).toEqual({});
	});

	it("should transition to drafting when form loaded without submission", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		expect(actor.getSnapshot().value).toBe("drafting");
		expect(actor.getSnapshot().context.form?.title).toBe("Test Form");
	});

	it("should transition to submitted when form has existing submission", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: {
					submittedAt: Date.now(),
					timeSpentSeconds: null,
					score: null,
					correctCount: 0,
					totalQuestions: 0,
					answers: {},
				},
				materialImages: [],
			},
		});
		expect(actor.getSnapshot().value).toBe("submitted");
	});

	it("should update answers on ANSWER event", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		actor.send({ type: "ANSWER", questionId: "q1", value: "My answer" });
		expect(actor.getSnapshot().context.answers).toEqual({ q1: "My answer" });
	});

	it("should override previous answer on repeated ANSWER", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		actor.send({ type: "ANSWER", questionId: "q1", value: "First" });
		actor.send({ type: "ANSWER", questionId: "q1", value: "Second" });
		expect(actor.getSnapshot().context.answers).toEqual({ q1: "Second" });
	});

	it("should transition to submitting on SUBMIT", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		actor.send({ type: "SUBMIT" });
		expect(actor.getSnapshot().value).toBe("submitting");
	});

	it("should transition to error on FORM.LOAD_ERROR", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({ type: "FORM.LOAD_ERROR", error: "Failed to load" });
		expect(actor.getSnapshot().value).toBe("error");
		expect(actor.getSnapshot().context.error).toBe("Failed to load");
	});

	it("should return to drafting on SUBMIT_ERROR", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		actor.send({ type: "SUBMIT" });
		actor.send({ type: "SUBMIT_ERROR" });
		expect(actor.getSnapshot().value).toBe("drafting");
	});

	it("should re-check submission on FORM.LOADED in submitting state", () => {
		const actor = createActor(formTakerMachine).start();
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: null,
				materialImages: [],
			},
		});
		actor.send({ type: "SUBMIT" });
		// Simulate callback returning updated form with submission
		actor.send({
			type: "FORM.LOADED",
			data: {
				form: mockForm,
				questions: [mockQuestion],
				submission: {
					submittedAt: Date.now(),
					timeSpentSeconds: null,
					score: null,
					correctCount: 0,
					totalQuestions: 0,
					answers: {},
				},
				materialImages: [],
			},
		});
		expect(actor.getSnapshot().value).toBe("submitted");
	});
});
