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
			yield* Effect.log(
				`  Creating ${FEEDBACK_QUESTIONS.length} feedback questions...`,
			);
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
			yield* Effect.log(
				`  Created ${FEEDBACK_QUESTIONS.length} feedback questions`,
			);
		} else {
			yield* Effect.log(`  Feedback questions already exist`);
		}

		yield* Effect.log("--- Seeding Reading Comprehension Test Forms ---");

		function* createTestForm(
			formType: "pre_test" | "post_test" | "delayed_test",
			title: string,
			description: string,
		) {
			const existingForm = yield* db
				.select()
				.from(forms)
				.where(eq(forms.title, title))
				.limit(1);

			let formId: string;
			if (existingForm[0]) {
				formId = existingForm[0].id;
				yield* Effect.log(`  ${formType} form already exists: ${title}`);
			} else {
				formId = randomString();
				yield* db.insert(forms).values({
					id: formId,
					title,
					description,
					type: formType,
					status: "published",
					createdBy: teacherId,
				});
				yield* Effect.log(`  Created ${formType} form: ${title}`);
			}
			return formId;
		}

		const preTestFormId = yield* createTestForm(
			"pre_test",
			"Reading Comprehension Pre-Test",
			"Pre-test to measure baseline reading comprehension. Passage: Tanaka's Daily Life (JLPT N5-N4 level). 20 MCQ questions based on Bloom's Taxonomy.",
		);

		const postTestFormId = yield* createTestForm(
			"post_test",
			"Reading Comprehension Post-Test",
			"Post-test to measure immediate learning outcomes. Same questions as pre-test. Passage: Tanaka's Daily Life (JLPT N5-N4 level).",
		);

		const delayedTestFormId = yield* createTestForm(
			"delayed_test",
			"Reading Comprehension Delayed Test",
			"Delayed test (1 week) to measure retention. Same questions as pre/post-test. Passage: Tanaka's Daily Life (JLPT N5-N4 level).",
		);

		yield* Effect.log("  Seeding reading comprehension questions...");

		for (const formId of [preTestFormId, postTestFormId, delayedTestFormId]) {
			const formName =
				formId === preTestFormId
					? "Pre-Test"
					: formId === postTestFormId
						? "Post-Test"
						: "Delayed Test";

			const existingQuestions = yield* db
				.select()
				.from(questions)
				.where(eq(questions.formId, formId));

			if (existingQuestions.length > 0) {
				yield* Effect.log(`  ${formName} questions already exist`);
				continue;
			}

			yield* Effect.log(
				`  Creating ${READING_COMPREHENSION_QUESTIONS.length} questions for ${formName}...`,
			);
			yield* Effect.all(
				READING_COMPREHENSION_QUESTIONS.map((q, index) =>
					Effect.gen(function* () {
						yield* db.insert(questions).values({
							id: randomString(),
							formId: formId,
							type: "mcq",
							questionText: `[${q.bloomLevel}] ${q.questionText}`,
							options: JSON.stringify(q.options),
							orderIndex: index,
							required: true,
						});
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(
				`  Created ${READING_COMPREHENSION_QUESTIONS.length} questions for ${formName}`,
			);
		}

		return {
			tamFormId,
			feedbackFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
		};
	});
}
