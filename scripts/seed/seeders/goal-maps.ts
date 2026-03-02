import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	goalMaps,
	texts,
	topics,
} from "@/server/db/schema/app-schema";
import {
	GOAL_MAP_TO_MATERIAL,
	MATERIALS,
	TOPICS,
} from "../data/materials.js";

export function seedGoalMaps(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log(
			`Seeding ${TOPICS.length} topics with ${MATERIALS.length} goal maps...`,
		);

	const goalMapIdsByTitle: Record<string, string> = {};
		const goalMapDataByTitle: Record<
			string,
			{ nodes: unknown[]; edges: Array<{ id: string; source: string; target: string }>; }
		> = {};

		const topicResults = yield* Effect.all(
			TOPICS.map((topicData) =>
				Effect.gen(function* () {
					const existingTopic = yield* db
						.select()
						.from(topics)
						.where(eq(topics.title, topicData.title))
						.limit(1);

					let topicId: string;
					if (existingTopic[0]) {
						topicId = existingTopic[0].id;
						yield* db
							.update(topics)
							.set({ description: topicData.description })
							.where(eq(topics.id, topicId));
						yield* Effect.log(`Updated topic: ${topicData.title}`);
					} else {
						topicId = randomString();
						yield* db.insert(topics).values({
							id: topicId,
							title: topicData.title,
							description: topicData.description,
						});
						yield* Effect.log(`Created topic: ${topicData.title}`);
					}

					const goalMapResults = yield* Effect.all(
						topicData.goalMapTitles.map((mapTitle) =>
							Effect.gen(function* () {
								const material =
									GOAL_MAP_TO_MATERIAL[mapTitle];

								if (!material) {
									yield* Effect.log(
										`No material found for: ${mapTitle}`,
									);
									return null;
								}

								const existingText = yield* db
									.select()
									.from(texts)
									.where(eq(texts.title, material.title))
									.limit(1);

								let textId: string;
								if (existingText[0]) {
									textId = existingText[0].id;
									yield* db
										.update(texts)
										.set({ content: material.content })
										.where(eq(texts.id, textId));
								} else {
									textId = randomString();
									yield* db.insert(texts).values({
										id: textId,
										title: material.title,
										content: material.content,
									});
								}

								const existingGoalMap = yield* db
									.select()
									.from(goalMaps)
									.where(eq(goalMaps.title, material.title))
									.limit(1);

								let goalMapId: string;
								if (existingGoalMap[0]) {
									goalMapId = existingGoalMap[0].id;
									yield* db
										.update(goalMaps)
										.set({
											description: material.description,
											nodes: material.nodes,
											edges: material.edges,
										})
										.where(eq(goalMaps.id, goalMapId));
									yield* Effect.log(
										`  Updated goal map: ${material.title}`,
									);
								} else {
									goalMapId = randomString();
									yield* db.insert(goalMaps).values({
										id: goalMapId,
										teacherId: teacherId,
										title: material.title,
										description: material.description,
										nodes: material.nodes,
										edges: material.edges,
										topicId: topicId,
										textId: textId,
									});
									yield* Effect.log(
										`  Created goal map: ${material.title}`,
									);
								}

								return {
									title: material.title,
									goalMapId,
									material,
								};
							}),
						),
						{ concurrency: 10 },
					);

					return {
						topicId,
						goalMapResults,
					};
				}),
			),
			{ concurrency: 10 },
		);

		for (const topicResult of topicResults) {
			for (const result of topicResult.goalMapResults) {
				if (result) {
					goalMapIdsByTitle[result.title] = result.goalMapId;
					goalMapDataByTitle[result.title] = {
						nodes: result.material.nodes,
						edges: result.material.edges as Array<{ id: string; source: string; target: string }>,
					};
				}
			}
		}

		return { goalMapIdsByTitle, goalMapDataByTitle };
	});
}
