import { and, eq, inArray, or } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import { assignmentTargets, assignments } from "@/server/db/schema/app-schema";
import { cohortMembers, user as users } from "@/server/db/schema/auth-schema";

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

export function normalizeFormAudience(type: FormType, audience: FormAudience): FormAudience {
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

export function shouldExcludeForm(
	form: { id: string; type: FormType; audience: FormAudience },
	studyGroup: "experiment" | "control" | null,
): boolean {
	if (form.type === "registration") return true;
	if (form.audience === "all") return false;
	if (!studyGroup) return true;
	return form.audience !== studyGroup;
}

export type AssignmentFormRow = {
	id: string;
	preTestFormId: string | null;
	postTestFormId: string | null;
	delayedPostTestFormId: string | null;
	tamFormId: string | null;
};

export type FormAccessScope = {
	linkedAssignmentRows: ReadonlyArray<AssignmentFormRow>;
	accessibleAssignmentRows: ReadonlyArray<AssignmentFormRow>;
	studyGroup: "experiment" | "control" | null;
};

export const getAccessibleAssignmentIdsForUser = Effect.fn(
	"getAccessibleAssignmentIdsForUser",
)(function* (userId: string, assignmentIds: ReadonlyArray<string>) {
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

export const resolveFormAccessScope = Effect.fn("resolveFormAccessScope")(function* (
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

	const userRows = yield* db
		.select({ studyGroup: users.studyGroup })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
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

export class FormNotFoundError extends Data.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

export class FormHasResponsesError extends Data.TaggedError("FormHasResponsesError")<{
	readonly formId: string;
	readonly responseCount: number;
}> {}

export class InvalidQuestionOrderError extends Data.TaggedError("InvalidQuestionOrderError")<{
	readonly formId: string;
	readonly reason: string;
}> {}

export class FormNotPublishedError extends Data.TaggedError("FormNotPublishedError")<{
	readonly formId: string;
}> {}

export class FormAlreadySubmittedError extends Data.TaggedError("FormAlreadySubmittedError")<{
	readonly formId: string;
	readonly userId: string;
}> {}

export class InvalidReadingMaterialSectionsError extends Data.TaggedError(
	"InvalidReadingMaterialSectionsError",
)<{
	readonly reason: string;
}> {}

export const normalizeAndValidateReadingMaterialSections = Effect.fn(
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

export const CreateFormInput = Schema.Struct({
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	type: Schema.optionalWith(FormTypeSchema, { nullable: true }),
	audience: Schema.optionalWith(FormAudienceSchema, { default: () => "all" }),
	readingMaterialSections: Schema.optionalWith(ReadingMaterialSections, { nullable: true }),
});

export type CreateFormInput = typeof CreateFormInput.Type;

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

export const ReorderQuestionsInput = Schema.Struct({
	formId: NonEmpty("Form ID"),
	questionIds: Schema.Array(NonEmpty("Question ID")),
});

export type ReorderQuestionsInput = typeof ReorderQuestionsInput.Type;

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

export class QuestionNotFoundError extends Data.TaggedError("QuestionNotFoundError")<{
	readonly questionId: string;
}> {}

export const UpdateQuestionInput = Schema.Struct({
	questionId: NonEmpty("Question ID"),
	questionText: Schema.optionalWith(NonEmpty("Question text"), { nullable: true }),
	options: Schema.optionalWith(QuestionOptions, { nullable: true }),
	required: Schema.optionalWith(Schema.Boolean, { nullable: true }),
});

export type UpdateQuestionInput = typeof UpdateQuestionInput.Type;

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
	answers: Schema.Record({ key: Schema.String, value: Schema.Any }),
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
export const FORM_TYPE_PRIORITY: Record<FormType, number> = {
	registration: -1, // Completed during sign-up, not shown in dashboard
	pre_test: 0,
	post_test: 1,
	tam: 2,
	questionnaire: 2,
	delayed_test: 3,
};

export function sortFormsByPriority(
	a: { type: FormType; createdAt: Date },
	b: { type: FormType; createdAt: Date },
) {
	const diff = FORM_TYPE_PRIORITY[a.type] - FORM_TYPE_PRIORITY[b.type];
	return diff !== 0 ? diff : a.createdAt.getTime() - b.createdAt.getTime();
}

export class FormNotAccessibleError extends Data.TaggedError("FormNotAccessibleError")<{
	readonly formId: string;
}> {}
