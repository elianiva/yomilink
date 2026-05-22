import { assign, setup } from "xstate";

import type { GetStudentFormByIdOutput } from "@/features/form/lib/form-service.shared";

export type FormTakeEvent =
	| { type: "FORM.LOADED"; data: GetStudentFormByIdOutput }
	| { type: "FORM.LOAD_ERROR"; error: string }
	| { type: "SUBMIT" }
	| { type: "SUBMIT_DONE" }
	| { type: "SUBMIT_ERROR" }
	| { type: "ANSWER"; questionId: string; value: string | number };

export interface FormTakeContext {
	form: GetStudentFormByIdOutput["form"] | null;
	questions: GetStudentFormByIdOutput["questions"];
	submission: GetStudentFormByIdOutput["submission"];
	materialImages: GetStudentFormByIdOutput["materialImages"];
	answers: Record<string, string | number>;
	error: string | null;
}

export const formTakerMachine = setup({
	types: {
		context: {} as FormTakeContext,
		events: {} as FormTakeEvent,
	},
	actions: {
		setFormData: assign(({ event }) => {
			const e = event as Extract<FormTakeEvent, { type: "FORM.LOADED" }>;
			return {
				form: e.data.form,
				questions: e.data.questions,
				submission: e.data.submission,
				materialImages: e.data.materialImages,
			};
		}),
		setLoadError: assign(({ event }) => {
			const e = event as Extract<FormTakeEvent, { type: "FORM.LOAD_ERROR" }>;
			return { error: e.error };
		}),
		updateAnswer: assign(({ context, event }) => {
			const e = event as Extract<FormTakeEvent, { type: "ANSWER" }>;
			return {
				answers: { ...context.answers, [e.questionId]: e.value },
			};
		}),
	},
}).createMachine({
	id: "formTaker",
	initial: "loading",
	context: {
		form: null,
		questions: [],
		submission: null,
		materialImages: [],
		answers: {},
		error: null,
	},
	states: {
		loading: {
			on: {
				"FORM.LOADED": {
					target: "checkSubmission",
					actions: "setFormData",
				},
				"FORM.LOAD_ERROR": {
					target: "error",
					actions: "setLoadError",
				},
			},
		},
		checkSubmission: {
			always: [
				{
					guard: ({ context }) => context.submission !== null,
					target: "submitted",
				},
				{
					target: "drafting",
				},
			],
		},
		drafting: {
			on: {
				ANSWER: {
					actions: "updateAnswer",
				},
				SUBMIT: {
					target: "submitting",
				},
			},
		},
		submitting: {
			on: {
				SUBMIT_DONE: {
					target: "submitted",
				},
				SUBMIT_ERROR: {
					target: "drafting",
				},
			},
		},
		submitted: {},
		error: {},
	},
});
