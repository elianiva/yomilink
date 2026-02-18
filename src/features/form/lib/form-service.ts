import { eq } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { formResponses, forms, questions } from "@/server/db/schema/app-schema";

export const CreateFormInput = Schema.Struct({
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, {
		nullable: true,
	}),
	type: Schema.optionalWith(
		Schema.Union(
			Schema.Literal("pre_test"),
			Schema.Literal("post_test"),
			Schema.Literal("registration"),
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

		const form = formRows[0];
		if (!form) {
			return yield* new FormNotFoundError({ formId });
		}

		const questionRows = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, formId))
			.orderBy(questions.orderIndex);

		return { form, questions: questionRows };
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

		return formRows;
	}),
);

export const updateForm = Effect.fn("updateForm")(
	(
		formId: string,
		data: Partial<{
			title: string;
			description: string | null;
			type: "pre_test" | "post_test" | "registration" | "control";
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

			return { id: formId, ...data };
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
