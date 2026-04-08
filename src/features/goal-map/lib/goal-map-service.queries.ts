import { desc, eq, isNull } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { safeParseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { goalMaps, kits, texts } from "@/server/db/schema/app-schema";

import {
	EdgeSchema,
	GetGoalMapInput,
	ListGoalMapsByTopicInput,
	NodeSchema,
} from "./goal-map-service.shared";

export const getGoalMap = Effect.fn("getGoalMap")(function* (input: GetGoalMapInput) {
	const db = yield* Database;
	const rows = yield* db
		.select({
			id: goalMaps.id,
			title: goalMaps.title,
			description: goalMaps.description,
			nodes: goalMaps.nodes,
			edges: goalMaps.edges,
			teacherId: goalMaps.teacherId,
			topicId: goalMaps.topicId,
			textId: goalMaps.textId,
			kitId: kits.id,
			materialText: texts.content,
			materialImages: texts.images,
		})
		.from(goalMaps)
		.leftJoin(kits, eq(kits.goalMapId, goalMaps.id))
		.leftJoin(texts, eq(goalMaps.textId, texts.id))
		.where(eq(goalMaps.id, input.goalMapId))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	const [nodes, edges, materialImages] = yield* Effect.all(
		[
			safeParseJson(row.nodes, [], Schema.Array(NodeSchema)),
			safeParseJson(row.edges, [], Schema.Array(EdgeSchema)),
			row.materialImages
				? safeParseJson(row.materialImages, [], Schema.Array(Schema.String))
				: Effect.succeed([]),
		],
		{ concurrency: "unbounded" },
	);

	return {
		id: row.id,
		title: row.title,
		description: row.description,
		nodes,
		edges,
		teacherId: row.teacherId,
		topicId: row.topicId,
		materialText: row.materialText,
		materialImages,
		kitExists: row.kitId !== null,
	};
});

export const listGoalMaps = Effect.fn("listGoalMaps")(function* (userId: string) {
	const db = yield* Database;
	const rows = yield* db
		.select({
			id: goalMaps.id,
			title: goalMaps.title,
			description: goalMaps.description,
			teacherId: goalMaps.teacherId,
			topicId: goalMaps.topicId,
			nodes: goalMaps.nodes,
			edges: goalMaps.edges,
			createdAt: goalMaps.createdAt,
			updatedAt: goalMaps.updatedAt,
		})
		.from(goalMaps)
		.where(eq(goalMaps.teacherId, userId))
		.orderBy(desc(goalMaps.updatedAt));

	return yield* Effect.all(
		rows.map((row) =>
			Effect.gen(function* () {
				const [nodes, edges] = yield* Effect.all(
					[
						safeParseJson(row.nodes, [], Schema.Array(NodeSchema)),
						safeParseJson(row.edges, [], Schema.Array(EdgeSchema)),
					],
					{ concurrency: "unbounded" },
				);

				return {
					...row,
					nodes,
					edges,
					createdAt: row.createdAt?.getTime(),
					updatedAt: row.updatedAt?.getTime(),
				};
			}),
		),
	);
});

export const listGoalMapsByTopic = Effect.fn("listGoalMapsByTopic")(function* (
	input: ListGoalMapsByTopicInput,
) {
	const db = yield* Database;
	const query = db
		.select({
			id: goalMaps.id,
			title: goalMaps.title,
			description: goalMaps.description,
			teacherId: goalMaps.teacherId,
			topicId: goalMaps.topicId,
			createdAt: goalMaps.createdAt,
			updatedAt: goalMaps.updatedAt,
			nodes: goalMaps.nodes,
			edges: goalMaps.edges,
			kitId: kits.id,
		})
		.from(goalMaps)
		.leftJoin(kits, eq(kits.goalMapId, goalMaps.id));

	if (input.topicId) {
		query.where(eq(goalMaps.topicId, input.topicId));
	} else {
		query.where(isNull(goalMaps.topicId));
	}

	const rows = yield* query.orderBy(desc(goalMaps.updatedAt));

	return yield* Effect.all(
		rows.map((row) =>
			Effect.gen(function* () {
				const [nodes, edges] = yield* Effect.all(
					[
						safeParseJson(row.nodes, [], Schema.Array(NodeSchema)),
						safeParseJson(row.edges, [], Schema.Array(EdgeSchema)),
					],
					{ concurrency: "unbounded" },
				);

				return {
					...row,
					nodes,
					edges,
					createdAt: row.createdAt?.getTime(),
					updatedAt: row.updatedAt?.getTime(),
				};
			}),
		),
	);
});
