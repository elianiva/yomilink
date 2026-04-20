import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { parseJson, randomString, safeParseJson } from "@/lib/utils";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import {
	assignmentTargets,
	assignments,
	formProgress,
	formResponses,
	forms,
	questions,
} from "@/server/db/schema/app-schema";
import { cohortMembers, user as users } from "@/server/db/schema/auth-schema";

import { isCorrectMcqAnswer } from "./form-scoring";

/** Shared form type literals */
export const FORM_TYPES = [
	"pre_test",
	"post_test",
	"delayed_test",
	"registration",
	"tam",
	"questionnaire",
] as const;

export type FormType = (typeof FORM_TYPES)[number];

/** Schema for form type validation */
export const FormTypeSchema = Schema.Union(...FORM_TYPES.map((t) => Schema.Literal(t)));

export const FORM_AUDIENCES = ["all", "experiment", "control"] as const;

export type FormAudience = (typeof FORM_AUDIENCES)[number];

export const FormAudienceSchema = Schema.Union(
	...FORM_AUDIENCES.map((audience) => Schema.Literal(audience)),
);

export const ReadingMaterialSectionSchema = Schema.Struct({
	id: NonEmpty("Reading material section ID"),
	title: Schema.optionalWith(Schema.String, { nullable: true }),
	startQuestion: Schema.Int,
	endQuestion: Schema.Int,
	content: NonEmpty("Reading material content"),
});

export type ReadingMaterialSection = typeof ReadingMaterialSectionSchema.Type;

export const ReadingMaterialSections = Schema.Array(ReadingMaterialSectionSchema);

export const CreateFormInput = Schema.Struct({
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	type: Schema.optionalWith(FormTypeSchema, { nullable: true }),
	audience: Schema.optionalWith(FormAudienceSchema, { default: () => "all" }),
	readingMaterialSections: Schema.optionalWith(ReadingMaterialSections, { nullable: true }),
});

function normalizeFormAudience(type: FormType, audience: FormAudience): FormAudience {
	if (type === "tam") return "experiment";
	if (
		type === "pre_test" ||
		type === "post_test" ||
		type === "delayed_test" ||
		type === "registration"
	) {
		return "all";
	}
	return audience;
}

type AssignmentFormRow = {
	id: string;
	preTestFormId: string | null;
	postTestFormId: string | null;
	delayedPostTestFormId: string | null;
	tamFormId: string | null;
};

function shouldExcludeForm(
	form: { id: string; type: FormType; audience: FormAudience },
	studyGroup: "experiment" | "control" | null,
): boolean {
	if (form.type === "registration") return true;
	if (form.audience === "all") return false;
	if (!studyGroup) return true;
	return form.audience !== studyGroup;
}

type FormAccessScope = {
	linkedAssignmentRows: ReadonlyArray<AssignmentFormRow>;
	accessibleAssignmentRows: ReadonlyArray<AssignmentFormRow>;
	studyGroup: "experiment" | "control" | null;
};

const getAccessibleAssignmentIdsForUser = Effect.fn("getAccessibleAssignmentIdsForUser")(function* (
	userId: string,
	assignmentIds: ReadonlyArray<string>,
) {
	if (assignmentIds.length === 0) return [] as string[];

	const db = yield* Database;

	const directAssignmentRows = yield* db
		.select({ assignmentId: assignmentTargets.assignmentId })
		.from(assignmentTargets)
		.where(
			and(
				eq(assignmentTargets.userId, userId),
				inArray(assignmentTargets.assignmentId, assignmentIds),
			),
		);

	const cohortAssignmentRows = yield* db
		.select({ assignmentId: assignmentTargets.assignmentId })
		.from(assignmentTargets)
		.innerJoin(cohortMembers, eq(cohortMembers.cohortId, assignmentTargets.cohortId))
		.where(
			and(
				eq(cohortMembers.userId, userId),
				inArray(assignmentTargets.assignmentId, assignmentIds),
			),
		);

	return Array.from(
		new Set([...directAssignmentRows, ...cohortAssignmentRows].map((row) => row.assignmentId)),
	);
});

const resolveFormAccessScope = Effect.fn("resolveFormAccessScope")(function* (
	formId: string,
	userId: string,
) {
	const db = yield* Database;

	const linkedAssignmentRows: AssignmentFormRow[] = yield* db
		.select({
			id: assignments.id,
			preTestFormId: assignments.preTestFormId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			tamFormId: assignments.tamFormId,
		})
		.from(assignments)
		.where(
			or(
				eq(assignments.preTestFormId, formId),
				eq(assignments.postTestFormId, formId),
				eq(assignments.delayedPostTestFormId, formId),
				eq(assignments.tamFormId, formId),
			),
		);

	const userRows = yield* db.select({ studyGroup: users.studyGroup }).from(users).where(eq(users.id, userId)).limit(1);
	const studyGroup = userRows[0]?.studyGroup ?? null;

	if (linkedAssignmentRows.length === 0) {
		return {
			linkedAssignmentRows: [],
			accessibleAssignmentRows: [],
			studyGroup,
		};
	}

	const linkedAssignmentIds = linkedAssignmentRows.map((row) => row.id);
	const accessibleAssignmentIds = yield* getAccessibleAssignmentIdsForUser(
		userId,
		linkedAssignmentIds,
	);
	const accessibleAssignmentRows = linkedAssignmentRows.filter((row) =>
		accessibleAssignmentIds.includes(row.id),
	);

	return {
		linkedAssignmentRows,
		accessibleAssignmentRows,
		studyGroup,
	};
});

export type CreateFormInput = typeof CreateFormInput.Type;

class FormNotFoundError extends Data.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

class FormHasResponsesError extends Data.TaggedError("FormHasResponsesError")<{
	readonly formId: string;
	readonly responseCount: number;
}> {}

class InvalidQuestionOrderError extends Data.TaggedError("InvalidQuestionOrderError")<{
	readonly formId: string;
	readonly reason: string;
}> {}

class FormNotPublishedError extends Data.TaggedError("FormNotPublishedError")<{
	readonly formId: string;
}> {}

class FormAlreadySubmittedError extends Data.TaggedError("FormAlreadySubmittedError")<{
	readonly formId: string;
	readonly userId: string;
}> {}

class InvalidReadingMaterialSectionsError extends Data.TaggedError(
	"InvalidReadingMaterialSectionsError",
)<{
	readonly reason: string;
}> {}

const normalizeAndValidateReadingMaterialSections = Effect.fn(
	"normalizeAndValidateReadingMaterialSections",
)(function* (sections: ReadonlyArray<ReadingMaterialSection> | null | undefined) {
	if (!sections || sections.length === 0) return null;

	const normalized = sections
		.map((section) => ({
			...section,
			title: section.title?.trim() ? section.title.trim() : undefined,
			content: section.content.trim(),
		}))
		.sort((a, b) => a.startQuestion - b.startQuestion || a.endQuestion - b.endQuestion);

	for (let i = 0; i < normalized.length; i++) {
		const section = normalized[i];
		if (section.startQuestion < 1) {
			return yield* new InvalidReadingMaterialSectionsError({
				reason:
					"Reading material range " +
					String(i + 1) +
					" must start at question 1 or above",
			});
		}

		if (section.endQuestion < section.startQuestion) {
			return yield* new InvalidReadingMaterialSectionsError({
				reason: "Reading material range " + String(i + 1) + " has invalid bounds",
			});
		}

		if (i > 0) {
			const previous = normalized[i - 1];
			if (previous.endQuestion >= section.startQuestion) {
				return yield* new InvalidReadingMaterialSectionsError({
					reason: "Reading material ranges cannot overlap",
				});
			}
		}
	}

	return normalized;
});

export const CloneFormInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
});

export type CloneFormInput = typeof CloneFormInput.Type;

// Input schemas for RPC layer - co-located with service
export const GetFormByIdInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
});

export type GetFormByIdInput = typeof GetFormByIdInput.Type;

export const UpdateFormInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	title: Schema.optionalWith(NonEmpty("Title"), { nullable: true }),
	description: Schema.optionalWith(Schema.String, { nullable: true }),
	type: Schema.optionalWith(FormTypeSchema, { nullable: true }),
	audience: Schema.optionalWith(FormAudienceSchema, { nullable: true }),
	status: Schema.optionalWith(
		Schema.Union(Schema.Literal("draft"), Schema.Literal("published")),
		{ nullable: true },
	),
	readingMaterialSections: Schema.optionalWith(ReadingMaterialSections, { nullable: true }),
});

export type UpdateFormInput = typeof UpdateFormInput.Type;

export const GetQuestionByIdInput = Schema.Struct({
	id: NonEmpty("Question ID"),
});

export type GetQuestionByIdInput = typeof GetQuestionByIdInput.Type;

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

export const getFormById = Effect.fn("getFormById")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const formRow = formRows[0];
	if (!formRow) {
		return yield* new FormNotFoundError({ formId });
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, formId))
		.orderBy(questions.orderIndex);
	const readingMaterialSections = yield* safeParseJson(
		formRow.readingMaterialSections,
		null,
		Schema.NullOr(ReadingMaterialSections),
	);
	const form = {
		id: formRow.id,
		title: formRow.title,
		description: formRow.description,
		type: formRow.type,
		status: formRow.status,
		audience: formRow.audience,
		readingMaterialSections,
		createdBy: formRow.createdBy,
		createdAt: formRow.createdAt,
		updatedAt: formRow.updatedAt,
	};

	const mappedQuestions = yield* Effect.all(
		questionRows.map((q) =>
			Effect.gen(function* () {
				const parsedOptions = yield* safeParseJson(
					q.options,
					null,
					Schema.NullOr(QuestionOptions),
				);
				return {
					id: q.id,
					formId: q.formId,
					type: q.type,
					questionText: q.questionText,
					options: parsedOptions,
					orderIndex: q.orderIndex,
					required: q.required,
					createdAt: q.createdAt,
					updatedAt: q.updatedAt,
				};
			}),
		),
		{ concurrency: "unbounded" },
	);

	return yield* Schema.encode(GetFormByIdOutputSchema)({
		form: {
			...form,
			createdAt: form.createdAt.getTime(),
			updatedAt: form.updatedAt.getTime(),
		},
		questions: mappedQuestions.map((q) => ({
			...q,
			createdAt: q.createdAt.getTime(),
			updatedAt: q.updatedAt.getTime(),
		})),
	});
});

class FormNotAccessibleError extends Data.TaggedError("FormNotAccessibleError")<{
	readonly formId: string;
}> {}

/**
 * Get form for student viewing - strips correct answers and verifies access
 */
export const getStudentFormById = Effect.fn("getStudentFormById")(function* (
	formId: string,
	userId: string,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const formRow = formRows[0];
	if (!formRow) {
		return yield* new FormNotFoundError({ formId });
	}

	// Allow access to published forms for students
	// (progress check only matters for submission, not viewing)
	if (formRow.status !== "published") {
		return yield* new FormNotAccessibleError({ formId });
	}

	const formAccessScope: FormAccessScope = yield* resolveFormAccessScope(formId, userId);

	if (
		formAccessScope.linkedAssignmentRows.length > 0 &&
		formAccessScope.accessibleAssignmentRows.length === 0
	) {
		return yield* new FormNotAccessibleError({ formId });
	}

	if (
		shouldExcludeForm(
			{ id: formRow.id, type: formRow.type, audience: formRow.audience },
			formAccessScope.studyGroup,
		)
	) {
		return yield* new FormNotAccessibleError({ formId });
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, formId))
		.orderBy(questions.orderIndex);

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(and(eq(formResponses.formId, formId), eq(formResponses.userId, userId)))
		.limit(1);

	const responseRow = responseRows[0] ?? null;
	const responseAnswers = responseRow?.answers as Record<string, unknown> | undefined;

	const readingMaterialSections = yield* safeParseJson(
		formRow.readingMaterialSections,
		null,
		Schema.NullOr(ReadingMaterialSections),
	);

	const form = {
		id: formRow.id,
		title: formRow.title,
		description: formRow.description,
		type: formRow.type,
		status: formRow.status,
		audience: formRow.audience,
		readingMaterialSections,
		createdBy: formRow.createdBy,
		createdAt: formRow.createdAt,
		updatedAt: formRow.updatedAt,
	};

	let correctCount = 0;
	let scoredQuestionCount = 0;

	// Map questions and strip correctOptionIds for MCQ
	const mappedQuestions = yield* Effect.all(
		questionRows.map((q) =>
			Effect.gen(function* () {
				const parsedOptions = yield* safeParseJson(
					q.options,
					null,
					Schema.NullOr(QuestionOptions),
				);

				const answer = responseAnswers?.[q.id];
				const isCorrect = responseRow
					? isCorrectMcqAnswer(
							parsedOptions?.type === "mcq"
								? {
										type: "mcq",
										correctOptionIds: parsedOptions.correctOptionIds,
									}
								: null,
							answer,
						)
					: null;

				if (isCorrect !== null) {
					scoredQuestionCount += 1;
					if (isCorrect) {
						correctCount += 1;
					}
				}

				// Strip correctOptionIds from MCQ options for student view
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let studentOptions: any = parsedOptions;
				if (parsedOptions?.type === "mcq") {
					studentOptions = {
						type: "mcq",
						options: parsedOptions.options,
						shuffle: parsedOptions.shuffle,
						// NOTE: correctOptionIds is intentionally omitted for student view
					};
				}

				return {
					id: q.id,
					formId: q.formId,
					type: q.type,
					questionText: q.questionText,
					options: studentOptions,
					orderIndex: q.orderIndex,
					required: q.required,
					createdAt: q.createdAt.getTime(),
					updatedAt: q.updatedAt.getTime(),
				};
			}),
		),
		{ concurrency: "unbounded" },
	);

	const submission = responseRow
		? {
				submittedAt: responseRow.submittedAt?.getTime() ?? null,
				timeSpentSeconds: responseRow.timeSpentSeconds,
				score: scoredQuestionCount > 0 ? correctCount / scoredQuestionCount : null,
				correctCount,
				totalQuestions: scoredQuestionCount,
			}
		: null;

	return yield* Schema.encode(GetStudentFormByIdOutputSchema)({
		form: {
			...form,
			createdAt: form.createdAt.getTime(),
			updatedAt: form.updatedAt.getTime(),
		},
		questions: mappedQuestions,
		submission,
	});
});

export const listForms = Effect.fn("listForms")(function* (userId: string) {
	const db = yield* Database;
	const formRows = yield* db
		.select()
		.from(forms)
		.where(eq(forms.createdBy, userId))
		.orderBy(forms.createdAt);

	const formsWithStats = yield* Effect.all(
		formRows.map((formRow) =>
			Effect.gen(function* () {
				const progressRows = yield* db
					.select({
						status: formProgress.status,
						count: count(),
					})
					.from(formProgress)
					.where(eq(formProgress.formId, formRow.id))
					.groupBy(formProgress.status);

				const stats = {
					completed: 0,
					available: 0,
					locked: 0,
					total: 0,
				};

				for (const row of progressRows) {
					stats[row.status] = row.count;
					stats.total += row.count;
				}

				return {
					id: formRow.id,
					title: formRow.title,
					description: formRow.description,
					type: formRow.type,
					status: formRow.status,
					audience: formRow.audience,
					createdBy: formRow.createdBy,
					createdAt: formRow.createdAt,
					updatedAt: formRow.updatedAt,
					stats,
				};
			}),
		),
		{ concurrency: "unbounded" },
	);

	return formsWithStats;
});

export const updateForm = Effect.fn("updateForm")(function* (
	formId: string,
	data: Partial<{
		title: string;
		description: string | null;
		type: FormType;
		audience: FormAudience;
		status: "draft" | "published";
		readingMaterialSections: ReadonlyArray<ReadingMaterialSection> | null;
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

export const SubmitFormResponseInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	userId: NonEmpty("User ID"),
	answers: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	timeSpentSeconds: Schema.optionalWith(Schema.Int, { nullable: true }),
});

export type SubmitFormResponseInput = typeof SubmitFormResponseInput.Type;

export const GetFormResponsesInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	page: Schema.optionalWith(Schema.Number, { default: () => 1 }),
	limit: Schema.optionalWith(Schema.Number, { default: () => 20 }),
});

export type GetFormResponsesInput = {
	formId: string;
	page?: number;
	limit?: number;
};

export const getFormResponses = Effect.fn("getFormResponses")(function* (
	input: GetFormResponsesInput,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, input.formId)).limit(1);

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
					id: users.id,
					name: users.name,
					email: users.email,
					previousJapaneseScore: users.previousJapaneseScore,
				},
			})
			.from(formResponses)
			.where(eq(formResponses.formId, input.formId))
			.innerJoin(users, eq(formResponses.userId, users.id))
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

	// Parse answers for each response to handle both string and object formats
	const parsedResponses = yield* Effect.all(
		responseRows.map((row) =>
			Effect.gen(function* () {
				const parsedAnswers = yield* parseJson<Record<string, unknown>>(
					row.response.answers,
				);
				return {
					id: row.response.id,
					formId: row.response.formId,
					userId: row.response.userId,
					answers: parsedAnswers,
					submittedAt: row.response.submittedAt,
					timeSpentSeconds: row.response.timeSpentSeconds,
					user: row.user,
				};
			}),
		),
	);

	return yield* Schema.encode(GetFormResponsesOutputSchema)({
		responses: parsedResponses.map((r) => ({
			...r,
			submittedAt: r.submittedAt?.getTime() ?? null,
		})),
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		},
	});
});

export const ReorderQuestionsInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	questionIds: Schema.Array(NonEmpty("Question ID")),
});

export type ReorderQuestionsInput = typeof ReorderQuestionsInput.Type;

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

	const formAccessScope: FormAccessScope = yield* resolveFormAccessScope(
		data.formId,
		data.userId,
	);

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

// Question CRUD operations

export const McqOptions = Schema.Struct({
	type: Schema.Literal("mcq"),
	options: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			text: NonEmpty("Option text"),
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
	minLength: Schema.optional(Schema.Int),
	maxLength: Schema.optional(Schema.Int),
	placeholder: Schema.optional(Schema.String),
});

export type TextOptions = typeof TextOptions.Type;

export const QuestionOptions = Schema.Union(McqOptions, LikertOptions, TextOptions);

// Student-facing question options (strips correctOptionIds from MCQ)
export const StudentMcqOptions = Schema.Struct({
	type: Schema.Literal("mcq"),
	options: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			text: NonEmpty("Option text"),
		}),
	),
	shuffle: Schema.Boolean,
});

export type StudentMcqOptions = typeof StudentMcqOptions.Type;

export const StudentQuestionOptions = Schema.Union(StudentMcqOptions, LikertOptions, TextOptions);

export const CreateQuestionInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	type: Schema.Union(Schema.Literal("mcq"), Schema.Literal("likert"), Schema.Literal("text")),
	questionText: NonEmpty("Question text"),
	options: Schema.optionalWith(QuestionOptions, { nullable: true }),
	required: Schema.optionalWith(Schema.Boolean, { default: () => true }),
});

export type CreateQuestionInput = typeof CreateQuestionInput.Type;

class QuestionNotFoundError extends Data.TaggedError("QuestionNotFoundError")<{
	readonly questionId: string;
}> {}

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

export const UpdateQuestionInput = Schema.Struct({
	questionId: NonEmpty("Question ID"),
	questionText: Schema.optionalWith(NonEmpty("Question text"), { nullable: true }),
	options: Schema.optionalWith(QuestionOptions, { nullable: true }),
	required: Schema.optionalWith(Schema.Boolean, { nullable: true }),
});

export type UpdateQuestionInput = typeof UpdateQuestionInput.Type;

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

// Output schemas for RPC serialization
export const FormOutputSchema = Schema.Struct({
	id: Schema.String,
	title: Schema.String,
	description: Schema.NullOr(Schema.String),
	type: Schema.Union(
		Schema.Literal("pre_test"),
		Schema.Literal("post_test"),
		Schema.Literal("delayed_test"),
		Schema.Literal("registration"),
		Schema.Literal("tam"),
		Schema.Literal("questionnaire"),
	),
	audience: FormAudienceSchema,
	status: Schema.Union(Schema.Literal("draft"), Schema.Literal("published")),
	readingMaterialSections: Schema.NullOr(ReadingMaterialSections),
	createdBy: Schema.String,
	createdAt: Schema.Number,
	updatedAt: Schema.Number,
});

export const QuestionOutputSchema = Schema.Struct({
	id: Schema.String,
	formId: Schema.String,
	type: Schema.Union(Schema.Literal("mcq"), Schema.Literal("likert"), Schema.Literal("text")),
	questionText: Schema.String,
	options: Schema.NullOr(QuestionOptions),
	orderIndex: Schema.Number,
	required: Schema.Boolean,
	createdAt: Schema.Number,
	updatedAt: Schema.Number,
});

// Student question output (strips correctOptionIds)
export const StudentQuestionOutputSchema = Schema.Struct({
	id: Schema.String,
	formId: Schema.String,
	type: Schema.Union(Schema.Literal("mcq"), Schema.Literal("likert"), Schema.Literal("text")),
	questionText: Schema.String,
	options: Schema.NullOr(StudentQuestionOptions),
	orderIndex: Schema.Number,
	required: Schema.Boolean,
	createdAt: Schema.Number,
	updatedAt: Schema.Number,
});

export const StudentFormSubmissionSchema = Schema.Struct({
	submittedAt: Schema.NullOr(Schema.Number),
	timeSpentSeconds: Schema.NullOr(Schema.Number),
	score: Schema.NullOr(Schema.Number),
	correctCount: Schema.Number,
	totalQuestions: Schema.Number,
});

export const GetStudentFormByIdOutputSchema = Schema.Struct({
	form: FormOutputSchema,
	questions: Schema.Array(StudentQuestionOutputSchema),
	submission: Schema.NullOr(StudentFormSubmissionSchema),
});

export const ResponseUserSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.NullOr(Schema.String),
	email: Schema.String,
	previousJapaneseScore: Schema.NullOr(Schema.Number),
});

export const FormResponseOutputSchema = Schema.Struct({
	id: Schema.String,
	formId: Schema.String,
	userId: Schema.String,
	answers: Schema.Record({ key: Schema.String, value: Schema.Any }),
	submittedAt: Schema.NullOr(Schema.Number),
	timeSpentSeconds: Schema.NullOr(Schema.Number),
	user: ResponseUserSchema,
});

export const GetFormByIdOutputSchema = Schema.Struct({
	form: FormOutputSchema,
	questions: Schema.Array(QuestionOutputSchema),
});

export const PaginationInfoSchema = Schema.Struct({
	page: Schema.Number,
	limit: Schema.Number,
	total: Schema.Number,
	totalPages: Schema.Number,
	hasNextPage: Schema.Boolean,
	hasPrevPage: Schema.Boolean,
});

export const GetFormResponsesOutputSchema = Schema.Struct({
	responses: Schema.Array(FormResponseOutputSchema),
	pagination: PaginationInfoSchema,
});

export type GetFormByIdOutput = typeof GetFormByIdOutputSchema.Type;
export type GetStudentFormByIdOutput = typeof GetStudentFormByIdOutputSchema.Type;
export type GetFormResponsesOutput = typeof GetFormResponsesOutputSchema.Type;
export type FormOutput = typeof FormOutputSchema.Type;
export type QuestionOutput = typeof QuestionOutputSchema.Type;
export type StudentQuestionOutput = typeof StudentQuestionOutputSchema.Type;
export type FormResponseOutput = typeof FormResponseOutputSchema.Type;

// Form type priority order for display
// registration is hidden in dashboard list
const FORM_TYPE_PRIORITY: Record<FormType, number> = {
	registration: -1, // Completed during sign-up, not shown in dashboard
	pre_test: 0,
	post_test: 1,
	tam: 2,
	questionnaire: 2,
	delayed_test: 3,
};

function sortFormsByPriority(
	a: { type: FormType; createdAt: Date },
	b: { type: FormType; createdAt: Date },
) {
	const diff = FORM_TYPE_PRIORITY[a.type] - FORM_TYPE_PRIORITY[b.type];
	return diff !== 0 ? diff : a.createdAt.getTime() - b.createdAt.getTime();
}

// Get all published forms for students
export const getStudentForms = Effect.fn("getStudentForms")(function* (userId: string) {
	const db = yield* Database;

	const directAssignmentRows = yield* db
		.select({ assignmentId: assignmentTargets.assignmentId })
		.from(assignmentTargets)
		.where(eq(assignmentTargets.userId, userId));

	const cohortAssignmentRows = yield* db
		.select({ assignmentId: assignmentTargets.assignmentId })
		.from(assignmentTargets)
		.innerJoin(cohortMembers, eq(cohortMembers.cohortId, assignmentTargets.cohortId))
		.where(eq(cohortMembers.userId, userId));

	const assignmentIds = Array.from(
		new Set([...directAssignmentRows, ...cohortAssignmentRows].map((row) => row.assignmentId)),
	);

	const assignmentRows: AssignmentFormRow[] =
		assignmentIds.length > 0
			? yield* db
					.select({
						id: assignments.id,
						preTestFormId: assignments.preTestFormId,
						postTestFormId: assignments.postTestFormId,
						delayedPostTestFormId: assignments.delayedPostTestFormId,
						tamFormId: assignments.tamFormId,
					})
					.from(assignments)
					.where(inArray(assignments.id, assignmentIds))
			: [];


	const userRows = yield* db.select({ studyGroup: users.studyGroup }).from(users).where(eq(users.id, userId)).limit(1);
	const studyGroup = userRows[0]?.studyGroup ?? null;
	const assignmentLinkedFormIds = new Set(
		assignmentRows
			.flatMap((assignment) => [
				assignment.preTestFormId,
				assignment.postTestFormId,
				assignment.delayedPostTestFormId,
				assignment.tamFormId,
			])
			.filter((formId): formId is string => formId !== null),
	);

	const publishedForms = yield* db.select().from(forms).where(eq(forms.status, "published"));

	const applicableForms = publishedForms.filter((form) => {
		const isAssignmentScopedForm =
			form.type === "pre_test" ||
			form.type === "post_test" ||
			form.type === "delayed_test" ||
			form.type === "tam";

		if (isAssignmentScopedForm && !assignmentLinkedFormIds.has(form.id)) {
			return false;
		}

		return !shouldExcludeForm(form, studyGroup);
	});

	const userProgressRows = yield* db
		.select()
		.from(formProgress)
		.where(eq(formProgress.userId, userId));

	const progressMap = new Map(userProgressRows.map((p) => [p.formId, p]));
	const sortedForms = [...applicableForms].sort(sortFormsByPriority);

	return yield* Effect.all(
		sortedForms.map((form) =>
			Effect.gen(function* () {
				const progress = progressMap.get(form.id);

				if (progress?.status === "completed") {
					return {
						id: form.id,
						title: form.title,
						description: form.description,
						type: form.type,
						audience: form.audience,
						unlockStatus: "completed" as const,
						isUnlocked: true,
						progress: {
							status: progress.status,
							unlockedAt: progress.unlockedAt,
							completedAt: progress.completedAt,
						},
					};
				}

				return {
					id: form.id,
					title: form.title,
					description: form.description,
					type: form.type,
					audience: form.audience,
					unlockStatus: "available" as const,
					isUnlocked: true,
					progress: progress
						? {
								status: progress.status,
								unlockedAt: progress.unlockedAt,
								completedAt: progress.completedAt,
							}
						: null,
				};
			}),
		),
		{ concurrency: "unbounded" },
	);
});
