import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { parseJson, randomString, safeParseJson } from "@/lib/utils";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import {
	assignmentExperimentGroups,
	assignmentTargets,
	assignments,
	formProgress,
	formResponses,
	forms,
	questions,
} from "@/server/db/schema/app-schema";
import { cohortMembers } from "@/server/db/schema/auth-schema";

import { isCorrectMcqAnswer } from "./form-scoring";
import { FormUnlockConditionsType, FormUnlockConditionsNullable } from "./unlock-service.shared";

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

export const CreateFormInput = Schema.Struct({
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	type: Schema.optionalWith(FormTypeSchema, { nullable: true }),
	audience: Schema.optionalWith(FormAudienceSchema, { default: () => "all" }),
	unlockConditions: Schema.optionalWith(FormUnlockConditionsNullable, { nullable: true }),
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

type AssignmentConditionRow = {
	assignmentId: string;
	condition: "summarizing" | "concept_map";
};

const CONDITION_TO_AUDIENCE: Record<
	AssignmentConditionRow["condition"],
	Exclude<FormAudience, "all">
> = {
	summarizing: "control",
	concept_map: "experiment",
};

function buildAccessibleFormAudiences(
	assignmentRows: ReadonlyArray<AssignmentFormRow>,
	experimentGroupRows: ReadonlyArray<AssignmentConditionRow>,
) {
	const assignmentConditionById = new Map(
		experimentGroupRows.map((row) => [row.assignmentId, row.condition]),
	);
	const audiencesByFormId = new Map<string, Set<Exclude<FormAudience, "all">>>();

	for (const assignment of assignmentRows) {
		const condition = assignmentConditionById.get(assignment.id);
		if (!condition) continue;

		const audience = CONDITION_TO_AUDIENCE[condition];
		for (const formId of [
			assignment.preTestFormId,
			assignment.postTestFormId,
			assignment.delayedPostTestFormId,
			assignment.tamFormId,
		]) {
			if (!formId) continue;

			const existing = audiencesByFormId.get(formId);
			if (existing) {
				existing.add(audience);
				continue;
			}

			audiencesByFormId.set(formId, new Set([audience]));
		}
	}

	return audiencesByFormId;
}

function shouldExcludeForm(
	form: { id: string; type: FormType; audience: FormAudience },
	audiencesByFormId: Map<string, Set<Exclude<FormAudience, "all">>>,
): boolean {
	if (form.type === "registration") return true;
	if (form.audience === "all") return false;
	return !(audiencesByFormId.get(form.id)?.has(form.audience) ?? false);
}

export type CreateFormInput = typeof CreateFormInput.Type;

class FormNotFoundError extends Schema.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

class FormHasResponsesError extends Schema.TaggedError("FormHasResponsesError")<{
	readonly formId: string;
	readonly responseCount: number;
}> {}

class InvalidQuestionOrderError extends Schema.TaggedError("InvalidQuestionOrderError")<{
	readonly formId: string;
	readonly reason: string;
}> {}

class FormNotPublishedError extends Schema.TaggedError("FormNotPublishedError")<{
	readonly formId: string;
}> {}

class FormAlreadySubmittedError extends Schema.TaggedError("FormAlreadySubmittedError")<{
	readonly formId: string;
	readonly userId: string;
}> {}

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
	unlockConditions: Schema.optionalWith(FormUnlockConditionsNullable, { nullable: true }),
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

	yield* db.insert(forms).values({
		id: formId,
		title: data.title,
		description: data.description ?? null,
		type,
		audience,
		status: "draft",
		unlockConditions: data.unlockConditions ?? null,
		createdBy: userId,
	});

	return { id: formId };
});

export const getFormById = Effect.fn("getFormById")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const formRow = formRows[0];
	if (!formRow) {
		return yield* FormNotFoundError.make({ formId });
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(eq(questions.formId, formId))
		.orderBy(questions.orderIndex);
	const unlockConditions = yield* safeParseJson(
		formRow.unlockConditions,
		null,
		FormUnlockConditionsNullable,
	);
	const form = {
		id: formRow.id,
		title: formRow.title,
		description: formRow.description,
		type: formRow.type,
		status: formRow.status,
		audience: formRow.audience,
		unlockConditions,
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

class FormNotAccessibleError extends Schema.TaggedError("FormNotAccessibleError")<{
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
		return yield* FormNotFoundError.make({ formId });
	}

	// Allow access to published forms for students
	// (progress check only matters for submission, not viewing)
	if (formRow.status !== "published") {
		return yield* FormNotAccessibleError.make({ formId });
	}

	let audiencesByFormId = new Map<string, Set<Exclude<FormAudience, "all">>>();
	if (formRow.audience !== "all") {
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

		if (linkedAssignmentRows.length > 0) {
			const linkedAssignmentIds = linkedAssignmentRows.map((row) => row.id);
			const linkedExperimentGroupRows: AssignmentConditionRow[] = yield* db
				.select({
					assignmentId: assignmentExperimentGroups.assignmentId,
					condition: assignmentExperimentGroups.condition,
				})
				.from(assignmentExperimentGroups)
				.where(
					and(
						eq(assignmentExperimentGroups.userId, userId),
						inArray(assignmentExperimentGroups.assignmentId, linkedAssignmentIds),
					),
				);

			audiencesByFormId = buildAccessibleFormAudiences(
				linkedAssignmentRows,
				linkedExperimentGroupRows,
			);
		}
	}

	if (
		shouldExcludeForm(
			{ id: formRow.id, type: formRow.type, audience: formRow.audience },
			audiencesByFormId,
		)
	) {
		return yield* FormNotAccessibleError.make({ formId });
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

	const unlockConditions = yield* safeParseJson(
		formRow.unlockConditions,
		null,
		FormUnlockConditionsNullable,
	);

	const form = {
		id: formRow.id,
		title: formRow.title,
		description: formRow.description,
		type: formRow.type,
		status: formRow.status,
		audience: formRow.audience,
		unlockConditions,
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
				const unlockConditions = yield* safeParseJson(
					formRow.unlockConditions,
					null,
					FormUnlockConditionsNullable,
				);

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
					unlockConditions,
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
		unlockConditions: FormUnlockConditionsType | null;
	}>,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* FormNotFoundError.make({ formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, formId));

	if (responseRows.length > 0) {
		return yield* FormHasResponsesError.make({
			formId,
			responseCount: responseRows.length,
		});
	}

	const nextType = data.type ?? form.type;
	const nextAudience = normalizeFormAudience(nextType, data.audience ?? form.audience);

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
		audience: nextAudience,
		status: data.status,
		unlockConditions: data.unlockConditions,
	};
});

export const deleteForm = Effect.fn("deleteForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* FormNotFoundError.make({ formId });
	}

	yield* db.delete(forms).where(eq(forms.id, formId));

	return true;
});

export const publishForm = Effect.fn("publishForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* FormNotFoundError.make({ formId });
	}

	yield* db.update(forms).set({ status: "published" }).where(eq(forms.id, formId));

	return true;
});

export const unpublishForm = Effect.fn("unpublishForm")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* FormNotFoundError.make({ formId });
	}

	yield* db.update(forms).set({ status: "draft" }).where(eq(forms.id, formId));

	return true;
});

export const cloneForm = Effect.fn("cloneForm")(function* (formId: string, userId: string) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, formId)).limit(1);

	const originalForm = formRows[0];
	if (!originalForm) {
		return yield* FormNotFoundError.make({ formId });
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
		return yield* FormNotFoundError.make({ formId: input.formId });
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
					previousJapaneseScore: user.previousJapaneseScore,
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
		return yield* FormNotFoundError.make({ formId: input.formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, input.formId));

	if (responseRows.length > 0) {
		return yield* FormHasResponsesError.make({
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
		return yield* InvalidQuestionOrderError.make({
			formId: input.formId,
			reason: "Question count mismatch",
		});
	}

	for (const id of input.questionIds) {
		if (!existingQuestionIds.has(id)) {
			return yield* InvalidQuestionOrderError.make({
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
		return yield* FormNotFoundError.make({ formId: data.formId });
	}

	if (form.status !== "published") {
		return yield* FormNotPublishedError.make({ formId: data.formId });
	}

	const existingResponse = yield* db
		.select()
		.from(formResponses)
		.where(and(eq(formResponses.formId, data.formId), eq(formResponses.userId, data.userId)))
		.limit(1);

	if (existingResponse.length > 0) {
		return yield* FormAlreadySubmittedError.make({
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

class QuestionNotFoundError extends Schema.TaggedError("QuestionNotFoundError")<{
	readonly questionId: string;
}> {}

export const createQuestion = Effect.fn("createQuestion")(function* (data: CreateQuestionInput) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, data.formId)).limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* FormNotFoundError.make({ formId: data.formId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, data.formId));

	if (responseRows.length > 0) {
		return yield* FormHasResponsesError.make({
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
		return yield* QuestionNotFoundError.make({
			questionId: data.questionId,
		});
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, question.formId));

	if (responseRows.length > 0) {
		return yield* FormHasResponsesError.make({
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
		return yield* QuestionNotFoundError.make({ questionId });
	}

	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(eq(formResponses.formId, question.formId));

	if (responseRows.length > 0) {
		return yield* FormHasResponsesError.make({
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
	unlockConditions: FormUnlockConditionsNullable,
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

// Returns the registration form ID if it exists and user's completion status
export const getRegistrationFormStatus = Effect.fn("getRegistrationFormStatus")(function* (
	userId: string,
) {
	const db = yield* Database;

	const registrationForms = yield* db
		.select()
		.from(forms)
		.where(and(eq(forms.type, "registration"), eq(forms.status, "published")))
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
});

// Get all published forms for students with unlock status

// Form type priority order for display and required flow
// registration → pre_test → post_test → delayed_test
// TAM/questionnaire are optional, shown once published for the matching audience
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

function areAllFormsOfTypeCompleted(
	formsOfType: Array<{ id: string }>,
	progressMap: Map<string, { status: string }>,
): boolean {
	if (formsOfType.length === 0) return false;
	return formsOfType.every((f) => progressMap.get(f.id)?.status === "completed");
}

const OPTIONAL_FORM_TYPES = new Set<FormType>(["tam", "questionnaire"]);
const REQUIRED_FORM_TYPES: FormType[] = ["pre_test", "post_test", "delayed_test"];

function getNextRequiredType(completed: Set<FormType>, available: Set<FormType>): FormType | null {
	for (const type of REQUIRED_FORM_TYPES) {
		if (available.has(type) && !completed.has(type)) {
			return type;
		}
	}
	return null;
}

// Get all published forms for students with sequential unlock status
// Enforces order: registration → pre_test → post_test → delayed_test
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

	const experimentGroupRows: AssignmentConditionRow[] =
		assignmentIds.length > 0
			? yield* db
					.select({
						assignmentId: assignmentExperimentGroups.assignmentId,
						condition: assignmentExperimentGroups.condition,
					})
					.from(assignmentExperimentGroups)
					.where(
						and(
							eq(assignmentExperimentGroups.userId, userId),
							inArray(assignmentExperimentGroups.assignmentId, assignmentIds),
						),
					)
			: [];

	const audiencesByFormId = buildAccessibleFormAudiences(assignmentRows, experimentGroupRows);

	const publishedForms = yield* db.select().from(forms).where(eq(forms.status, "published"));

	const applicableForms = publishedForms.filter(
		(form) => !shouldExcludeForm(form, audiencesByFormId),
	);

	const userProgressRows = yield* db
		.select()
		.from(formProgress)
		.where(eq(formProgress.userId, userId));

	const progressMap = new Map(userProgressRows.map((p) => [p.formId, p]));

	const formsByType = new Map<FormType, typeof applicableForms>();
	for (const form of applicableForms) {
		const list = formsByType.get(form.type) ?? [];
		list.push(form);
		formsByType.set(form.type, list);
	}

	const availableTypes = new Set<FormType>(formsByType.keys());
	const completedTypes = new Set<FormType>();
	for (const [type, list] of formsByType) {
		if (areAllFormsOfTypeCompleted(list, progressMap)) {
			completedTypes.add(type);
		}
	}

	const nextRequired = getNextRequiredType(completedTypes, availableTypes);
	const nextPriority = nextRequired ? FORM_TYPE_PRIORITY[nextRequired] : Infinity;
	const sortedForms = applicableForms.sort(sortFormsByPriority);

	return sortedForms.map((form) => {
		const progress = progressMap.get(form.id);
		const isOptionalForm = OPTIONAL_FORM_TYPES.has(form.type);
		let unlockStatus: "locked" | "available" | "completed" = progress?.status ?? "locked";
		let isUnlocked = progress?.status === "available" || progress?.status === "completed";

		if (isOptionalForm) {
			unlockStatus = progress?.status === "completed" ? "completed" : "available";
			isUnlocked = true;
		} else {
			const formPriority = FORM_TYPE_PRIORITY[form.type];
			if (formPriority > nextPriority && unlockStatus !== "completed") {
				unlockStatus = "locked";
				isUnlocked = false;
			}
		}

		return {
			id: form.id,
			title: form.title,
			description: form.description,
			type: form.type,
			audience: form.audience,
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
});
