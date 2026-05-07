import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { formProgress, formResponses, forms, questions } from "@/server/db/schema/app-schema";

import {
	CreateFormInput,
	CreateQuestionInput,
	FormAlreadySubmittedError,
	FormHasResponsesError,
	FormNotFoundError,
	FormNotPublishedError,
	InvalidQuestionOrderError,
	normalizeAndValidateReadingMaterialSections,
	normalizeFormAudience,
	QuestionNotFoundError,
	ReorderQuestionsInput,
	resolveFormAccessScope,
	shouldExcludeForm,
	SubmitFormResponseInput,
	UpdateQuestionInput,
	FormNotAccessibleError,
} from "./form-service.shared";

export const createForm = Effect.fn("createForm")(function* (
	userId: string,
	data: CreateFormInput,
) {
	const db = yield* Database;

	const formId = randomString();

	const type = data.type ?? "registration";
	const audience = normalizeFormAudience(type, data.audience ?? "all");
	const readingMaterialSections = yield* normalizeAndValidateReadingMaterialSections(
		data.readingMaterialSections,
	);

	yield* db.insert(forms).values({
		id: formId,
		title: data.title,
		description: data.description ?? null,
		type,
		audience,
		status: "draft",
		readingMaterialSections,
		createdBy: userId,
	});

	return { id: formId };
});

export const updateForm = Effect.fn("updateForm")(function* (
	formId: string,
	data: Partial<{
		title: string;
		description: string | null;
		type: import("./form-service.shared").FormType;
		audience: import("./form-service.shared").FormAudience;
		status: "draft" | "published";
		readingMaterialSections: ReadonlyArray<
			import("./form-service.shared").ReadingMaterialSection
		> | null;
	}>,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, formId));

	if (responseRows.length > 0) {
		return yield* new FormHasResponsesError({
			formId,
			responseCount: responseRows.length,
		});
	}

	const nextType = data.type ?? form.type;
	const nextAudience = normalizeFormAudience(nextType, data.audience ?? form.audience);
	const normalizedReadingMaterialSections =
		data.readingMaterialSections === undefined
			? undefined
			: yield* normalizeAndValidateReadingMaterialSections(data.readingMaterialSections);

	yield* db
		.update(forms)
		.set({
			...(data.title !== undefined && { title: data.title }),
			...(data.description !== undefined && {
				description: data.description,
			}),
			...(data.type !== undefined && { type: data.type }),
			...((data.type !== undefined || data.audience !== undefined) && {
				audience: nextAudience,
			}),
			...(data.status !== undefined && { status: data.status }),
			...(normalizedReadingMaterialSections !== undefined && {
				readingMaterialSections: normalizedReadingMaterialSections,
			}),
		})
		.where(eq(forms.id, formId));

	return {
		id: formId,
		title: data.title,
		description: data.description,
		type: data.type,
		audience: nextAudience,
		status: data.status,
		readingMaterialSections: normalizedReadingMaterialSections,
	};
});

export const deleteForm = Effect.fn("deleteForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId });
	}

	yield* db.delete(forms).where(eq(forms.id, formId));

	return true;
});

export const publishForm = Effect.fn("publishForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId });
	}

	yield* db.update(forms).set({ status: "published" }).where(eq(forms.id, formId));

	return true;
});

export const unpublishForm = Effect.fn("unpublishForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId });
	}

	yield* db.update(forms).set({ status: "draft" }).where(eq(forms.id, formId));

	return true;
});

export const cloneForm = Effect.fn("cloneForm")(function* (formId: string, userId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const originalForm = formRows[0];
	if (!originalForm) {
		return yield* new FormNotFoundError({ formId });
	}

	const originalQuestions = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, formId))
		.orderBy(questions.orderIndex);

	const newFormId = randomString();

	yield* db.insert(forms).values({
		id: newFormId,
		title: `${originalForm.title} (Copy)`,
		description: originalForm.description,
		type: originalForm.type,
		audience: originalForm.audience,
		status: "draft",
		readingMaterialSections: originalForm.readingMaterialSections,
		createdBy: userId,
	});

	for (const question of originalQuestions) {
		yield* db.insert(questions).values({
			id: randomString(),
			formId: newFormId,
			type: question.type,
			questionText: question.questionText,
			options: question.options,
			orderIndex: question.orderIndex,
			required: question.required,
		});
	}

	return {
		id: newFormId,
	};
});

export const submitFormResponse = Effect.fn("submitFormResponse")(function* (
	data: SubmitFormResponseInput,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, data.formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId: data.formId });
	}

	if (form.status !== "published") {
		return yield* new FormNotPublishedError({ formId: data.formId });
	}

	const formAccessScope = yield* resolveFormAccessScope(data.formId, data.userId);

	if (
		formAccessScope.linkedAssignmentRows.length > 0 &&
		formAccessScope.accessibleAssignmentRows.length === 0
	) {
		return yield* new FormNotAccessibleError({ formId: data.formId });
	}

	if (
		shouldExcludeForm(
			{ id: form.id, type: form.type, audience: form.audience },
			formAccessScope.studyGroup,
		)
	) {
		return yield* new FormNotAccessibleError({ formId: data.formId });
	}

	const existingResponse = yield* db
		.select()
		.from(formResponses)
		.where(and(eq(formResponses.formId, data.formId), eq(formResponses.userId, data.userId)))
		.limit(1);

	if (existingResponse.length > 0) {
		return yield* new FormAlreadySubmittedError({
			formId: data.formId,
			userId: data.userId,
		});
	}

	const responseId = randomString();
	const submittedAt = new Date();

	yield* db.insert(formResponses).values({
		id: responseId,
		formId: data.formId,
		userId: data.userId,
		answers: data.answers,
		submittedAt,
		timeSpentSeconds: data.timeSpentSeconds ?? null,
	});

	const existingProgress = yield* db
		.select()
		.from(formProgress)
		.where(and(eq(formProgress.formId, data.formId), eq(formProgress.userId, data.userId)))
		.limit(1);

	if (existingProgress.length > 0) {
		yield* db
			.update(formProgress)
			.set({
				status: "completed",
				completedAt: submittedAt,
			})
			.where(eq(formProgress.id, existingProgress[0].id));
	} else {
		yield* db.insert(formProgress).values({
			id: randomString(),
			formId: data.formId,
			userId: data.userId,
			status: "completed",
			completedAt: submittedAt,
		});
	}

	return true;
});

export const reorderQuestions = Effect.fn("reorderQuestions")(function* (
	input: ReorderQuestionsInput,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, input.formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId: input.formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, input.formId));

	if (responseRows.length > 0) {
		return yield* new FormHasResponsesError({
			formId: input.formId,
			responseCount: responseRows.length,
		});
	}

	const existingQuestions = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, input.formId));

	const existingQuestionIds = new Set(existingQuestions.map((q) => q.id));
	const providedQuestionIds = new Set(input.questionIds);

	if (existingQuestionIds.size !== providedQuestionIds.size) {
		return yield* new InvalidQuestionOrderError({
			formId: input.formId,
			reason: "Question count mismatch",
		});
	}

	for (const id of input.questionIds) {
		if (!existingQuestionIds.has(id)) {
			return yield* new InvalidQuestionOrderError({
				formId: input.formId,
				reason: `Invalid question ID: ${id}`,
			});
		}
	}

	for (let i = 0; i < input.questionIds.length; i++) {
		yield* db
			.update(questions)
			.set({ orderIndex: i })
			.where(and(eq(questions.id, input.questionIds[i]), eq(questions.formId, input.formId)));
	}

	return true;
});

export const createQuestion = Effect.fn("createQuestion")(function* (data: CreateQuestionInput) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, data.formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId: data.formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, data.formId));

	if (responseRows.length > 0) {
		return yield* new FormHasResponsesError({
			formId: data.formId,
			responseCount: responseRows.length,
		});
	}

	const existingQuestions = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, data.formId));

	const orderIndex = existingQuestions.length;

	const questionId = randomString();

	yield* db.insert(questions).values({
		id: questionId,
		formId: data.formId,
		type: data.type,
		questionText: data.questionText,
		options: data.options ?? null,
		orderIndex,
		required: data.required,
	});

	return true;
});

export const updateQuestion = Effect.fn("updateQuestion")(function* (data: UpdateQuestionInput) {
	const db = yield* Database;

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(eq(questions.id, data.questionId))
		.limit(1);

	const question = questionRows[0];
	if (!question) {
		return yield* new QuestionNotFoundError({
			questionId: data.questionId,
		});
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, question.formId));

	if (responseRows.length > 0) {
		return yield* new FormHasResponsesError({
			formId: question.formId,
			responseCount: responseRows.length,
		});
	}

	yield* db
		.update(questions)
		.set({
			...(data.questionText !== undefined && {
				questionText: data.questionText,
			}),
			...(data.options !== undefined && { options: data.options }),
			...(data.required !== undefined && { required: data.required }),
		})
		.where(eq(questions.id, data.questionId));

	return true;
});

export const deleteQuestion = Effect.fn("deleteQuestion")(function* (questionId: string) {
	const db = yield* Database;

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(eq(questions.id, questionId))
		.limit(1);

	const question = questionRows[0];
	if (!question) {
		return yield* new QuestionNotFoundError({ questionId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, question.formId));

	if (responseRows.length > 0) {
		return yield* new FormHasResponsesError({
			formId: question.formId,
			responseCount: responseRows.length,
		});
	}

	yield* db.delete(questions).where(eq(questions.id, questionId));

	return true;
});
