import { and, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";

import { validateNodes } from "@/features/goal-map/lib/validator";
import { Database } from "@/server/db/client";
import { goalMaps, kits, texts } from "@/server/db/schema/app-schema";

import {
	DeleteGoalMapInput,
	GoalMapAccessDeniedError,
	GoalMapNotFoundError,
	GoalMapValidationError,
	NEW_GOAL_MAP_ID,
	SaveGoalMapInput,
	UpdateMaterialInput,
} from "./goal-map-service.shared";

export const saveGoalMap = Effect.fn("saveGoalMap")(function* (
	userId: string,
	data: SaveGoalMapInput,
) {
	const db = yield* Database;

	if (data.goalMapId !== NEW_GOAL_MAP_ID) {
		const goalMap = yield* Effect.tryPromise(() =>
			db
				.select({ teacherId: goalMaps.teacherId })
				.from(goalMaps)
				.where(and(eq(goalMaps.id, data.goalMapId), isNull(goalMaps.deletedAt)))
				.get(),
		);
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
			.where(and(eq(goalMaps.id, data.goalMapId), isNull(goalMaps.deletedAt)))
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
				.where(and(eq(texts.id, textId as string), isNull(texts.deletedAt)));
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
			where: and(eq(goalMaps.id, data.goalMapId), isNull(goalMaps.deletedAt)),
			target: goalMaps.id,
			set: payload,
		});

	if (data.publish || data.goalMapId !== NEW_GOAL_MAP_ID) {
		const kitRows = yield* db
			.select({ id: kits.id, layout: kits.layout })
			.from(kits)
			.where(and(eq(kits.goalMapId, data.goalMapId), isNull(kits.deletedAt)))
			.limit(1);

		if (data.publish || kitRows[0]) {
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
					.where(and(eq(kits.goalMapId, data.goalMapId), isNull(kits.deletedAt)));
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

export const deleteGoalMap = Effect.fn("deleteGoalMap")(function* (
	userId: string,
	input: DeleteGoalMapInput,
) {
	const db = yield* Database;

	const goalMap = yield* Effect.tryPromise(() =>
		db
			.select({ teacherId: goalMaps.teacherId })
			.from(goalMaps)
			.where(and(eq(goalMaps.id, input.goalMapId), isNull(goalMaps.deletedAt)))
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

	yield* db
		.update(goalMaps)
		.set({ deletedAt: new Date() })
		.where(and(eq(goalMaps.id, input.goalMapId), isNull(goalMaps.deletedAt)));
	return true;
});

export const updateMaterial = Effect.fn("updateMaterial")(function* (
	userId: string,
	input: UpdateMaterialInput,
) {
	const db = yield* Database;

	const goalMap = yield* Effect.tryPromise(() =>
		db
			.select({
				teacherId: goalMaps.teacherId,
				textId: goalMaps.textId,
				title: goalMaps.title,
			})
			.from(goalMaps)
			.where(and(eq(goalMaps.id, input.goalMapId), isNull(goalMaps.deletedAt)))
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
				.where(and(eq(texts.id, existing.textId), isNull(texts.deletedAt)));
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

			yield* db
				.update(goalMaps)
				.set({ textId, updatedAt: new Date() })
				.where(and(eq(goalMaps.id, input.goalMapId), isNull(goalMaps.deletedAt)));
		}
	} else if (existing.textId) {
		yield* db
			.update(texts)
			.set({ deletedAt: new Date() })
			.where(and(eq(texts.id, existing.textId), isNull(texts.deletedAt)));
		yield* db
			.update(goalMaps)
			.set({ textId: null, updatedAt: new Date() })
			.where(and(eq(goalMaps.id, input.goalMapId), isNull(goalMaps.deletedAt)));
		textId = null;
	}

	return { goalMapId: input.goalMapId, textId };
});
