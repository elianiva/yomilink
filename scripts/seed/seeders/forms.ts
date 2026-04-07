import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { forms, questions } from "@/server/db/schema/app-schema";

import {
	FEEDBACK_QUESTIONS,
	READING_COMPREHENSION_QUESTIONS,
	TAM_QUESTIONS,
} from "../data/questions.js";
import { copyFormWithQuestions } from "./form-copy.js";

export function seedForms(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding TAM and Feedback Forms ---");

		const tamFormTitle = "TAM Questionnaire - Kit-Build Evaluation";
		const existingTamForm = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, tamFormTitle))
			.limit(1);

		let tamFormId: string;
		if (existingTamForm[0]) {
			tamFormId = existingTamForm[0].id;
			yield* Effect.log(`  TAM form already exists: ${tamFormTitle}`);
		} else {
			tamFormId = randomString();
			yield* db.insert(forms).values({
				id: tamFormId,
				title: tamFormTitle,
				description:
					"Technology Acceptance Model questionnaire to evaluate Kit-Build's Perceived Usefulness (PU) and Perceived Ease of Use (PEoU). Scale: 1=Strongly Disagree to 5=Strongly Agree",
				type: "tam",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created TAM form: ${tamFormTitle}`);
		}

		const existingTamQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, tamFormId))
			.orderBy(questions.orderIndex);

		if (existingTamQuestions.length === 0) {
			yield* Effect.log(`  Creating ${TAM_QUESTIONS.length} TAM questions...`);
			yield* Effect.all(
				TAM_QUESTIONS.map((q, index) =>
					Effect.gen(function* () {
						yield* db.insert(questions).values({
							id: randomString(),
							formId: tamFormId,
							type: q.type,
							questionText: q.questionText,
							options: JSON.stringify(q.options),
							orderIndex: index,
							required: true,
						});
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${TAM_QUESTIONS.length} TAM questions`);
		} else {
			yield* Effect.log(`  Updating ${TAM_QUESTIONS.length} TAM questions...`);
			yield* Effect.all(
				TAM_QUESTIONS.map((q, index) =>
					Effect.gen(function* () {
						const existingQuestion = existingTamQuestions[index];
						if (existingQuestion) {
							yield* db
								.update(questions)
								.set({
									questionText: q.questionText,
									options: JSON.stringify(q.options),
									type: q.type,
								})
								.where(eq(questions.id, existingQuestion.id));
						}
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  TAM questions updated`);
		}

		const feedbackFormTitle = "Feedback Questionnaire - Kit-Build Experience";
		const existingFeedbackForm = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, feedbackFormTitle))
			.limit(1);

		let feedbackFormId: string;
		if (existingFeedbackForm[0]) {
			feedbackFormId = existingFeedbackForm[0].id;
			yield* Effect.log(`  Feedback form already exists: ${feedbackFormTitle}`);
		} else {
			feedbackFormId = randomString();
			yield* db.insert(forms).values({
				id: feedbackFormId,
				title: feedbackFormTitle,
				description:
					"Open-ended feedback questions about the Kit-Build learning experience",
				type: "control",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created feedback form: ${feedbackFormTitle}`);
		}

		const existingFeedbackQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, feedbackFormId));

		if (existingFeedbackQuestions.length === 0) {
			yield* Effect.log(`  Creating ${FEEDBACK_QUESTIONS.length} feedback questions...`);
			yield* Effect.all(
				FEEDBACK_QUESTIONS.map((q, index) =>
					Effect.gen(function* () {
						yield* db.insert(questions).values({
							id: randomString(),
							formId: feedbackFormId,
							type: q.type,
							questionText: q.questionText,
							options: JSON.stringify(q.options),
							orderIndex: index,
							required: false,
						});
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${FEEDBACK_QUESTIONS.length} feedback questions`);
		} else {
			yield* Effect.log(`  Feedback questions already exist`);
		}

		yield* Effect.log("--- Seeding Reading Comprehension Test Forms ---");

		const preTestFormTitle = "Reading Comprehension Pre-Test";
		const existingPreTestForm = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, preTestFormTitle))
			.limit(1);

		let preTestFormId: string;
		if (existingPreTestForm[0]) {
			preTestFormId = existingPreTestForm[0].id;
			yield* Effect.log(`  pre_test form already exists: ${preTestFormTitle}`);
		} else {
			preTestFormId = randomString();
			yield* db.insert(forms).values({
				id: preTestFormId,
				title: preTestFormTitle,
				description:
					"Pre-test to measure baseline reading comprehension. Passage: Tanaka's Daily Life (JLPT N5-N4 level). 20 MCQ questions based on Bloom's Taxonomy.",
				type: "pre_test",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created pre_test form: ${preTestFormTitle}`);
		}

		const preTestQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, preTestFormId))
			.orderBy(questions.orderIndex);

		if (preTestQuestions.length === 0) {
			yield* Effect.log(
				`  Creating ${READING_COMPREHENSION_QUESTIONS.length} questions for Pre-Test...`,
			);
			yield* Effect.all(
				READING_COMPREHENSION_QUESTIONS.map((q, index) =>
					Effect.gen(function* () {
						const mcqOptions = {
							type: "mcq" as const,
							options: q.options,
							correctOptionIds: [q.correctOptionId],
							shuffle: false,
						};
						yield* db.insert(questions).values({
							id: randomString(),
							formId: preTestFormId,
							type: "mcq",
							questionText: `[${q.bloomLevel}] ${q.questionText}`,
							options: JSON.stringify(mcqOptions),
							orderIndex: index,
							required: true,
						});
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(
				`  Created ${READING_COMPREHENSION_QUESTIONS.length} questions for Pre-Test`,
			);
		}

		const postTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "Reading Comprehension Post-Test",
			description:
				"Post-test to measure immediate learning outcomes. Same questions as pre-test. Passage: Tanaka's Daily Life (JLPT N5-N4 level).",
			type: "post_test",
			teacherId,
		}).pipe(Effect.map((result) => result.formId));

		const delayedTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "Reading Comprehension Delayed Test",
			description:
				"Delayed test (1 week) to measure retention. Same questions as pre/post-test. Passage: Tanaka's Daily Life (JLPT N5-N4 level).",
			type: "delayed_test",
			teacherId,
		}).pipe(Effect.map((result) => result.formId));

		return {
			tamFormId,
			feedbackFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
		};
	});
}
