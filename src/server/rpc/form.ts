import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	CloneFormInput,
	CreateFormInput,
	CreateQuestionInput,
	cloneForm,
	createForm,
	createQuestion,
	deleteForm,
	deleteQuestion,
	GetFormResponsesInput,
	getFormById,
	getFormResponses,
	getRegistrationFormStatus,
	getStudentForms,
	listForms,
	publishForm,
	ReorderQuestionsInput,
	reorderQuestions,
	SubmitFormResponseInput,
	submitFormResponse,
	UpdateQuestionInput,
	unpublishForm,
	updateForm,
	updateQuestion,
} from "@/features/form/lib/form-service";
import {
	CheckFormUnlockInput,
	checkFormUnlock,
	UnlockFormInput,
	unlockForm,
} from "@/features/form/lib/unlock-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

const GetFormByIdInput = Schema.Struct({
	id: Schema.NonEmptyString,
});

type GetFormByIdInput = typeof GetFormByIdInput.Type;

export const createFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateFormInput)(raw))
	.handler(({ data, context }) =>
		createForm(context.user.id, data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("createForm"),
			Effect.tapError(logRpcError("createForm")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const getFormByIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		getFormById(data.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getFormById"),
			Effect.tapError(logRpcError("getFormById")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const listFormsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		listForms(context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listForms"),
			Effect.tapError(logRpcError("listForms")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const getStudentFormsRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.handler(({ context }) =>
		getStudentForms(context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getStudentForms"),
			Effect.tapError(logRpcError("getStudentForms")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const deleteFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		deleteForm(data.id).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("deleteForm"),
			Effect.tapError(logRpcError("deleteForm")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const publishFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		publishForm(data.id).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("publishForm"),
			Effect.tapError(logRpcError("publishForm")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const unpublishFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		unpublishForm(data.id).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("unpublishForm"),
			Effect.tapError(logRpcError("unpublishForm")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

const UpdateFormInput = Schema.Struct({
	formId: Schema.NonEmptyString,
	title: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	description: Schema.optionalWith(Schema.String, { nullable: true }),
	type: Schema.optionalWith(
		Schema.Union(
			Schema.Literal("pre_test"),
			Schema.Literal("post_test"),
			Schema.Literal("delayed_test"),
			Schema.Literal("registration"),
			Schema.Literal("tam"),
			Schema.Literal("control"),
		),
		{ nullable: true },
	),
	status: Schema.optionalWith(
		Schema.Union(Schema.Literal("draft"), Schema.Literal("published")),
		{ nullable: true },
	),
});

type UpdateFormInput = typeof UpdateFormInput.Type;

export const updateFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateFormInput)(raw))
	.handler(({ data }) =>
		updateForm(data.formId, {
			title: data.title,
			description: data.description,
			type: data.type,
			status: data.status,
		}).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("updateForm"),
			Effect.tapError(logRpcError("updateForm")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
				FormHasResponsesError: () => Rpc.err("Cannot update form: form has responses"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const cloneFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CloneFormInput)(raw))
	.handler(({ data, context }) =>
		cloneForm(data.formId, context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("cloneForm"),
			Effect.tapError(logRpcError("cloneForm")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const getFormResponsesRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormResponsesInput)(raw))
	.handler(({ data }) =>
		getFormResponses(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getFormResponses"),
			Effect.tapError(logRpcError("getFormResponses")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const submitFormResponseRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitFormResponseInput)(raw))
	.handler(({ data }) =>
		submitFormResponse(data).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("submitFormResponse"),
			Effect.tapError(logRpcError("submitFormResponse")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
				FormNotPublishedError: () => Rpc.err("Form is not published"),
				FormAlreadySubmittedError: () => Rpc.err("You have already submitted this form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const reorderQuestionsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(ReorderQuestionsInput)(raw))
	.handler(({ data }) =>
		reorderQuestions(data).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("reorderQuestions"),
			Effect.tapError(logRpcError("reorderQuestions")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
				FormHasResponsesError: () =>
					Rpc.err("Cannot reorder questions: form has responses"),
				InvalidQuestionOrderError: () =>
					Rpc.err("Invalid question order: question count mismatch or invalid IDs"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const createQuestionRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateQuestionInput)(raw))
	.handler(({ data }) =>
		createQuestion(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("createQuestion"),
			Effect.tapError(logRpcError("createQuestion")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
				FormHasResponsesError: () => Rpc.err("Cannot add questions: form has responses"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

const GetQuestionByIdInput = Schema.Struct({
	id: Schema.NonEmptyString,
});

type GetQuestionByIdInput = typeof GetQuestionByIdInput.Type;

export const updateQuestionRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateQuestionInput)(raw))
	.handler(({ data }) =>
		updateQuestion(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("updateQuestion"),
			Effect.tapError(logRpcError("updateQuestion")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				QuestionNotFoundError: () => Rpc.notFound("Question"),
				FormHasResponsesError: () => Rpc.err("Cannot edit question: form has responses"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const deleteQuestionRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetQuestionByIdInput)(raw))
	.handler(({ data }) =>
		deleteQuestion(data.id).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("deleteQuestion"),
			Effect.tapError(logRpcError("deleteQuestion")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				QuestionNotFoundError: () => Rpc.notFound("Question"),
				FormHasResponsesError: () => Rpc.err("Cannot delete question: form has responses"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const checkFormUnlockRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CheckFormUnlockInput)(raw))
	.handler(({ data, context }) =>
		checkFormUnlock({ formId: data.formId, userId: context.user.id }).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("checkFormUnlock"),
			Effect.tapError(logRpcError("checkFormUnlock")),
			Effect.provide(AppLayer),
			Effect.catchTags({
				FormNotFoundError: () => Rpc.notFound("Form"),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const unlockFormRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UnlockFormInput)(raw))
	.handler(({ data }) =>
		unlockForm({ formId: data.formId, userId: data.userId }).pipe(
			Effect.map(() => Rpc.ok(true)),
			Effect.withSpan("unlockForm"),
			Effect.tapError(logRpcError("unlockForm")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const getRegistrationFormStatusRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.handler(({ context }) =>
		getRegistrationFormStatus(context.user.id).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("getRegistrationFormStatus"),
			Effect.tapError(logRpcError("getRegistrationFormStatus")),
			Effect.provide(AppLayer),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.runPromise,
		),
	);

export const FormRpc = {
	forms: () => ["forms"],
	createForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "create"],
			mutationFn: (data: CreateFormInput) => createFormRpc({ data }),
		}),
	getFormById: (input: GetFormByIdInput) =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "byId", input.id],
			queryFn: () => getFormByIdRpc({ data: input }),
		}),
	listForms: () =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "list"],
			queryFn: () => listFormsRpc(),
		}),
	getStudentForms: () =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "student"],
			queryFn: () => getStudentFormsRpc(),
		}),
	getRegistrationFormStatus: () =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "registration-status"],
			queryFn: () => getRegistrationFormStatusRpc(),
		}),
	deleteForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "delete"],
			mutationFn: (data: GetFormByIdInput) => deleteFormRpc({ data }),
		}),
	publishForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "publish"],
			mutationFn: (data: GetFormByIdInput) => publishFormRpc({ data }),
		}),
	unpublishForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "unpublish"],
			mutationFn: (data: GetFormByIdInput) => unpublishFormRpc({ data }),
		}),
	updateForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "update"],
			mutationFn: (data: UpdateFormInput) => updateFormRpc({ data }),
		}),
	cloneForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "clone"],
			mutationFn: (data: CloneFormInput) => cloneFormRpc({ data }),
		}),
	getFormResponses: (input: GetFormResponsesInput) =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "responses", input.formId, input.page ?? 1],
			queryFn: () => getFormResponsesRpc({ data: input }),
		}),
	submitFormResponse: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "submit"],
			mutationFn: (data: SubmitFormResponseInput) => submitFormResponseRpc({ data }),
		}),
	reorderQuestions: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "reorder"],
			mutationFn: (data: ReorderQuestionsInput) => reorderQuestionsRpc({ data }),
		}),
	createQuestion: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "createQuestion"],
			mutationFn: (data: CreateQuestionInput) => createQuestionRpc({ data }),
		}),
	updateQuestion: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "updateQuestion"],
			mutationFn: (data: UpdateQuestionInput) => updateQuestionRpc({ data }),
		}),
	deleteQuestion: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "deleteQuestion"],
			mutationFn: (data: GetQuestionByIdInput) => deleteQuestionRpc({ data }),
		}),
	checkFormUnlock: (input: { formId: string }) =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "checkUnlock", input.formId],
			queryFn: () => checkFormUnlockRpc({ data: input }),
		}),
	unlockForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "unlock"],
			mutationFn: (data: UnlockFormInput) => unlockFormRpc({ data }),
		}),
};
