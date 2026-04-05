import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { forms, questions } from "@/server/db/schema/app-schema";
import { cohorts } from "@/server/db/schema/auth-schema";

import {
	FEEDBACK_QUESTIONS,
	READING_COMPREHENSION_QUESTIONS,
	TAM_QUESTIONS,
} from "../data/questions.js";

const WRI_2026_COHORT = {
	name: "WRI 2026",
	description: "Writera Research Internship 2026 cohort",
};

export function seedWri2026Cohort() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding WRI 2026 Cohort ---");

		const existing = yield* db
			.select()
			.from(cohorts)
			.where(eq(cohorts.name, WRI_2026_COHORT.name))
			.limit(1);

		let cohortId: string;
		if (existing[0]) {
			cohortId = existing[0].id;
			yield* Effect.log(`  Cohort "${WRI_2026_COHORT.name}" already exists`);
		} else {
			cohortId = randomString();
			yield* db.insert(cohorts).values({
				id: cohortId,
				name: WRI_2026_COHORT.name,
				description: WRI_2026_COHORT.description,
			});
			yield* Effect.log(`  Created cohort: ${WRI_2026_COHORT.name}`);
		}

		return { cohortId };
	});
}

export function seedWri2026Forms(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding WRI 2026 Questionnaires ---");

		// TAM Form
		const tamFormTitle = "TAM Questionnaire - Kit-Build Evaluation";
		const existingTam = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, tamFormTitle))
			.limit(1);

		let tamFormId: string;
		if (existingTam[0]) {
			tamFormId = existingTam[0].id;
			yield* Effect.log(`  TAM form already exists`);
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
			yield* Effect.log(`  Created TAM form`);
		}

		const existingTamQs = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, tamFormId));

		if (existingTamQs.length === 0) {
			yield* Effect.all(
				TAM_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId: tamFormId,
						type: q.type,
						questionText: q.questionText,
						options: JSON.stringify(q.options),
						orderIndex: idx,
						required: true,
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${TAM_QUESTIONS.length} TAM questions`);
		}

		// Feedback Form
		const feedbackTitle = "Feedback Questionnaire - Kit-Build Experience";
		const existingFeedback = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, feedbackTitle))
			.limit(1);

		let feedbackFormId: string;
		if (existingFeedback[0]) {
			feedbackFormId = existingFeedback[0].id;
			yield* Effect.log(`  Feedback form already exists`);
		} else {
			feedbackFormId = randomString();
			yield* db.insert(forms).values({
				id: feedbackFormId,
				title: feedbackTitle,
				description:
					"Open-ended feedback questions about the Kit-Build learning experience",
				type: "control",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created feedback form`);
		}

		const existingFeedbackQs = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, feedbackFormId));

		if (existingFeedbackQs.length === 0) {
			yield* Effect.all(
				FEEDBACK_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId: feedbackFormId,
						type: q.type,
						questionText: q.questionText,
						options: JSON.stringify(q.options),
						orderIndex: idx,
						required: false,
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${FEEDBACK_QUESTIONS.length} feedback questions`);
		}

		// Reading Comprehension Tests (Pre/Post/Delayed)
		function* createTestForm(
			formType: "pre_test" | "post_test" | "delayed_test",
			title: string,
		) {
			const existing = yield* db.select().from(forms).where(eq(forms.title, title)).limit(1);

			let formId: string;
			if (existing[0]) {
				formId = existing[0].id;
				yield* Effect.log(`  ${formType} form already exists`);
			} else {
				formId = randomString();
				yield* db.insert(forms).values({
					id: formId,
					title,
					description: `Reading comprehension ${formType.replace("_", "-")}. Passage: Tanaka's Daily Life (JLPT N5-N4 level). 20 MCQ questions based on Bloom's Taxonomy.`,
					type: formType,
					status: "published",
					createdBy: teacherId,
				});
				yield* Effect.log(`  Created ${formType} form`);
			}
			return formId;
		}

		const preTestFormId = yield* createTestForm("pre_test", "Reading Comprehension Pre-Test");
		const postTestFormId = yield* createTestForm(
			"post_test",
			"Reading Comprehension Post-Test",
		);
		const delayedTestFormId = yield* createTestForm(
			"delayed_test",
			"Reading Comprehension Delayed Test",
		);

		// Seed questions for each test form
		for (const formId of [preTestFormId, postTestFormId, delayedTestFormId]) {
			const existingQs = yield* db
				.select()
				.from(questions)
				.where(eq(questions.formId, formId));

			if (existingQs.length > 0) continue;

			yield* Effect.all(
				READING_COMPREHENSION_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId,
						type: "mcq",
						questionText: `[${q.bloomLevel}] ${q.questionText}`,
						options: JSON.stringify({
							type: "mcq",
							options: q.options,
							correctOptionIds: [q.correctOptionId],
							shuffle: false,
						}),
						orderIndex: idx,
						required: true,
					}),
				),
				{ concurrency: 10 },
			);
		}
		yield* Effect.log(
			`  Created ${READING_COMPREHENSION_QUESTIONS.length} questions per test form`,
		);

		return {
			tamFormId,
			feedbackFormId,
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
		};
	});
}
