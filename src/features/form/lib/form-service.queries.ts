import { and, count, desc, eq, inArray, isNull, or } from "drizzle-orm";
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
	goalMaps,
	questions,
	texts,
} from "@/server/db/schema/app-schema";
import { cohortMembers, user as users } from "@/server/db/schema/auth-schema";

import {
	FormNotAccessibleError,
	FormType,
	GetStudentFormByIdOutput,
	MaterialImage,
	MaterialImageSchema,
	AssignmentFormRow,
	FormNotFoundError,
	GetFormByIdOutputSchema,
	GetFormResponsesInput,
	GetFormResponsesOutputSchema,
	QuestionOptions,
	ReadingMaterialSections,
	resolveFormAccessScope,
	shouldExcludeForm,
	sortFormsByPriority,
} from "./form-service.shared";

export const getFormById = Effect.fn("getFormById")(function* (formId: string) {
	const db = yield* Database;

	const formRows = yield* db
		.select()
		.from(forms)
		.where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
		.limit(1);

	const formRow = formRows[0];
	if (!formRow) {
		return yield* new FormNotFoundError({ formId });
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(and(eq(questions.formId, formId), isNull(questions.deletedAt)))
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
		{ concurrency: 10 },
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

export const getStudentFormById = Effect.fn("getStudentFormById")(function* (
	formId: string,
	userId: string,
) {
	const db = yield* Database;

	const formRows = yield* db
		.select()
		.from(forms)
		.where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
		.limit(1);

	const formRow = formRows[0];
	if (!formRow) {
		return yield* new FormNotFoundError({ formId });
	}

	// Allow access to published forms for students
	// (progress check only matters for submission, not viewing)
	if (formRow.status !== "published") {
		return yield* new FormNotAccessibleError({ formId });
	}

	// Check for existing submission FIRST so already-submitted forms
	// are always viewable regardless of assignment access scope changes
	const responseRows = yield* db
		.select()
		.from(formResponses)
		.where(
			and(
				eq(formResponses.formId, formId),
				eq(formResponses.userId, userId),
				isNull(formResponses.deletedAt),
			),
		)
		.limit(1);

	const responseRow = responseRows[0] ?? null;

	// Only enforce access scope checks for forms not yet submitted
	if (!responseRow) {
		const formAccessScope = yield* resolveFormAccessScope(formId, userId);

		if (
			formAccessScope.linkedAssignmentRows.length > 0 &&
			formAccessScope.accessibleAssignmentRows.length === 0
		) {
			return yield* new FormNotAccessibleError({ formId });
		}

		if (
			shouldExcludeForm(
				{ id: formRow.id, type: formRow.type as FormType, audience: formRow.audience },
				formAccessScope.studyGroup,
			)
		) {
			return yield* new FormNotAccessibleError({ formId });
		}
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(and(eq(questions.formId, formId), isNull(questions.deletedAt)))
		.orderBy(questions.orderIndex);

	const rawAnswers = responseRow?.answers;
	const responseAnswers: Record<string, unknown> | undefined =
		typeof rawAnswers === "string"
			? yield* safeParseJson(rawAnswers, {} as Record<string, unknown>)
			: (rawAnswers as Record<string, unknown> | undefined);

	const readingMaterialSections = yield* safeParseJson(
		formRow.readingMaterialSections,
		null,
		Schema.NullOr(ReadingMaterialSections),
	);

	// Fetch goal map material images linked via assignments
	const assignmentRows = yield* db
		.select({ goalMapId: assignments.goalMapId })
		.from(assignments)
		.where(
			and(
				or(
					eq(assignments.preTestFormId, formId),
					eq(assignments.postTestFormId, formId),
					eq(assignments.delayedPostTestFormId, formId),
				),
				isNull(assignments.deletedAt),
			),
		)
		.limit(1);

	const materialImages: MaterialImage[] = [];
	if (assignmentRows.length > 0) {
		const goalMapId = assignmentRows[0].goalMapId;
		if (goalMapId) {
			const goalMapRows = yield* db
				.select({ images: texts.images })
				.from(goalMaps)
				.leftJoin(texts, eq(goalMaps.textId, texts.id))
				.where(
					and(
						eq(goalMaps.id, goalMapId),
						isNull(goalMaps.deletedAt),
						isNull(texts.deletedAt),
					),
				)
				.limit(1);

			if (goalMapRows.length > 0 && goalMapRows[0].images) {
				const parsed = yield* safeParseJson(
					goalMapRows[0].images,
					[] as MaterialImage[],
					Schema.Array(MaterialImageSchema),
				);
				materialImages.push(...parsed);
			}
		}
	}

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
				const studentOptions =
					parsedOptions?.type === "mcq"
						? {
								type: "mcq" as const,
								options: parsedOptions.options,
								shuffle: parsedOptions.shuffle,
								// NOTE: correctOptionIds is intentionally omitted for student view
							}
						: parsedOptions;

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

	return {
		form: {
			...form,
			createdAt: form.createdAt.getTime(),
			updatedAt: form.updatedAt.getTime(),
		},
		questions: mappedQuestions,
		submission: submission,
		materialImages,
	} as GetStudentFormByIdOutput;
});

export const listForms = Effect.fn("listForms")(function* () {
	const db = yield* Database;
	const formRows = yield* db
		.select()
		.from(forms)
		.where(isNull(forms.deletedAt))
		.orderBy(forms.createdAt);

	const formIds = formRows.map((f) => f.id);

	const allProgressRows =
		formIds.length > 0
			? yield* db
					.select({
						formId: formProgress.formId,
						status: formProgress.status,
						count: count(),
					})
					.from(formProgress)
					.where(
						and(inArray(formProgress.formId, formIds), isNull(formProgress.deletedAt)),
					)
					.groupBy(formProgress.formId, formProgress.status)
			: [];

	const progressByForm = new Map<
		string,
		{ completed: number; available: number; locked: number }
	>();

	for (const row of allProgressRows) {
		const entry = progressByForm.get(row.formId) ?? {
			completed: 0,
			available: 0,
			locked: 0,
		};
		entry[row.status] = row.count;
		progressByForm.set(row.formId, entry);
	}

	const formsWithStats = formRows.map((formRow) => {
		const progress = progressByForm.get(formRow.id) ?? {
			completed: 0,
			available: 0,
			locked: 0,
		};

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
			stats: {
				...progress,
				total: progress.completed + progress.available + progress.locked,
			},
		};
	});

	return formsWithStats;
});

export const getFormResponses = Effect.fn("getFormResponses")(function* (
	input: GetFormResponsesInput,
) {
	const db = yield* Database;

	const formRows = yield* db
		.select()
		.from(forms)
		.where(and(eq(forms.id, input.formId), isNull(forms.deletedAt)))
		.limit(1);

	const form = formRows[0];
	if (!form) {
		return yield* new FormNotFoundError({ formId: input.formId });
	}

	const questionRows = yield* db
		.select()
		.from(questions)
		.where(and(eq(questions.formId, input.formId), isNull(questions.deletedAt)))
		.orderBy(questions.orderIndex);

	const questionOptionMap = new Map<
		string,
		{ type: "mcq"; correctOptionIds: ReadonlyArray<string> } | null
	>();
	for (const q of questionRows) {
		const parsedOpts =
			typeof q.options === "string"
				? (JSON.parse(q.options) as Record<string, unknown>)
				: (q.options as Record<string, unknown> | null);
		if (parsedOpts?.type === "mcq" && Array.isArray(parsedOpts.correctOptionIds)) {
			questionOptionMap.set(q.id, {
				type: "mcq",
				correctOptionIds: parsedOpts.correctOptionIds as string[],
			});
		} else {
			questionOptionMap.set(q.id, null);
		}
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
			.where(and(eq(formResponses.formId, input.formId), isNull(formResponses.deletedAt)))
			.innerJoin(users, and(eq(formResponses.userId, users.id), isNull(users.deletedAt)))
			.orderBy(desc(formResponses.submittedAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(formResponses)
			.where(and(eq(formResponses.formId, input.formId), isNull(formResponses.deletedAt))),
	]);

	const total = countResult[0]?.total ?? 0;
	const totalPages = Math.ceil(total / limit);

	const parsedResponses = yield* Effect.all(
		responseRows.map((row) =>
			Effect.gen(function* () {
				const parsedAnswers = yield* parseJson<Record<string, unknown>>(
					row.response.answers,
				);

				let correctCount = 0;
				let scoredQuestionCount = 0;
				for (const [qId, scorable] of questionOptionMap) {
					const answer = parsedAnswers[qId];
					const isCorrect = isCorrectMcqAnswer(scorable, answer);
					if (isCorrect !== null) {
						scoredQuestionCount += 1;
						if (isCorrect) correctCount += 1;
					}
				}
				const score = scoredQuestionCount > 0 ? correctCount / scoredQuestionCount : null;

				return {
					id: row.response.id,
					formId: row.response.formId,
					userId: row.response.userId,
					answers: parsedAnswers,
					submittedAt: row.response.submittedAt,
					timeSpentSeconds: row.response.timeSpentSeconds,
					score,
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
		.where(and(eq(assignmentTargets.userId, userId), isNull(assignmentTargets.deletedAt)));

	const cohortAssignmentRows = yield* db
		.select({ assignmentId: assignmentTargets.assignmentId })
		.from(assignmentTargets)
		.innerJoin(
			cohortMembers,
			and(
				eq(cohortMembers.cohortId, assignmentTargets.cohortId),
				isNull(cohortMembers.deletedAt),
			),
		)
		.where(and(eq(cohortMembers.userId, userId), isNull(assignmentTargets.deletedAt)));

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
					})
					.from(assignments)
					.where(
						and(inArray(assignments.id, assignmentIds), isNull(assignments.deletedAt)),
					)
			: [];

	const userRows = yield* db
		.select({ studyGroup: users.studyGroup })
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1);
	const studyGroup = userRows[0]?.studyGroup ?? null;
	const assignmentLinkedFormIds = new Set(
		assignmentRows
			.flatMap((assignment) => [
				assignment.preTestFormId,
				assignment.postTestFormId,
				assignment.delayedPostTestFormId,
			])
			.filter((formId): formId is string => formId !== null),
	);

	const publishedForms = yield* db
		.select()
		.from(forms)
		.where(and(eq(forms.status, "published"), isNull(forms.deletedAt)));

	const applicableForms = publishedForms.filter((form) => {
		const isAssignmentScopedForm =
			form.type === "pre_test" || form.type === "post_test" || form.type === "delayed_test";

		if (isAssignmentScopedForm && !assignmentLinkedFormIds.has(form.id)) {
			return false;
		}

		return !shouldExcludeForm(form as Parameters<typeof shouldExcludeForm>[0], studyGroup);
	});

	const userProgressRows = yield* db
		.select()
		.from(formProgress)
		.where(and(eq(formProgress.userId, userId), isNull(formProgress.deletedAt)));

	const progressMap = new Map(userProgressRows.map((p) => [p.formId, p]));
	const sortedForms = applicableForms
		.slice()
		.sort((a, b) =>
			sortFormsByPriority(
				a as Parameters<typeof sortFormsByPriority>[0],
				b as Parameters<typeof sortFormsByPriority>[0],
			),
		);

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
