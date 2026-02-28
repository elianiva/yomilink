import { desc, eq, isNull } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { validateNodes } from "@/features/goal-map/lib/validator";
import { requireGoalMapOwner } from "@/lib/auth-authorization";
import { safeParseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { goalMaps, kits, texts } from "@/server/db/schema/app-schema";
/** Constant for new goal map identifier */
export const NEW_GOAL_MAP_ID = "new";
/** Position schema for node positioning */
const PositionSchema = Schema.Struct({
	x: Schema.Number,
	y: Schema.Number,
});

/** Node data schema for goal map nodes */
const NodeDataSchema = Schema.Struct({
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	propositionType: Schema.optionalWith(Schema.String, { nullable: true }),
	description: Schema.optionalWith(Schema.String, { nullable: true }),
	examples: Schema.optionalWith(Schema.Array(Schema.String), {
		nullable: true,
	}),
});

/** Edge data schema for goal map edges */
const EdgeDataSchema = Schema.Struct({
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	relationshipType: Schema.optionalWith(Schema.String, { nullable: true }),
});

/** Node schema for ReactFlow nodes */
export const NodeSchema = Schema.Struct({
	id: Schema.String,
	type: Schema.optionalWith(Schema.String, { nullable: true }),
	position: PositionSchema,
	data: NodeDataSchema,
	width: Schema.optionalWith(Schema.Number, { nullable: true }),
	height: Schema.optionalWith(Schema.Number, { nullable: true }),
});

/** Edge schema for ReactFlow edges */
export const EdgeSchema = Schema.Struct({
	id: Schema.String,
	source: Schema.String,
	target: Schema.String,
	type: Schema.optionalWith(Schema.String, { nullable: true }),
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	data: Schema.optionalWith(EdgeDataSchema, { nullable: true }),
});
export const GetGoalMapInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});
export type GetGoalMapInput = typeof GetGoalMapInput.Type;

export const SaveGoalMapInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, {
		nullable: true,
	}),
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), {
		nullable: true,
	}),
});

export type SaveGoalMapInput = typeof SaveGoalMapInput.Type;

export const ListGoalMapsByTopicInput = Schema.Struct({
	topicId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export type ListGoalMapsByTopicInput = typeof ListGoalMapsByTopicInput.Type;

export const DeleteGoalMapInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});

export type DeleteGoalMapInput = typeof DeleteGoalMapInput.Type;

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

	const nodes = Array.isArray(row.nodes) ? row.nodes : [];
	const edges = Array.isArray(row.edges) ? row.edges : [];
	const materialImages = row.materialImages
		? yield* safeParseJson(row.materialImages as string, [], Schema.Array(Schema.String))
		: [];

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

export const saveGoalMap = Effect.fn("saveGoalMap")(function* (
	userId: string,
	data: SaveGoalMapInput,
) {
	const db = yield* Database;

	if (data.goalMapId !== NEW_GOAL_MAP_ID) {
		yield* requireGoalMapOwner(userId, data.goalMapId);
	}

	const validationResult = validateNodes(data.nodes, data.edges);

	if (!validationResult.isValid) {
		return {
			success: false,
			errors: validationResult.errors,
			warnings: validationResult.warnings,
		} as const;
	}

	let textId: string | null = null;
	const hasMaterial =
		data.materialText?.trim() || (data.materialImages && data.materialImages.length > 0);

	if (hasMaterial) {
		const existingRows = yield* db
			.select({ textId: goalMaps.textId })
			.from(goalMaps)
			.where(eq(goalMaps.id, data.goalMapId))
			.limit(1);

		const existing = existingRows[0];
		if (existing?.textId) {
			textId = existing.textId;
			yield* db
				.update(texts)
				.set({
					content: data.materialText || "",
					images:
						data.materialImages && data.materialImages.length > 0
							? JSON.stringify(data.materialImages)
							: null,
					updatedAt: new Date(),
				})
				.where(eq(texts.id, textId as string));
		} else {
			textId = crypto.randomUUID();
			yield* db.insert(texts).values({
				id: textId as string,
				title: `Material for ${data.title}`,
				content: data.materialText || "",
				images:
					data.materialImages && data.materialImages.length > 0
						? JSON.stringify(data.materialImages)
						: null,
			});
		}
	}

	const payload = {
		id: data.goalMapId,
		goalMapId: data.goalMapId,
		title: data.title,
		description: data.description ?? null,
		nodes: JSON.stringify(data.nodes ?? []),
		edges: JSON.stringify(data.edges ?? []),
		updatedAt: new Date(),
		teacherId: userId,
		topicId: data.topicId ?? null,
		textId,
	};

	yield* db
		.insert(goalMaps)
		.values(payload)
		.onConflictDoUpdate({
			where: eq(goalMaps.id, data.goalMapId),
			target: goalMaps.id,
			set: payload,
		});

	return {
		success: true,
		errors: validationResult.errors,
		warnings: validationResult.warnings,
		propositions: validationResult.propositions,
	} as const;
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

	return rows.map((row) => {
		const nodes = Array.isArray(row.nodes) ? row.nodes : [];
		const edges = Array.isArray(row.edges) ? row.edges : [];

		return {
			...row,
			nodes,
			edges,
			createdAt: row.createdAt?.getTime(),
			updatedAt: row.updatedAt?.getTime(),
		};
	});
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

	return rows.map((row) => {
		const nodes = Array.isArray(row.nodes) ? row.nodes : [];
		const edges = Array.isArray(row.edges) ? row.edges : [];

		return {
			...row,
			nodes,
			edges,
			createdAt: row.createdAt?.getTime(),
			updatedAt: row.updatedAt?.getTime(),
		};
	});
});

export const deleteGoalMap = Effect.fn("deleteGoalMap")(function* (
	userId: string,
	input: DeleteGoalMapInput,
) {
	const db = yield* Database;
	yield* requireGoalMapOwner(userId, input.goalMapId);
	yield* db.delete(goalMaps).where(eq(goalMaps.id, input.goalMapId));
	return { success: true } as const;
});
