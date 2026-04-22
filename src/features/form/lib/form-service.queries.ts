import { and, count, desc, eq, inArray } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { isCorrectMcqAnswer } from "@/features/form/lib/form-scoring";
import { parseJson, safeParseJson } from "@/lib/utils";
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

import {
	AssignmentFormRow,
	FormNotFoundError,
	GetFormByIdOutputSchema,
	GetFormResponsesInput,
	GetFormResponsesOutputSchema,
	GetStudentFormByIdOutputSchema,
	QuestionOptions,
	ReadingMaterialSections,
	resolveFormAccessScope,
	shouldExcludeForm,
	FormNotAccessibleError,
	sortFormsByPriority,
} from "./form-service.shared";

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

	const formAccessScope = yield* resolveFormAccessScope(formId, userId);

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let studentOptions: any;
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
				studentOptions = parsedOptions;
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
				answers: responseAnswers ?? {},
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

	const userRows = yield* db
		.select({ studyGroup: users.studyGroup })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
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

	return sortedForms.map((form) => {
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
	});
});
