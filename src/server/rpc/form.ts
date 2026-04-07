import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
	CloneFormInput,
	CreateFormInput,
	CreateQuestionInput,
	GetFormByIdInput,
	GetQuestionByIdInput,
	UpdateFormInput,
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
	getStudentFormById,
	listForms,
	publishForm,
	ReorderQuestionsInput,
	reorderQuestions,
	submitFormResponse,
	UpdateQuestionInput,
	unpublishForm,
	updateForm,
	updateQuestion,
} from "@/features/form/lib/form-service";
import { checkFormUnlock, UnlockFormInput, unlockForm } from "@/features/form/lib/unlock-service";
import { requireRoleMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const createFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateFormInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			createForm(context.user.id, data).pipe(
				Effect.map((result) => Rpc.ok(result)),
				Effect.withSpan("createForm"),
				Effect.tapError(logRpcError("createForm")),
				Effect.catchAll(logAndReturnError("createForm")),
				Effect.catchAllDefect(logAndReturnDefect("createForm")),
			),
		),
	);

export const getFormByIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getFormById(data.formId).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getFormById"),
				Effect.tapError(logRpcError("getFormById")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("getFormById")),
				Effect.catchAllDefect(logAndReturnDefect("getFormById")),
			),
		),
	);

export const listFormsRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			listForms(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("listForms"),
				Effect.tapError(logRpcError("listForms")),
				Effect.catchAll(logAndReturnError("listForms")),
				Effect.catchAllDefect(logAndReturnDefect("listForms")),
			),
		),
	);

export const getStudentFormsRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			getStudentForms(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getStudentForms"),
				Effect.tapError(logRpcError("getStudentForms")),
				Effect.catchAll(logAndReturnError("getStudentForms")),
				Effect.catchAllDefect(logAndReturnDefect("getStudentForms")),
			),
		),
	);

export const GetStudentFormByIdInput = Schema.Struct({
	formId: Schema.String,
});

export type GetStudentFormByIdInput = typeof GetStudentFormByIdInput.Type;

export const getStudentFormByIdRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetStudentFormByIdInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			getStudentFormById(data.formId, context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getStudentFormById"),
				Effect.tapError(logRpcError("getStudentFormById")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
					FormNotAccessibleError: () =>
						Rpc.err(
							"Form is not accessible. Complete prerequisites or wait for it to be published.",
						),
				}),
				Effect.catchAll(logAndReturnError("getStudentFormById")),
				Effect.catchAllDefect(logAndReturnDefect("getStudentFormById")),
			),
		),
	);

export const deleteFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			deleteForm(data.formId).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("deleteForm"),
				Effect.tapError(logRpcError("deleteForm")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("deleteForm")),
				Effect.catchAllDefect(logAndReturnDefect("deleteForm")),
			),
		),
	);

export const publishFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			publishForm(data.formId).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("publishForm"),
				Effect.tapError(logRpcError("publishForm")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("publishForm")),
				Effect.catchAllDefect(logAndReturnDefect("publishForm")),
			),
		),
	);

export const unpublishFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormByIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			unpublishForm(data.formId).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("unpublishForm"),
				Effect.tapError(logRpcError("unpublishForm")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("unpublishForm")),
				Effect.catchAllDefect(logAndReturnDefect("unpublishForm")),
			),
		),
	);

export const updateFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateFormInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			updateForm(data.formId, {
				title: data.title,
				description: data.description,
				type: data.type,
				status: data.status,
				unlockConditions: data.unlockConditions,
			}).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("updateForm"),
				Effect.tapError(logRpcError("updateForm")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
					FormHasResponsesError: () => Rpc.err("Cannot update form: form has responses"),
				}),
				Effect.catchAll(logAndReturnError("updateForm")),
				Effect.catchAllDefect(logAndReturnDefect("updateForm")),
			),
		),
	);

export const cloneFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CloneFormInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			cloneForm(data.formId, context.user.id).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("cloneForm"),
				Effect.tapError(logRpcError("cloneForm")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("cloneForm")),
				Effect.catchAllDefect(logAndReturnDefect("cloneForm")),
			),
		),
	);

export const getFormResponsesRpc = createServerFn()
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetFormResponsesInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getFormResponses(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getFormResponses"),
				Effect.tapError(logRpcError("getFormResponses")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("getFormResponses")),
				Effect.catchAllDefect(logAndReturnDefect("getFormResponses")),
			),
		),
	);

export const SubmitFormResponseInput = Schema.Struct({
	formId: Schema.String,
	answers: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	timeSpentSeconds: Schema.optionalWith(Schema.Int, { nullable: true }),
});

export type SubmitFormResponseInput = typeof SubmitFormResponseInput.Type;

export const submitFormResponseRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(SubmitFormResponseInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			submitFormResponse({
				...data,
				userId: context.user.id,
			}).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("submitFormResponse"),
				Effect.tapError(logRpcError("submitFormResponse")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
					FormNotPublishedError: () => Rpc.err("Form is not published"),
					FormAlreadySubmittedError: () =>
						Rpc.err("You have already submitted this form"),
				}),
				Effect.catchAll(logAndReturnError("submitFormResponse")),
				Effect.catchAllDefect(logAndReturnDefect("submitFormResponse")),
			),
		),
	);

export const reorderQuestionsRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(ReorderQuestionsInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			reorderQuestions(data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("reorderQuestions"),
				Effect.tapError(logRpcError("reorderQuestions")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
					FormHasResponsesError: () =>
						Rpc.err("Cannot reorder questions: form has responses"),
					InvalidQuestionOrderError: () =>
						Rpc.err("Invalid question order: question count mismatch or invalid IDs"),
				}),
				Effect.catchAll(logAndReturnError("reorderQuestions")),
				Effect.catchAllDefect(logAndReturnDefect("reorderQuestions")),
			),
		),
	);

export const createQuestionRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateQuestionInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			createQuestion(data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("createQuestion"),
				Effect.tapError(logRpcError("createQuestion")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
					FormHasResponsesError: () =>
						Rpc.err("Cannot add questions: form has responses"),
				}),
				Effect.catchAll(logAndReturnError("createQuestion")),
				Effect.catchAllDefect(logAndReturnDefect("createQuestion")),
			),
		),
	);

export const updateQuestionRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UpdateQuestionInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			updateQuestion(data).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("updateQuestion"),
				Effect.tapError(logRpcError("updateQuestion")),
				Effect.catchTags({
					QuestionNotFoundError: () => Rpc.notFound("Question"),
					FormHasResponsesError: () =>
						Rpc.err("Cannot edit question: form has responses"),
				}),
				Effect.catchAll(logAndReturnError("updateQuestion")),
				Effect.catchAllDefect(logAndReturnDefect("updateQuestion")),
			),
		),
	);

export const deleteQuestionRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetQuestionByIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			deleteQuestion(data.id).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("deleteQuestion"),
				Effect.tapError(logRpcError("deleteQuestion")),
				Effect.catchTags({
					QuestionNotFoundError: () => Rpc.notFound("Question"),
					FormHasResponsesError: () =>
						Rpc.err("Cannot delete question: form has responses"),
				}),
				Effect.catchAll(logAndReturnError("deleteQuestion")),
				Effect.catchAllDefect(logAndReturnDefect("deleteQuestion")),
			),
		),
	);

const CheckFormUnlockRpcInput = Schema.Struct({
	formId: Schema.String,
});

export const checkFormUnlockRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(CheckFormUnlockRpcInput)(raw))
	.handler(({ data, context }) =>
		AppRuntime.runPromise(
			checkFormUnlock({ formId: data.formId, userId: context.user.id }).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("checkFormUnlock"),
				Effect.tapError(logRpcError("checkFormUnlock")),
				Effect.catchTags({
					FormNotFoundError: () => Rpc.notFound("Form"),
				}),
				Effect.catchAll(logAndReturnError("checkFormUnlock")),
				Effect.catchAllDefect(logAndReturnDefect("checkFormUnlock")),
			),
		),
	);

export const unlockFormRpc = createServerFn({ method: "POST" })
	.middleware([requireRoleMiddleware("teacher", "admin")])
	.inputValidator((raw) => Schema.decodeUnknownSync(UnlockFormInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			unlockForm({ formId: data.formId, userId: data.userId }).pipe(
				Effect.map(() => Rpc.ok(true)),
				Effect.withSpan("unlockForm"),
				Effect.tapError(logRpcError("unlockForm")),
				Effect.catchAll(logAndReturnError("getRegistrationFormStatus")),
				Effect.catchAllDefect(logAndReturnDefect("getRegistrationFormStatus")),
			),
		),
	);

export const getRegistrationFormStatusRpc = createServerFn()
	.middleware([requireRoleMiddleware("student", "teacher", "admin")])
	.handler(({ context }) =>
		AppRuntime.runPromise(
			getRegistrationFormStatus(context.user.id).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getRegistrationFormStatus"),
				Effect.tapError(logRpcError("getRegistrationFormStatus")),
				Effect.catchAll(logAndReturnError("getRegistrationFormStatus")),
				Effect.catchAllDefect(logAndReturnDefect("getRegistrationFormStatus")),
			),
		),
	);

export const FormRpc = {
	forms: () => ["forms"],
	createForm: () =>
		mutationOptions({
			mutationKey: [...FormRpc.forms(), "create"],
			mutationFn: (data: CreateFormInput) => createFormRpc({ data }),
		}),
	getFormById: (formId: string) =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "byId", formId],
			queryFn: () => getFormByIdRpc({ data: { formId } }),
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
	getStudentFormById: (formId: string) =>
		queryOptions({
			queryKey: [...FormRpc.forms(), "studentById", formId],
			queryFn: () => getStudentFormByIdRpc({ data: { formId } }),
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
			mutationFn: (data: Omit<SubmitFormResponseInput, "userId">) =>
				submitFormResponseRpc({ data }),
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
