import { and, count, desc, eq } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	formProgress,
	formResponses,
	forms,
	questions,
} from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";
import type { FormUnlockConditions } from "./unlock-service";

export const CreateFormInput = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, {
		nullable: true,
	}),
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
	unlockConditions: Schema.optionalWith(Schema.Unknown, { nullable: true }),
});

export type CreateFormInput = typeof CreateFormInput.Type;

class FormNotFoundError extends Data.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

class FormHasResponsesError extends Data.TaggedError("FormHasResponsesError")<{
	readonly formId: string;
	readonly responseCount: number;
}> {}

class InvalidQuestionOrderError extends Data.TaggedError(
	"InvalidQuestionOrderError",
)<{
	readonly formId: string;
	readonly reason: string;
}> {}

class FormNotPublishedError extends Data.TaggedError("FormNotPublishedError")<{
	readonly formId: string;
}> {}

class FormAlreadySubmittedError extends Data.TaggedError(
	"FormAlreadySubmittedError",
)<{
	readonly formId: string;
	readonly userId: string;
}> {}

export const CloneFormInput = Schema.Struct({
	formId: Schema.NonEmptyString,
});

export type CloneFormInput = typeof CloneFormInput.Type;

export const createForm = Effect.fn("createForm")(
	(userId: string, data: CreateFormInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formId = randomString();

			yield* db.insert(forms).values({
				id: formId,
				title: data.title,
				description: data.description ?? null,
				type: data.type ?? "registration",
				status: "draft",
				unlockConditions: data.unlockConditions ?? null,
				createdBy: userId,
			});

			return { id: formId };
		}),
);

export const getFormById = Effect.fn("getFormById")((formId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const formRows = yield* db
			.select()
			.from(forms)
			.where(eq(forms.id, formId))
			.limit(1);

		const formRow = formRows[0];
		if (!formRow) {
			return yield* new FormNotFoundError({ formId });
		}

		const questionRows = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, formId))
			.orderBy(questions.orderIndex);

		const form = {
			id: formRow.id,
			title: formRow.title,
			description: formRow.description,
			type: formRow.type,
			status: formRow.status,
			unlockConditions: formRow.unlockConditions ?? null,
			createdBy: formRow.createdBy,
			createdAt: formRow.createdAt,
			updatedAt: formRow.updatedAt,
		};

		const mappedQuestions = questionRows.map((q) => ({
			id: q.id,
			formId: q.formId,
			type: q.type,
			questionText: q.questionText,
			options: q.options ?? null,
			orderIndex: q.orderIndex,
			required: q.required,
			createdAt: q.createdAt,
			updatedAt: q.updatedAt,
		}));

		return { form, questions: mappedQuestions };
	}),
);

export const listForms = Effect.fn("listForms")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const formRows = yield* db
			.select()
			.from(forms)
			.where(eq(forms.createdBy, userId))
			.orderBy(forms.createdAt);

		return formRows.map((formRow) => ({
			id: formRow.id,
			title: formRow.title,
			description: formRow.description,
			type: formRow.type,
			status: formRow.status,
			unlockConditions: formRow.unlockConditions ?? null,
			createdBy: formRow.createdBy,
			createdAt: formRow.createdAt,
			updatedAt: formRow.updatedAt,
		}));
	}),
);

export const updateForm = Effect.fn("updateForm")(
	(
		formId: string,
		data: Partial<{
			title: string;
			description: string | null;
			type:
				| "pre_test"
				| "post_test"
				| "delayed_test"
				| "registration"
				| "tam"
				| "control";
			status: "draft" | "published";
			unlockConditions: unknown;
		}>,
	) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, formId))
				.limit(1);

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

			yield* db
				.update(forms)
				.set({
					...(data.title !== undefined && { title: data.title }),
					...(data.description !== undefined && {
						description: data.description,
					}),
					...(data.type !== undefined && { type: data.type }),
					...(data.status !== undefined && { status: data.status }),
					...(data.unlockConditions !== undefined && {
						unlockConditions: data.unlockConditions,
					}),
				})
				.where(eq(forms.id, formId));

			return {
				id: formId,
				title: data.title,
				description: data.description,
				type: data.type,
				status: data.status,
				unlockConditions: data.unlockConditions,
			};
		}),
);

export const deleteForm = Effect.fn("deleteForm")((formId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const formRows = yield* db
			.select()
			.from(forms)
			.where(eq(forms.id, formId))
			.limit(1);

		const form = formRows[0];
		if (!form) {
			return yield* new FormNotFoundError({ formId });
		}

		yield* db.delete(forms).where(eq(forms.id, formId));

		return { id: formId };
	}),
);

export const publishForm = Effect.fn("publishForm")((formId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const formRows = yield* db
			.select()
			.from(forms)
			.where(eq(forms.id, formId))
			.limit(1);

		const form = formRows[0];
		if (!form) {
			return yield* new FormNotFoundError({ formId });
		}

		yield* db
			.update(forms)
			.set({ status: "published" })
			.where(eq(forms.id, formId));

		return { id: formId, status: "published" };
	}),
);

export const unpublishForm = Effect.fn("unpublishForm")((formId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const formRows = yield* db
			.select()
			.from(forms)
			.where(eq(forms.id, formId))
			.limit(1);

		const form = formRows[0];
		if (!form) {
			return yield* new FormNotFoundError({ formId });
		}

		yield* db
			.update(forms)
			.set({ status: "draft" })
			.where(eq(forms.id, formId));

		return { id: formId, status: "draft" };
	}),
);

export const cloneForm = Effect.fn("cloneForm")(
	(formId: string, userId: string) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, formId))
				.limit(1);

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
				status: "draft",
				unlockConditions: originalForm.unlockConditions,
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

			return { id: newFormId, originalFormId: formId };
		}),
);

export const SubmitFormResponseInput = Schema.Struct({
	formId: Schema.NonEmptyString,
	userId: Schema.NonEmptyString,
	answers: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	timeSpentSeconds: Schema.optionalWith(Schema.Int, { nullable: true }),
});

export type SubmitFormResponseInput = typeof SubmitFormResponseInput.Type;

export const GetFormResponsesInput = Schema.Struct({
	formId: Schema.NonEmptyString,
	page: Schema.optionalWith(Schema.Number, { default: () => 1 }),
	limit: Schema.optionalWith(Schema.Number, { default: () => 20 }),
});

export type GetFormResponsesInput = {
	formId: string;
	page?: number;
	limit?: number;
};

export const getFormResponses = Effect.fn("getFormResponses")(
	(input: GetFormResponsesInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, input.formId))
				.limit(1);

			const form = formRows[0];
			if (!form) {
				return yield* new FormNotFoundError({ formId: input.formId });
			}

			const page = Math.max(1, input.page ?? 1);
			const limit = Math.min(100, Math.max(1, input.limit ?? 20));
			const offset = (page - 1) * limit;

			const [responseRows, countResult] = yield* Effect.all([
				db
					.select({
						response: formResponses,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					})
					.from(formResponses)
					.where(eq(formResponses.formId, input.formId))
					.innerJoin(user, eq(formResponses.userId, user.id))
					.orderBy(desc(formResponses.submittedAt))
					.limit(limit)
					.offset(offset),
				db
					.select({ total: count() })
					.from(formResponses)
					.where(eq(formResponses.formId, input.formId)),
			]);

			const total = countResult[0]?.total ?? 0;
			const totalPages = Math.ceil(total / limit);

			return {
				responses: responseRows.map((row) => ({
					id: row.response.id,
					formId: row.response.formId,
					userId: row.response.userId,
					answers: row.response.answers as { [x: string]: {} },
					submittedAt: row.response.submittedAt,
					timeSpentSeconds: row.response.timeSpentSeconds,
					user: row.user,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			};
		}),
);

export const ReorderQuestionsInput = Schema.Struct({
	formId: Schema.NonEmptyString,
	questionIds: Schema.Array(Schema.NonEmptyString),
});

export type ReorderQuestionsInput = typeof ReorderQuestionsInput.Type;

export const reorderQuestions = Effect.fn("reorderQuestions")(
	(input: ReorderQuestionsInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, input.formId))
				.limit(1);

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
					.where(
						and(
							eq(questions.id, input.questionIds[i]),
							eq(questions.formId, input.formId),
						),
					);
			}

			return { formId: input.formId, reordered: input.questionIds.length };
		}),
);

export const submitFormResponse = Effect.fn("submitFormResponse")(
	(data: SubmitFormResponseInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, data.formId))
				.limit(1);

			const form = formRows[0];
			if (!form) {
				return yield* new FormNotFoundError({ formId: data.formId });
			}

			if (form.status !== "published") {
				return yield* new FormNotPublishedError({ formId: data.formId });
			}

			const existingResponse = yield* db
				.select()
				.from(formResponses)
				.where(
					and(
						eq(formResponses.formId, data.formId),
						eq(formResponses.userId, data.userId),
					),
				)
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
				.where(
					and(
						eq(formProgress.formId, data.formId),
						eq(formProgress.userId, data.userId),
					),
				)
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

			return {
				id: responseId,
				formId: data.formId,
				submittedAt,
			};
		}),
);

// Question CRUD operations

export const McqOptions = Schema.Struct({
	type: Schema.Literal("mcq"),
	options: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			text: Schema.NonEmptyString,
		}),
	),
	correctOptionIds: Schema.Array(Schema.String),
	shuffle: Schema.Boolean,
});

export type McqOptions = typeof McqOptions.Type;

export const LikertOptions = Schema.Struct({
	type: Schema.Literal("likert"),
	scaleSize: Schema.Int,
	labels: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export type LikertOptions = typeof LikertOptions.Type;

export const TextOptions = Schema.Struct({
	type: Schema.Literal("text"),
	minLength: Schema.optionalWith(Schema.Int, { nullable: true }),
	maxLength: Schema.optionalWith(Schema.Int, { nullable: true }),
	placeholder: Schema.optionalWith(Schema.String, { nullable: true }),
});

export type TextOptions = typeof TextOptions.Type;

export const QuestionOptions = Schema.Union(
	McqOptions,
	LikertOptions,
	TextOptions,
);

export const CreateQuestionInput = Schema.Struct({
	formId: Schema.NonEmptyString,
	type: Schema.Union(
		Schema.Literal("mcq"),
		Schema.Literal("likert"),
		Schema.Literal("text"),
	),
	questionText: Schema.NonEmptyString,
	options: Schema.optionalWith(QuestionOptions, { nullable: true }),
	required: Schema.optionalWith(Schema.Boolean, { default: () => true }),
});

export type CreateQuestionInput = typeof CreateQuestionInput.Type;

class QuestionNotFoundError extends Data.TaggedError("QuestionNotFoundError")<{
	readonly questionId: string;
}> {}

export const createQuestion = Effect.fn("createQuestion")(
	(data: CreateQuestionInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, data.formId))
				.limit(1);

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

			return {
				id: questionId,
				formId: data.formId,
				type: data.type,
				questionText: data.questionText,
				options: data.options ?? null,
				orderIndex,
				required: data.required,
			};
		}),
);

export const UpdateQuestionInput = Schema.Struct({
	questionId: Schema.NonEmptyString,
	questionText: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	options: Schema.optionalWith(QuestionOptions, { nullable: true }),
	required: Schema.optionalWith(Schema.Boolean, { nullable: true }),
});

export type UpdateQuestionInput = typeof UpdateQuestionInput.Type;

export const updateQuestion = Effect.fn("updateQuestion")(
	(data: UpdateQuestionInput) =>
		Effect.gen(function* () {
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

			return { id: data.questionId };
		}),
);

export const deleteQuestion = Effect.fn("deleteQuestion")(
	(questionId: string) =>
		Effect.gen(function* () {
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

			return { id: questionId };
		}),
);

// Check if user has completed the registration form
// Returns the registration form ID if it exists and user's completion status

export const getRegistrationFormStatus = Effect.fn("getRegistrationFormStatus")(
	(userId: string) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Get the first published registration form
			const registrationForms = yield* db
				.select()
				.from(forms)
				.where(
					and(eq(forms.type, "registration"), eq(forms.status, "published")),
				)
				.limit(1);

			const registrationForm = registrationForms[0];

			// No registration form configured - user can proceed
			if (!registrationForm) {
				return {
					hasRegistrationForm: false as const,
					isCompleted: true,
					formId: null,
				};
			}

			// Check if user has completed this form
			const userProgress = yield* db
				.select()
				.from(formProgress)
				.where(
					and(
						eq(formProgress.formId, registrationForm.id),
						eq(formProgress.userId, userId),
						eq(formProgress.status, "completed"),
					),
				)
				.limit(1);

			const isCompleted = userProgress.length > 0;

			return {
				hasRegistrationForm: true as const,
				isCompleted,
				formId: registrationForm.id,
			};
		}),
);

// Get all published forms for students with unlock status

export const getStudentForms = Effect.fn("getStudentForms")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;

		// Get all published forms
		const publishedForms = yield* db
			.select()
			.from(forms)
			.where(eq(forms.status, "published"))
			.orderBy(forms.createdAt);

		// Get user's progress for all forms
		const userProgressRows = yield* db
			.select()
			.from(formProgress)
			.where(eq(formProgress.userId, userId));

		const progressMap = new Map(userProgressRows.map((p) => [p.formId, p]));

		// Build response with unlock status
		const formsWithStatus = publishedForms.map((form) => {
			const progress = progressMap.get(form.id);

			let unlockStatus: "locked" | "available" | "completed" = "locked";
			let isUnlocked = false;

			// Check unlock conditions
			const unlockConditions =
				form.unlockConditions as FormUnlockConditions | null;

			if (!unlockConditions || unlockConditions.conditions.length === 0) {
				// No conditions = available by default
				unlockStatus = progress?.status ?? "available";
				isUnlocked = true;
			} else if (progress) {
				unlockStatus = progress.status;
				isUnlocked =
					progress.status === "available" || progress.status === "completed";
			}

			return {
				id: form.id,
				title: form.title,
				description: form.description,
				type: form.type,
				unlockStatus,
				isUnlocked,
				progress: progress
					? {
							status: progress.status,
							unlockedAt: progress.unlockedAt,
							completedAt: progress.completedAt,
						}
					: null,
			};
		});

		return formsWithStatus;
	}),
);
