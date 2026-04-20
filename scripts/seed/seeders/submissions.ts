import { asc, eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { diagnoses, formProgress, formResponses, learnerMaps, questions } from "@/server/db/schema/app-schema";

import {
	WHITELIST_FLOW_ACCOUNTS,
	WHITELIST_FLOW_DELAYEDTEST_SCORES,
	WHITELIST_FLOW_LEARNER_MAP_CONFIGS,
	WHITELIST_FLOW_POSTTEST_SCORES,
	WHITELIST_FLOW_PRETEST_SCORES,
} from "../data/whitelist-flow.js";

type QuestionRow = {
	id: string;
	options: string | null;
};

type ParsedQuestionOptions =
	| Array<{ id: string }>
	| {
		options?: Array<{ id: string }>;
		correctOptionIds?: string[];
	};

type DailyLifeData = {
	nodes: unknown[];
	edges: Array<{ id: string; source: string; target: string }>;
};

type ScoresByEmail = Record<string, number[]>;
type UserIdsByEmail = Record<string, string>;
type LearnerMapConfig = (typeof WHITELIST_FLOW_LEARNER_MAP_CONFIGS)[number];

function pickOptionId(questionRow: QuestionRow, correct: boolean): string | null {
	if (!questionRow.options) return null;
	const parsed = JSON.parse(questionRow.options) as ParsedQuestionOptions;
	const options = Array.isArray(parsed) ? parsed : parsed.options ?? [];
	const correctOptionIds = Array.isArray(parsed) ? [] : parsed.correctOptionIds ?? [];
	if (options.length === 0) return null;
	if (correct) return correctOptionIds[0] ?? options[0]?.id ?? null;
	return options.find((option) => !correctOptionIds.includes(option.id))?.id ?? options[0]?.id ?? null;
}

function buildAnswers(questionRows: QuestionRow[], scores: number[]): Record<string, string> {
	const answers: Record<string, string> = {};
	for (let index = 0; index < questionRows.length; index++) {
		const question = questionRows[index];
		if (!question) continue;
		const selected = pickOptionId(question, scores[index] === 1);
		if (selected) answers[question.id] = selected;
	}
	return answers;
}

function seedFormResponsesForForm(
	formId: string,
	scoresByEmail: ScoresByEmail,
	userIdsByEmail: UserIdsByEmail,
	submittedAt: Date,
) {
	return Effect.gen(function* () {
		const db = yield* Database;
		const questionRows = (yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, formId))
			.orderBy(asc(questions.orderIndex))) as QuestionRow[];
		const existingResponses = yield* db.select().from(formResponses).where(eq(formResponses.formId, formId));
		const existingProgress = yield* db.select().from(formProgress).where(eq(formProgress.formId, formId));
		const existingUserIds = new Set(existingResponses.map((r) => r.userId));
		const existingProgressIds = new Set(existingProgress.map((p) => p.userId));

		for (const student of WHITELIST_FLOW_ACCOUNTS) {
			const userId = userIdsByEmail[student.email];
			if (!userId) continue;
			if (existingUserIds.has(userId)) continue;

			const scores = scoresByEmail[student.email];
			if (!scores) continue;

			yield* db.insert(formResponses).values({
				id: randomString(),
				formId,
				userId,
				answers: JSON.stringify(buildAnswers(questionRows, scores)),
				submittedAt,
				timeSpentSeconds: 480,
			});

			if (!existingProgressIds.has(userId)) {
				yield* db.insert(formProgress).values({
					id: randomString(),
					formId,
					userId,
					status: "completed",
					completedAt: submittedAt,
				});
			}
		}
	});
}

function seedLearnerMapSubmissions(
	userIdsByEmail: UserIdsByEmail,
	demoAssignmentId: string,
	dailyLifeGoalMapId: string,
	demoKitId: string,
	dailyLifeData: DailyLifeData,
	submittedAt: Date,
) {
	return Effect.gen(function* () {
		const db = yield* Database;
		const edgeById: Record<string, { source: string; target: string }> = {};
		for (const edge of dailyLifeData.edges) edgeById[edge.id] = { source: edge.source, target: edge.target };

		const existingLearnerMaps = yield* db.select().from(learnerMaps).where(eq(learnerMaps.assignmentId, demoAssignmentId));
		const existingKeys = new Set(existingLearnerMaps.map((row) => row.userId + ":" + row.attempt));

		for (const config of WHITELIST_FLOW_LEARNER_MAP_CONFIGS as readonly LearnerMapConfig[]) {
			const userId = userIdsByEmail[config.studentEmail];
			if (!userId) continue;
			const key = userId + ":" + config.attempt;
			if (existingKeys.has(key)) continue;

			const learnerEdges = [
				...config.correctEdgeIds
					.map((edgeId) => edgeById[edgeId])
					.filter((edge): edge is { source: string; target: string } => Boolean(edge))
					.map((edge, index) => ({ id: "correct-" + String(index + 1), source: edge.source, target: edge.target })),
				...config.excessiveEdges.map((edge, index) => ({ id: "excess-" + String(index + 1), source: edge.source, target: edge.target })),
			];

			const learnerMapId = randomString();
			yield* db.insert(learnerMaps).values({
				id: learnerMapId,
				assignmentId: demoAssignmentId,
				goalMapId: dailyLifeGoalMapId,
				kitId: demoKitId,
				userId,
				nodes: JSON.stringify(dailyLifeData.nodes),
				edges: JSON.stringify(learnerEdges),
				status: "submitted",
				attempt: config.attempt,
				submittedAt,
			});

			yield* db.insert(diagnoses).values({
				id: randomString(),
				goalMapId: dailyLifeGoalMapId,
				learnerMapId,
				summary: "Score: " + String(Math.round(config.expectedScore * 100)) + "% (" + String(config.correctEdgeIds.length) + "/15 correct edges)",
				perLink: {
					correct: config.correctEdgeIds.map((edgeId) => ({ edgeId, ...edgeById[edgeId] })),
					missing: dailyLifeData.edges.filter((edge) => !config.correctEdgeIds.includes(edge.id)).map((edge) => ({ edgeId: edge.id, source: edge.source, target: edge.target })),
					excessive: config.excessiveEdges.map((edge, index) => ({ edgeId: "excess-" + String(index + 1), source: edge.source, target: edge.target })),
				},
				score: config.expectedScore,
				rubricVersion: "v1.0",
			});
		}
	});
}

export function seedSubmissions(
	userIdsByEmail: UserIdsByEmail,
	demoAssignmentId: string,
	dailyLifeGoalMapId: string,
	demoKitId: string,
	dailyLifeData: DailyLifeData,
	formIds: { preTestFormId: string; postTestFormId: string; delayedTestFormId: string },
) {
	return Effect.gen(function* () {
		const preTestDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
		const postTestDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
		const delayedTestDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
		const learnerMapDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000);

		yield* Effect.log("--- Seeding whitelist app-flow submissions ---");
		yield* seedFormResponsesForForm(formIds.preTestFormId, WHITELIST_FLOW_PRETEST_SCORES, userIdsByEmail, preTestDate);
		yield* seedLearnerMapSubmissions(userIdsByEmail, demoAssignmentId, dailyLifeGoalMapId, demoKitId, dailyLifeData, learnerMapDate);
		yield* seedFormResponsesForForm(formIds.postTestFormId, WHITELIST_FLOW_POSTTEST_SCORES, userIdsByEmail, postTestDate);
		yield* seedFormResponsesForForm(formIds.delayedTestFormId, WHITELIST_FLOW_DELAYEDTEST_SCORES, userIdsByEmail, delayedTestDate);
	});
}
