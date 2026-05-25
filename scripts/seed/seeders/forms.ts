import { and, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";

import type { ReadingMaterialSection } from "@/features/form/lib/form-service.shared";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { forms, questions } from "@/server/db/schema/app-schema";

import { GOAL_MAP_TO_MATERIAL } from "../data/materials.js";
import {
	FEEDBACK_QUESTIONS,
	READING_COMPREHENSION_QUESTIONS,
	TAM_QUESTIONS,
} from "../data/questions.js";
import { copyFormWithQuestions } from "./form-copy.js";

type QuestionType = "mcq" | "likert" | "text";

type SeedQuestion = {
	type?: QuestionType;
	questionText: string;
	options: unknown;
	correctOptionId?: string;
};

function getQuestionOptions(question: SeedQuestion): string {
	if (question.type === "likert" || question.type === "text") {
		if (question.type === "text" && Array.isArray(question.options)) {
			return JSON.stringify({ type: "text" });
		}
		return JSON.stringify(question.options);
	}

	if (Array.isArray(question.options)) {
		const fallbackCorrectOptionId = question.options[0]?.id;
		const correctOptionId = question.correctOptionId ?? fallbackCorrectOptionId;
		return JSON.stringify({
			type: "mcq",
			options: question.options,
			correctOptionIds: correctOptionId ? [correctOptionId] : [],
			shuffle: true,
		});
	}

	return JSON.stringify(question.options);
}

function buildReadingMaterialSections(
	totalQuestions: number,
	materialTitle: string = "わたしのうち",
): ReadonlyArray<ReadingMaterialSection> {
	const readingMaterialContent = GOAL_MAP_TO_MATERIAL[materialTitle]?.content.trim() ?? "";
	const content =
		readingMaterialContent.length > 0
			? readingMaterialContent
			: "Read the reference passage before answering the questions.";

	return [
		{
			id: `seed-reading-${materialTitle}`,
			title: materialTitle,
			startQuestion: 1,
			endQuestion: Math.max(1, totalQuestions),
			content,
		},
	];
}

function upsertQuestions(
	formId: string,
	sourceQuestions: ReadonlyArray<SeedQuestion>,
	required = true,
) {
	return Effect.gen(function* () {
		const db = yield* Database;
		const existingQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, formId))
			.orderBy(questions.orderIndex);

		if (existingQuestions.length === 0) {
			for (const [index, q] of sourceQuestions.entries()) {
				yield* db.insert(questions).values({
					id: randomString(),
					formId,
					type: q.type ?? "mcq",
					questionText: q.questionText,
					options: getQuestionOptions(q),
					orderIndex: index,
					required,
				});
			}
			return;
		}

		for (const [index, q] of sourceQuestions.entries()) {
			const existingQuestion = existingQuestions[index];
			if (existingQuestion) {
				yield* db
					.update(questions)
					.set({
						type: q.type ?? "mcq",
						questionText: q.questionText,
						options: getQuestionOptions(q),
						required,
					})
					.where(eq(questions.id, existingQuestion.id));
				continue;
			}

			yield* db.insert(questions).values({
				id: randomString(),
				formId,
				type: q.type ?? "mcq",
				questionText: q.questionText,
				options: getQuestionOptions(q),
				orderIndex: index,
				required,
			});
		}

		if (existingQuestions.length > sourceQuestions.length) {
			for (const question of existingQuestions.slice(sourceQuestions.length)) {
				yield* db.delete(questions).where(eq(questions.id, question.id));
			}
		}
	});
}

export function seedForms(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding TAM and questionnaire forms ---");

		const tamFormTitle = "「わたしのうち」 TAM Questionnaire";
		const existingTamForm = yield* db
			.select()
			.from(forms)
			.where(and(eq(forms.title, tamFormTitle), isNull(forms.deletedAt)))
			.limit(1);

		let tamFormId: string;
		if (existingTamForm[0]) {
			tamFormId = existingTamForm[0].id;
			yield* db
				.update(forms)
				.set({
					description:
						"Technology Acceptance Model questionnaire about Kit-Build — 10 Likert-scale questions on usefulness and ease of use.",
					type: "questionnaire",
					audience: "experiment",
					status: "published",
					readingMaterialSections: null,
					createdBy: teacherId,
				})
				.where(eq(forms.id, tamFormId));
			yield* Effect.log("  TAM form already exists: " + tamFormTitle);
		} else {
			tamFormId = randomString();
			yield* db.insert(forms).values({
				id: tamFormId,
				title: tamFormTitle,
				description:
					"Technology Acceptance Model questionnaire about Kit-Build — 10 Likert-scale questions on usefulness and ease of use.",
				type: "questionnaire",
				audience: "experiment",
				status: "published",
				readingMaterialSections: null,
				createdBy: teacherId,
			});
			yield* Effect.log("  Created TAM form: " + tamFormTitle);
		}

		yield* upsertQuestions(tamFormId, TAM_QUESTIONS);

		const feedbackFormTitle = "「わたしのうち」 Feedback Questionnaire";
		const existingFeedbackForm = yield* db
			.select()
			.from(forms)
			.where(and(eq(forms.title, feedbackFormTitle), isNull(forms.deletedAt)))
			.limit(1);

		let feedbackFormId: string;
		if (existingFeedbackForm[0]) {
			feedbackFormId = existingFeedbackForm[0].id;
			yield* db
				.update(forms)
				.set({
					description:
						"Open-ended feedback about Kit-Build — what you liked, difficulties, and suggestions.",
					type: "questionnaire",
					audience: "experiment",
					status: "published",
					readingMaterialSections: null,
					createdBy: teacherId,
				})
				.where(eq(forms.id, feedbackFormId));
			yield* Effect.log("  Feedback form already exists: " + feedbackFormTitle);
		} else {
			feedbackFormId = randomString();
			yield* db.insert(forms).values({
				id: feedbackFormId,
				title: feedbackFormTitle,
				description:
					"Open-ended feedback about Kit-Build — what you liked, difficulties, and suggestions.",
				type: "questionnaire",
				audience: "experiment",
				status: "published",
				readingMaterialSections: null,
				createdBy: teacherId,
			});
			yield* Effect.log("  Created feedback form: " + feedbackFormTitle);
		}

		yield* upsertQuestions(feedbackFormId, FEEDBACK_QUESTIONS, false);

		yield* Effect.log("--- Seeding reading comprehension test forms ---");

		const preTestFormTitle = "「わたしのうち」 Pre-Test";
		const readingComprehensionReadingMaterialSections = buildReadingMaterialSections(
			READING_COMPREHENSION_QUESTIONS.length,
		);
		const preTestDescription =
			"10 multiple-choice questions about the わたしのうち passage (4 options each) — Bloom's L1 to L2.";
		const existingPreTestForm = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, preTestFormTitle))
			.limit(1);

		let preTestFormId: string;
		if (existingPreTestForm[0]) {
			preTestFormId = existingPreTestForm[0].id;
			yield* db
				.update(forms)
				.set({
					description: preTestDescription,
					type: "pre_test",
					audience: "all",
					status: "published",
					readingMaterialSections: readingComprehensionReadingMaterialSections,
					createdBy: teacherId,
				})
				.where(eq(forms.id, preTestFormId));
			yield* Effect.log("  Pre-test form already exists: " + preTestFormTitle);
		} else {
			preTestFormId = randomString();
			yield* db.insert(forms).values({
				id: preTestFormId,
				title: preTestFormTitle,
				description: preTestDescription,
				type: "pre_test",
				audience: "all",
				status: "published",
				readingMaterialSections: readingComprehensionReadingMaterialSections,
				createdBy: teacherId,
			});
			yield* Effect.log("  Created pre-test form: " + preTestFormTitle);
		}

		yield* upsertQuestions(preTestFormId, READING_COMPREHENSION_QUESTIONS, false);

		const postTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "「わたしのうち」 Post-Test",
			description:
				"10 multiple-choice questions about わたしのうち (4 options each) — same as the pre-test.",
			type: "post_test",
			audience: "all",
			readingMaterialSections: readingComprehensionReadingMaterialSections,
			teacherId,
		}).pipe(Effect.map((result) => result.formId));

		const delayedTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "「わたしのうち」 Delayed-Test",
			description:
				"10 multiple-choice questions about わたしのうち (4 options each) — same as the pre-test.",
			type: "delayed_test",
			audience: "all",
			readingMaterialSections: readingComprehensionReadingMaterialSections,
			teacherId,
		}).pipe(Effect.map((result) => result.formId));

		return {
			feedbackFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
		};
	});
}
