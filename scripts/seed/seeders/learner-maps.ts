import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { diagnoses, learnerMaps } from "@/server/db/schema/app-schema";
import { LEARNER_MAP_CONFIGS } from "../data/learner-maps.js";

export function seedLearnerMaps(
	userIdsByEmail: Record<string, string>,
	demoAssignmentId: string,
	dailyLifeGoalMapId: string,
	demoKitId: string,
	dailyLifeData: { nodes: unknown[]; edges: Array<{ id: string; source: string; target: string }> },
	oneWeekAgo: Date,
) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("Creating learner maps and diagnoses...");

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

		const submissionDate = new Date(
			oneWeekAgo.getTime() - 3 * 60 * 60 * 1000,
		);

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

					const correctCount = config.correctEdgeIds.length;
					const totalGoalEdges = 15;
					const score =
						Math.round((correctCount / totalGoalEdges) * 100) / 100;

					const perLink = {
						correct: config.correctEdgeIds.map((edgeId) => {
							const edge = edgeById[edgeId];
							return {
								source: edge?.source,
								target: edge?.target,
								edgeId,
							};
						}),
						missing: goalEdges
							.filter((e) => !config.correctEdgeIds.includes(e.id))
							.map((e) => ({
								source: e.source,
								target: e.target,
								edgeId: e.id,
							})),
						excessive: config.excessiveEdges.map((e, i) => ({
							source: e.source,
							target: e.target,
							edgeId: `excess-${i + 1}`,
						})),
					};

					yield* db.insert(diagnoses).values({
						id: randomString(),
						goalMapId: dailyLifeGoalMapId,
						learnerMapId: learnerMapId,
						summary: `Score: ${Math.round(score * 100)}% (${correctCount}/${totalGoalEdges} correct edges)`,
						perLink: perLink,
						score: score,
						rubricVersion: "v1.0",
					});
					yield* Effect.log(
						`  Created diagnosis for ${config.studentEmail}: ${Math.round(score * 100)}%`,
					);
				}),
			),
			{ concurrency: 10 },
		);
	});
}
