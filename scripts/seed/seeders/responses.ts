import { asc, eq, and } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { formProgress, formResponses, questions } from "@/server/db/schema/app-schema";

import { READING_COMPREHENSION_QUESTIONS } from "../data/questions.js";
import {
	DEMO_DELAYEDTEST_SCORES,
	DEMO_FEEDBACK_RESPONSES,
	DEMO_POSTTEST_SCORES,
	DEMO_PRETEST_SCORES,
	DEMO_TAM_RESPONSES,
} from "../data/responses.js";
import { DEMO_STUDENTS } from "../data/users.js";

export function seedResponses(
	userIdsByEmail: Record<string, string>,
	tamFormId: string,
	feedbackFormId: string,
	preTestFormId: string,
	postTestFormId: string,
	delayedTestFormId: string,
	dates: { oneWeekAgo: Date; twoWeeksAgo: Date },
) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("Seeding form responses and progress...");

		const allFormIds = [
			preTestFormId,
			postTestFormId,
			delayedTestFormId,
			tamFormId,
			feedbackFormId,
		];

		const preTestDate = new Date(dates.twoWeeksAgo.getTime() - 2 * 24 * 60 * 60 * 1000);
		const postTestDate = new Date(dates.oneWeekAgo.getTime() - 4 * 60 * 60 * 1000);
		const tamDate = new Date(dates.oneWeekAgo.getTime() - 2 * 60 * 60 * 1000);
		const feedbackDate = new Date(dates.oneWeekAgo.getTime() - 1 * 60 * 60 * 1000);
		const delayedTestDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

		const formDates: Record<string, Date> = {
			[preTestFormId]: preTestDate,
			[postTestFormId]: postTestDate,
			[tamFormId]: tamDate,
			[feedbackFormId]: feedbackDate,
			[delayedTestFormId]: delayedTestDate,
		};

		yield* Effect.all(
			DEMO_STUDENTS.flatMap((student) =>
				allFormIds.map((formId) =>
					Effect.gen(function* () {
						const studentId = userIdsByEmail[student.email];
						if (!studentId) return;

						const existingProgress = yield* db
							.select()
							.from(formProgress)
							.where(
								and(
									eq(formProgress.formId, formId),
									eq(formProgress.userId, studentId),
								),
							)
							.limit(1);

						if (existingProgress.length === 0) {
							yield* db.insert(formProgress).values({
								id: randomString(),
								formId,
								userId: studentId,
								status: "completed",
								completedAt: formDates[formId] || new Date(),
							});
						}
					}),
				),
			),
			{ concurrency: 10 },
		);

		const existingTamResponses = yield* db
			.select()
			.from(formResponses)
			.where(eq(formResponses.formId, tamFormId));

		const existingTamUserIds = new Set(existingTamResponses.map((r) => r.userId));

		yield* Effect.all(
			DEMO_STUDENTS.map((student) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[student.email];
					if (!studentId) return;
					if (existingTamUserIds.has(studentId)) {
						yield* Effect.log(`  TAM response for ${student.email} already exists`);
						return;
					}

					const responses = DEMO_TAM_RESPONSES[student.email];
					if (!responses) return;

					const tamQuestions = yield* db
						.select()
						.from(questions)
						.where(eq(questions.formId, tamFormId))
						.orderBy(asc(questions.orderIndex));

					const answers: Record<string, string> = {};
					for (let i = 0; i < tamQuestions.length; i++) {
						if (responses[i] !== undefined) {
							answers[tamQuestions[i].id] = String(responses[i]);
						}
					}

					yield* db.insert(formResponses).values({
						id: randomString(),
						formId: tamFormId,
						userId: studentId,
						answers: JSON.stringify(answers),
						submittedAt: tamDate,
						timeSpentSeconds: 180,
					});
					yield* Effect.log(`  Created TAM response for ${student.email}`);
				}),
			),
			{ concurrency: 10 },
		);

		const existingFeedbackResponses = yield* db
			.select()
			.from(formResponses)
			.where(eq(formResponses.formId, feedbackFormId));

		const existingFeedbackUserIds = new Set(existingFeedbackResponses.map((r) => r.userId));

		yield* Effect.all(
			DEMO_STUDENTS.map((student) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[student.email];
					if (!studentId) return;
					if (existingFeedbackUserIds.has(studentId)) {
						yield* Effect.log(
							`  Feedback response for ${student.email} already exists`,
						);
						return;
					}

					const responses = DEMO_FEEDBACK_RESPONSES[student.email];
					if (!responses) return;

					const feedbackQuestions = yield* db
						.select()
						.from(questions)
						.where(eq(questions.formId, feedbackFormId))
						.orderBy(asc(questions.orderIndex));

					const answers: Record<string, string> = {};
					for (let i = 0; i < feedbackQuestions.length; i++) {
						if (responses[i]) {
							answers[feedbackQuestions[i].id] = responses[i];
						}
					}

					yield* db.insert(formResponses).values({
						id: randomString(),
						formId: feedbackFormId,
						userId: studentId,
						answers: JSON.stringify(answers),
						submittedAt: feedbackDate,
						timeSpentSeconds: 300,
					});
					yield* Effect.log(`  Created feedback response for ${student.email}`);
				}),
			),
			{ concurrency: 10 },
		);

		yield* Effect.log("Seeding reading comprehension test responses...");

		function seedTestResponses(
			formId: string,
			formName: string,
			scoreData: Record<string, number[]>,
			baseDate: Date,
		) {
			return Effect.gen(function* () {
				const existingResponses = yield* db
					.select()
					.from(formResponses)
					.where(eq(formResponses.formId, formId));

				const existingUserIds = new Set(existingResponses.map((r) => r.userId));

				const testQuestions = yield* db
					.select()
					.from(questions)
					.where(eq(questions.formId, formId))
					.orderBy(asc(questions.orderIndex));

				yield* Effect.all(
					DEMO_STUDENTS.map((student) =>
						Effect.gen(function* () {
							const studentId = userIdsByEmail[student.email];
							if (!studentId) return;
							if (existingUserIds.has(studentId)) {
								yield* Effect.log(
									`  ${formName} response for ${student.email} already exists`,
								);
								return;
							}

							const scores = scoreData[student.email];
							if (!scores) return;

							const answers: Record<string, string> = {};
							for (let i = 0; i < testQuestions.length; i++) {
								const q = READING_COMPREHENSION_QUESTIONS[i];
								if (!q) continue; // Safety check
								let selectedOptionId: string;
								if (scores[i] === 1) {
									selectedOptionId = q.correctOptionId;
								} else {
									const wrongOptionIds = q.options
										.filter((opt) => opt.id !== q.correctOptionId)
										.map((opt) => opt.id);
									selectedOptionId =
										wrongOptionIds[
											Math.floor(Math.random() * wrongOptionIds.length)
										] || q.options[0].id;
								}
								// USE QUESTION ID AS KEY, OPTION ID AS VALUE
								answers[testQuestions[i].id] = selectedOptionId;
							}

							const submissionDate = new Date(
								baseDate.getTime() - Math.random() * 30 * 60 * 1000,
							);

							yield* db.insert(formResponses).values({
								id: randomString(),
								formId: formId,
								userId: studentId,
								answers: JSON.stringify(answers),
								submittedAt: submissionDate,
								timeSpentSeconds: 600 + Math.floor(Math.random() * 300),
							});
							yield* Effect.log(
								`  Created ${formName} response for ${student.email}`,
							);
						}),
					),
					{ concurrency: 10 },
				);
			});
		}

		yield* seedTestResponses(preTestFormId, "Pre-Test", DEMO_PRETEST_SCORES, preTestDate).pipe(
			Effect.tapError((e) => Effect.logError("Failed to seed pre-test responses:", e)),
			Effect.catchAll(() => Effect.void),
		);

		yield* seedTestResponses(
			postTestFormId,
			"Post-Test",
			DEMO_POSTTEST_SCORES,
			postTestDate,
		).pipe(
			Effect.tapError((e) => Effect.logError("Failed to seed post-test responses:", e)),
			Effect.catchAll(() => Effect.void),
		);

		yield* seedTestResponses(
			delayedTestFormId,
			"Delayed Test",
			DEMO_DELAYEDTEST_SCORES,
			delayedTestDate,
		).pipe(
			Effect.tapError((e) => Effect.logError("Failed to seed delayed-test responses:", e)),
			Effect.catchAll(() => Effect.void),
		);
	});
}
