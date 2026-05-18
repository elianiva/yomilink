import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { compareMaps, type Edge, type Node } from "@/features/learner-map/lib/comparator";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { diagnoses, learnerMaps } from "@/server/db/schema/app-schema";

import { LEARNER_MAP_CONFIGS } from "../data/learner-maps.js";
import { DEMO_SUMMARIES } from "../data/summaries.js";

export function seedLearnerMaps(
	userIdsByEmail: Record<string, string>,
	demoAssignmentId: string,
	dailyLifeGoalMapId: string,
	demoKitId: string,
	dailyLifeData: {
		nodes: unknown[];
		edges: Array<{ id: string; source: string; target: string }>;
	},
	oneWeekAgo: Date,
	studentConditionMap: Record<string, "concept_map" | "summarizing">,
) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("Creating learner maps, summaries, and diagnoses...");

		const goalEdges = dailyLifeData.edges;
		const edgeById: Record<string, { source: string; target: string }> = {};
		for (const edge of goalEdges) {
			edgeById[edge.id] = { source: edge.source, target: edge.target };
		}

		const existingLearnerMaps = yield* db
			.select()
			.from(learnerMaps)
			.where(eq(learnerMaps.assignmentId, demoAssignmentId));

		const existingMapKeySet = new Set(
			existingLearnerMaps.map((lm) => `${lm.userId}:${lm.attempt}`),
		);

		const submissionDate = new Date(oneWeekAgo.getTime() - 3 * 60 * 60 * 1000);

		yield* Effect.all(
			LEARNER_MAP_CONFIGS.map((config) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[config.studentEmail];
					if (!studentId) {
						yield* Effect.log(
							`  Student ${config.studentEmail} not found, skipping...`,
						);
						return;
					}

					const mapKey = `${studentId}:${config.attempt}`;
					if (existingMapKeySet.has(mapKey)) {
						yield* Effect.log(
							`  Learner map for ${config.studentEmail} attempt ${config.attempt} already exists`,
						);
						return;
					}

					const condition = studentConditionMap[config.studentEmail] || "concept_map";

					if (condition === "summarizing") {
						const summaryText = DEMO_SUMMARIES[config.studentEmail];
						if (!summaryText || config.attempt > 1) return;

						const learnerMapId = randomString();
						yield* db.insert(learnerMaps).values({
							id: learnerMapId,
							assignmentId: demoAssignmentId,
							goalMapId: dailyLifeGoalMapId,
							kitId: demoKitId,
							userId: studentId,
							controlText: summaryText,
							nodes: null,
							edges: null,
							status: "submitted",
							attempt: config.attempt,
							submittedAt: submissionDate,
						});
						yield* Effect.log(`  Created summary for ${config.studentEmail}`);
						return;
					}

					const learnerEdges: Array<{
						id: string;
						source: string;
						target: string;
					}> = [];

					for (const edgeId of config.correctEdgeIds) {
						const edge = edgeById[edgeId];
						if (edge) {
							learnerEdges.push({
								id: edgeId,
								source: edge.source,
								target: edge.target,
							});
						}
					}

					for (let i = 0; i < config.excessiveEdges.length; i++) {
						const excessive = config.excessiveEdges[i];
						learnerEdges.push({
							id: `excess-${i + 1}`,
							source: excessive.source,
							target: excessive.target,
						});
					}

					const learnerMapId = randomString();
					yield* db.insert(learnerMaps).values({
						id: learnerMapId,
						assignmentId: demoAssignmentId,
						goalMapId: dailyLifeGoalMapId,
						kitId: demoKitId,
						userId: studentId,
						nodes: JSON.stringify(dailyLifeData.nodes),
						edges: JSON.stringify(learnerEdges),
						status: "submitted",
						attempt: config.attempt,
						submittedAt: submissionDate,
					});
					yield* Effect.log(
						`  Created learner map for ${config.studentEmail} (attempt ${config.attempt})`,
					);

					const learnerEdgesForCompare: Edge[] = [
						...config.correctEdgeIds
							.map((edgeId) => {
								const edge = edgeById[edgeId];
								return edge
									? { id: edgeId, source: edge.source, target: edge.target }
									: null;
							})
							.filter((e): e is Edge => e !== null),
						...config.excessiveEdges.map((e, i) => ({
							id: `excess-${i + 1}`,
							source: e.source,
							target: e.target,
						})),
					];

					const goalNodes = dailyLifeData.nodes as unknown as Node[];
					const goalEdgesTyped = dailyLifeData.edges as unknown as Edge[];

					const diagnosisResult = compareMaps(
						goalNodes,
						goalEdgesTyped,
						goalNodes,
						learnerEdgesForCompare,
					);

					const perLink = {
						correct: diagnosisResult.correct,
						missing: diagnosisResult.missing,
						excessive: diagnosisResult.excessive,
					};

					yield* db.insert(diagnoses).values({
						id: randomString(),
						goalMapId: dailyLifeGoalMapId,
						learnerMapId: learnerMapId,
						summary: `Score: ${Math.round(diagnosisResult.score * 100)}% (${diagnosisResult.correct.length}/${diagnosisResult.totalGoalPropositions} correct propositions)`,
						perLink: perLink,
						score: diagnosisResult.score,
						rubricVersion: "v1.0",
					});
					yield* Effect.log(
						`  Created diagnosis for ${config.studentEmail}: ${Math.round(diagnosisResult.score * 100)}%`,
					);
				}),
			),
			{ concurrency: 10 },
		);
	});
}
