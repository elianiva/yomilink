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

function upsertQuestions(
	formId: string,
	sourceQuestions: ReadonlyArray<{ type: string; questionText: string; options: unknown }>,
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
					options: JSON.stringify(q.options),
					orderIndex: index,
					required: true,
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
						options: JSON.stringify(q.options),
					})
					.where(eq(questions.id, existingQuestion.id));
				continue;
			}

			yield* db.insert(questions).values({
				id: randomString(),
				formId,
				type: q.type ?? "mcq",
				questionText: q.questionText,
				options: JSON.stringify(q.options),
				orderIndex: index,
				required: true,
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

		const tamFormTitle = "TAM Questionnaire - Kit-Build Evaluation";
		const existingTamForm = yield* db.select().from(forms).where(eq(forms.title, tamFormTitle)).limit(1);

		let tamFormId: string;
		if (existingTamForm[0]) {
			tamFormId = existingTamForm[0].id;
			yield* db
				.update(forms)
				.set({
					description:
						"Technology Acceptance Model questionnaire to evaluate Kit-Build's usefulness and ease of use. Scale: 1=Strongly Disagree to 5=Strongly Agree",
					type: "tam",
					audience: "experiment",
					status: "published",
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
					"Technology Acceptance Model questionnaire to evaluate Kit-Build's usefulness and ease of use. Scale: 1=Strongly Disagree to 5=Strongly Agree",
				type: "tam",
				audience: "experiment",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log("  Created TAM form: " + tamFormTitle);
		}

		yield* upsertQuestions(tamFormId, TAM_QUESTIONS);

		const feedbackFormTitle = "Feedback Questionnaire - Kit-Build Experience";
		const existingFeedbackForm = yield* db.select().from(forms).where(eq(forms.title, feedbackFormTitle)).limit(1);

		let feedbackFormId: string;
		if (existingFeedbackForm[0]) {
			feedbackFormId = existingFeedbackForm[0].id;
			yield* db
				.update(forms)
				.set({
					description: "Open-ended feedback about the Kit-Build learning experience",
					type: "questionnaire",
					audience: "all",
					status: "published",
					createdBy: teacherId,
				})
				.where(eq(forms.id, feedbackFormId));
			yield* Effect.log("  Feedback form already exists: " + feedbackFormTitle);
		} else {
			feedbackFormId = randomString();
			yield* db.insert(forms).values({
				id: feedbackFormId,
				title: feedbackFormTitle,
				description: "Open-ended feedback about the Kit-Build learning experience",
				type: "questionnaire",
				audience: "all",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log("  Created feedback form: " + feedbackFormTitle);
		}

		const existingFeedbackQuestions = yield* db.select().from(questions).where(eq(questions.formId, feedbackFormId));
		if (existingFeedbackQuestions.length === 0) {
			for (const [index, q] of FEEDBACK_QUESTIONS.entries()) {
				yield* db.insert(questions).values({
					id: randomString(),
					formId: feedbackFormId,
					type: q.type ?? "mcq",
					questionText: q.questionText,
					options: JSON.stringify(q.options),
					orderIndex: index,
					required: false,
				});
			}
		}

		yield* Effect.log("--- Seeding reading comprehension test forms ---");

		const preTestFormTitle = "Reading Comprehension Pre-Test";
		const preTestDescription =
			"Pre-test to measure baseline reading comprehension for Japan's three main islands and their major cities. 20 MCQ items based on Bloom's Taxonomy. The same questions are reused for the post-test and delayed-test.";
		const existingPreTestForm = yield* db.select().from(forms).where(eq(forms.title, preTestFormTitle)).limit(1);

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
				createdBy: teacherId,
			});
			yield* Effect.log("  Created pre-test form: " + preTestFormTitle);
		}

		yield* upsertQuestions(preTestFormId, READING_COMPREHENSION_QUESTIONS);

		const postTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "Reading Comprehension Post-Test",
			description:
				"Post-test to measure immediate learning outcomes after the reading session. Same reading passage and same questions as the pre-test.",
			type: "post_test",
			audience: "all",
			teacherId,
		}).pipe(Effect.map((result) => result.formId));

		const delayedTestFormId = yield* copyFormWithQuestions({
			sourceFormId: preTestFormId,
			title: "Reading Comprehension Delayed Test",
			description:
				"Delayed test to measure retention after one week. Same reading passage and same questions as the pre-test.",
			type: "delayed_test",
			audience: "all",
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
