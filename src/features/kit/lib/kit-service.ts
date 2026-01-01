import { Data, Effect, Schema } from "effect";
import { desc, eq } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth-authorization";
import { goalMaps, kits } from "@/server/db/schema/app-schema";
import { Database } from "@/server/db/client";

export const GetKitInput = Schema.Struct({
	kitId: Schema.NonEmptyString,
});

export type GetKitInput = typeof GetKitInput.Type;

export const GetKitStatusInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});

export type GetKitStatusInput = typeof GetKitStatusInput.Type;

export const GenerateKitInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	layout: Schema.optionalWith(
		Schema.Union(Schema.Literal("preset"), Schema.Literal("random")),
		{ nullable: true },
	),
});

export type GenerateKitInput = typeof GenerateKitInput.Type;

class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export const listStudentKits = Effect.fn("listStudentKits")(() =>
	Effect.gen(function* () {
		const db = yield* Database;
		const rows = yield* db
			.select({
				goalMapId: goalMaps.id,
				title: goalMaps.title,
				description: goalMaps.description,
				updatedAt: goalMaps.updatedAt,
				teacherId: goalMaps.teacherId,
			})
			.from(goalMaps)
			.leftJoin(kits, eq(kits.goalMapId, goalMaps.id))
			.orderBy(desc(goalMaps.updatedAt));

		return rows.map((row) => ({
			goalMapId: row.goalMapId,
			title: row.title,
			description: row.description,
			updatedAt: row.updatedAt?.getTime() ?? 0,
			teacherId: row.teacherId,
		}));
	}),
);

export const getKit = Effect.fn("getKit")((input: GetKitInput) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const rows = yield* db
			.select({
				goalMapId: goalMaps.id,
				nodes: kits.nodes,
				edges: kits.edges,
			})
			.from(kits)
			.leftJoin(goalMaps, eq(kits.goalMapId, goalMaps.id))
			.where(eq(kits.goalMapId, input.kitId))
			.limit(1);

		const row = rows[0];
		if (!row) return null;

		const nodes = Array.isArray(row.nodes)
			? row.nodes
			: typeof row.nodes === "string"
				? (() => {
						try {
							return JSON.parse(row.nodes);
						} catch {
							return [];
						}
					})()
				: [];
		const edges = Array.isArray(row.edges)
			? row.edges
			: typeof row.edges === "string"
				? (() => {
						try {
							return JSON.parse(row.edges);
						} catch {
							return [];
						}
					})()
				: [];

		return {
			goalMapId: row.goalMapId,
			nodes,
			edges,
		};
	}),
);

export const getKitStatus = Effect.fn("getKitStatus")(
	(input: GetKitStatusInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const [kitRows, goalMapRows] = yield* Effect.all([
				db
					.select({
						id: kits.id,
						layout: kits.layout,
						nodes: kits.nodes,
						updatedAt: kits.updatedAt,
					})
					.from(kits)
					.where(eq(kits.goalMapId, input.goalMapId))
					.limit(1),
				db
					.select({ updatedAt: goalMaps.updatedAt })
					.from(goalMaps)
					.where(eq(goalMaps.id, input.goalMapId))
					.limit(1),
			]);

			const kit = kitRows[0];
			const goalMap = goalMapRows[0];

			const kitNodes = kit
				? Array.isArray(kit.nodes)
					? kit.nodes
					: typeof kit.nodes === "string"
						? (() => {
								try {
									return JSON.parse(kit.nodes);
								} catch {
									return [];
								}
							})()
						: []
				: [];
			const nodeCount = kitNodes.filter(
				(n: any) => n?.type === "text" || n?.type === "connector",
			).length;
			const kitUpdatedAt = kit?.updatedAt?.getTime() ?? null;
			const goalMapUpdatedAt = goalMap?.updatedAt?.getTime() ?? null;

			return {
				exists: !!kit,
				layout: kit?.layout ?? "preset",
				nodeCount,
				updatedAt: kitUpdatedAt,
				isOutdated:
					kitUpdatedAt && goalMapUpdatedAt
						? kitUpdatedAt < goalMapUpdatedAt
						: true,
			};
		}),
);

export const generateKit = Effect.fn("generateKit")(
	(userId: string, input: GenerateKitInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			yield* requireTeacher(userId);

			const gmRows = yield* db
				.select()
				.from(goalMaps)
				.where(eq(goalMaps.id, input.goalMapId))
				.limit(1);

			const gm = gmRows[0];
			if (!gm) {
				return yield* new GoalMapNotFoundError({ goalMapId: input.goalMapId });
			}

			const nodes = Array.isArray(gm.nodes)
				? gm.nodes
				: typeof gm.nodes === "string"
					? JSON.parse(gm.nodes)
					: [];

			const kitNodes = nodes.filter(
				(n: any) => n?.type === "text" || n?.type === "connector",
			);

			const kitEdges: any[] = [];

			const payload = {
				id: input.goalMapId,
				kitId: input.goalMapId,
				name: gm.title,
				goalMapId: input.goalMapId,
				teacherId: gm.teacherId ?? "",
				layout: input.layout ?? "preset",
				nodes: JSON.stringify(kitNodes),
				edges: JSON.stringify(kitEdges),
				textId: gm.textId,
			};

			const existingRows = yield* db
				.select({ id: kits.id })
				.from(kits)
				.where(eq(kits.goalMapId, input.goalMapId))
				.limit(1);

			const existing = existingRows[0];
			if (existing) {
				yield* db
					.update(kits)
					.set({
						name: payload.name,
						teacherId: payload.teacherId,
						layout: payload.layout,
						nodes: payload.nodes,
						edges: payload.edges,
						textId: payload.textId,
					})
					.where(eq(kits.goalMapId, input.goalMapId));
			} else {
				yield* db.insert(kits).values(payload);
			}
			return { ok: true, kitId: input.goalMapId } as const;
		}),
);
