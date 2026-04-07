import { desc, eq, isNull } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { validateNodes } from "@/features/goal-map/lib/validator";
import { safeParseJson } from "@/lib/utils";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import { goalMaps, kits, texts } from "@/server/db/schema/app-schema";

export const SaveGoalMapOutput = Schema.Struct({
	errors: Schema.Array(Schema.String),
	warnings: Schema.Array(Schema.String),
	propositions: Schema.Array(Schema.String),
	published: Schema.Boolean,
});

export type SaveGoalMapOutput = typeof SaveGoalMapOutput.Type;
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

class GoalMapValidationError extends Data.TaggedError("GoalMapValidationError")<{
	errors: string[];
	warnings: string[];
}> {}

export class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export class GoalMapAccessDeniedError extends Data.TaggedError("GoalMapAccessDeniedError")<{
	readonly goalMapId: string;
	readonly userId: string;
}> {}

export const GetGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
});
export type GetGoalMapInput = typeof GetGoalMapInput.Type;

export const SaveGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
	topicId: Schema.optionalWith(NonEmpty("Topic ID"), { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), {
		nullable: true,
	}),
	/** When true, also regenerate the kit for this goal map */
	publish: Schema.optionalWith(Schema.Boolean, { default: () => false }),
});

export type SaveGoalMapInput = typeof SaveGoalMapInput.Type;

/** GoalMap type returned by listGoalMaps */
export type GoalMap = {
	id: string;
	title: string;
	description: string | null;
	teacherId: string;
	topicId: string | null;
	kitId?: string | null;
	nodes: readonly Schema.Schema.Type<typeof NodeSchema>[];
	edges: readonly Schema.Schema.Type<typeof EdgeSchema>[];
	createdAt: number | undefined;
	updatedAt: number | undefined;
};

export const ListGoalMapsByTopicInput = Schema.Struct({
	topicId: Schema.optionalWith(NonEmpty("Topic ID"), { nullable: true }),
});

export type ListGoalMapsByTopicInput = typeof ListGoalMapsByTopicInput.Type;

export const DeleteGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
});

export type DeleteGoalMapInput = typeof DeleteGoalMapInput.Type;

export const UpdateMaterialInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), { nullable: true }),
});

export type UpdateMaterialInput = typeof UpdateMaterialInput.Type;

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

export const saveGoalMap = Effect.fn("saveGoalMap")(function* (
	userId: string,
	data: SaveGoalMapInput,
) {
	const db = yield* Database;

	// Authorization check for EXISTING maps - skip if map does not exist (upsert)
	if (data.goalMapId !== NEW_GOAL_MAP_ID) {
		const goalMap = yield* Effect.tryPromise(() =>
			db
				.select({ teacherId: goalMaps.teacherId })
				.from(goalMaps)
				.where(eq(goalMaps.id, data.goalMapId))
				.get(),
		);
		// Only enforce ownership if map exists; allow creating with specific ID
		// Also skip auth if teacherId is null (incomplete/orphaned record)
		if (goalMap && goalMap.teacherId && goalMap.teacherId !== userId) {
			return yield* new GoalMapAccessDeniedError({
				goalMapId: data.goalMapId,
				userId,
			});
		}
	}

	const validationResult = validateNodes(data.nodes, data.edges);

	if (!validationResult.isValid) {
		return yield* new GoalMapValidationError({
			errors: validationResult.errors,
			warnings: validationResult.warnings,
		});
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

	// Auto-regenerate kit if publish flag is set or kit already exists
	if (data.publish || data.goalMapId !== NEW_GOAL_MAP_ID) {
		const kitRows = yield* db
			.select({ id: kits.id, layout: kits.layout })
			.from(kits)
			.where(eq(kits.goalMapId, data.goalMapId))
			.limit(1);

		if (data.publish || kitRows[0]) {
			// Always use "preset" layout for now; could be configurable
			const layout = kitRows[0]?.layout ?? "preset";

			const kitNodes = data.nodes.filter(
				(n) => n?.type === "text" || n?.type === "connector",
			);

			const kitPayload = {
				id: data.goalMapId,
				kitId: data.goalMapId,
				name: data.title,
				goalMapId: data.goalMapId,
				teacherId: userId,
				layout,
				nodes: JSON.stringify(kitNodes),
				edges: JSON.stringify([]),
				textId,
			};

			if (kitRows[0]) {
				yield* db
					.update(kits)
					.set({
						name: kitPayload.name,
						layout: kitPayload.layout,
						nodes: kitPayload.nodes,
						edges: kitPayload.edges,
						textId: kitPayload.textId,
					})
					.where(eq(kits.goalMapId, data.goalMapId));
			} else if (data.publish) {
				yield* db.insert(kits).values(kitPayload);
			}
		}
	}

	return {
		errors: validationResult.errors,
		warnings: validationResult.warnings,
		propositions: validationResult.propositions,
		published: data.publish || false,
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

export const deleteGoalMap = Effect.fn("deleteGoalMap")(function* (
	userId: string,
	input: DeleteGoalMapInput,
) {
	const db = yield* Database;

	// Authorization check INSIDE the service
	const goalMap = yield* Effect.tryPromise(() =>
		db
			.select({ teacherId: goalMaps.teacherId })
			.from(goalMaps)
			.where(eq(goalMaps.id, input.goalMapId))
			.get(),
	);

	if (!goalMap) {
		return yield* new GoalMapNotFoundError({ goalMapId: input.goalMapId });
	}

	if (goalMap.teacherId !== userId) {
		return yield* new GoalMapAccessDeniedError({
			goalMapId: input.goalMapId,
			userId,
		});
	}

	yield* Effect.tryPromise(() => db.delete(goalMaps).where(eq(goalMaps.id, input.goalMapId)));
	return true;
});

export const updateMaterial = Effect.fn("updateMaterial")(function* (
	userId: string,
	input: UpdateMaterialInput,
) {
	const db = yield* Database;

	// Authorization check
	const goalMap = yield* Effect.tryPromise(() =>
		db
			.select({
				teacherId: goalMaps.teacherId,
				textId: goalMaps.textId,
				title: goalMaps.title,
			})
			.from(goalMaps)
			.where(eq(goalMaps.id, input.goalMapId))
			.limit(1),
	);

	const existing = goalMap[0];
	if (!existing) {
		return yield* new GoalMapNotFoundError({ goalMapId: input.goalMapId });
	}

	if (existing.teacherId !== userId) {
		return yield* new GoalMapAccessDeniedError({
			goalMapId: input.goalMapId,
			userId,
		});
	}

	const hasMaterial =
		input.materialText?.trim() || (input.materialImages && input.materialImages.length > 0);

	let textId: string | null = existing.textId;

	if (hasMaterial) {
		if (existing.textId) {
			yield* db
				.update(texts)
				.set({
					content: input.materialText || "",
					images:
						input.materialImages && input.materialImages.length > 0
							? JSON.stringify(input.materialImages)
							: null,
					updatedAt: new Date(),
				})
				.where(eq(texts.id, existing.textId));
		} else {
			textId = crypto.randomUUID();
			yield* db.insert(texts).values({
				id: textId,
				title: `Material for ${existing.title}`,
				content: input.materialText || "",
				images:
					input.materialImages && input.materialImages.length > 0
						? JSON.stringify(input.materialImages)
						: null,
			});

			// Link text to goal map
			yield* db
				.update(goalMaps)
				.set({ textId, updatedAt: new Date() })
				.where(eq(goalMaps.id, input.goalMapId));
		}
	} else if (existing.textId) {
		// Clear material - delete text record and unlink
		yield* db.delete(texts).where(eq(texts.id, existing.textId));
		yield* db
			.update(goalMaps)
			.set({ textId: null, updatedAt: new Date() })
			.where(eq(goalMaps.id, input.goalMapId));
		textId = null;
	}

	return { goalMapId: input.goalMapId, textId };
});
